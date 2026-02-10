import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApproveApplicationDto, ApprovalDecision } from './dto/approve-application.dto';
import { EligibilityService } from './eligibility.service';

@Injectable()
export class BursariesService {
  private readonly logger = new Logger(BursariesService.name);
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private eligibilityService: EligibilityService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async findAll(filters: any) {
    const { status, constituencyId, academicYear, institutionType, page, limit, user } = filters;

    let query = this.supabase
      .from('bursary_applications')
      .select(`
        *,
        constituency:constituencies(id, name, code),
        ward:wards(id, name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (constituencyId) {
      query = query.eq('constituency_id', constituencyId);
    }

    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    if (institutionType) {
      query = query.eq('institution_type', institutionType);
    }

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      this.logger.error('Failed to fetch bursary applications', error);
      throw new BadRequestException('Failed to fetch bursary applications');
    }

    return {
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async findOne(id: string, user: any) {
    const { data, error } = await this.supabase
      .from('bursary_applications')
      .select(`
        *,
        constituency:constituencies(id, name, code),
        ward:wards(id, name),
        reviewed_by_user:profiles!bursary_applications_reviewed_by_fkey(id, first_name, last_name, email),
        approved_by_user:profiles!bursary_applications_approved_by_fkey(id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Bursary application with ID ${id} not found`);
    }

    return data;
  }

  async create(createApplicationDto: CreateApplicationDto, user: any) {
    this.logger.log(`Creating bursary application by user ${user.id}`);

    // Validate constituency access
    const hasAccess = await this.validateUserConstituencyAccess(user.id, createApplicationDto.constituency_id);
    if (!hasAccess) {
      throw new ForbiddenException('User does not have access to this constituency');
    }

    // Pre-check eligibility
    const eligibility = await this.eligibilityService.preCheckEligibility(createApplicationDto);
    if (!eligibility.is_eligible) {
      throw new BadRequestException(`Eligibility requirements not met: ${eligibility.blockers.join(', ')}`);
    }

    // Calculate total requested
    const totalRequested =
      (createApplicationDto.tuition_fees || 0) +
      (createApplicationDto.accommodation_fees || 0) +
      (createApplicationDto.book_allowance || 0);

    // Generate application number
    const applicationNumber = await this.generateApplicationNumber(createApplicationDto.constituency_id);

    const { data: application, error } = await this.supabase
      .from('bursary_applications')
      .insert({
        application_number: applicationNumber,
        constituency_id: createApplicationDto.constituency_id,
        ward_id: createApplicationDto.ward_id,
        academic_year: createApplicationDto.academic_year,
        student_name: createApplicationDto.student_name,
        student_nrc: createApplicationDto.student_nrc,
        student_phone: createApplicationDto.student_phone,
        guardian_name: createApplicationDto.guardian_name,
        guardian_phone: createApplicationDto.guardian_phone,
        guardian_nrc: createApplicationDto.guardian_nrc,
        institution_name: createApplicationDto.institution_name,
        institution_type: createApplicationDto.institution_type,
        program_of_study: createApplicationDto.program_of_study,
        year_of_study: createApplicationDto.year_of_study,
        tuition_fees: createApplicationDto.tuition_fees,
        accommodation_fees: createApplicationDto.accommodation_fees || 0,
        book_allowance: createApplicationDto.book_allowance || 0,
        total_requested: totalRequested,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create bursary application', error);
      throw new BadRequestException('Failed to create bursary application');
    }

    // Log audit trail
    await this.logAudit({
      user_id: user.id,
      action: 'bursary.application_created',
      resource_type: 'bursary_application',
      resource_id: application.id,
      details: {
        student_name: application.student_name,
        total_requested: totalRequested,
        institution: application.institution_name,
      },
    });

    return application;
  }

  async shortlist(id: string, approveDto: ApproveApplicationDto, user: any) {
    this.logger.log(`User ${user.id} shortlisting application ${id}`);

    const application = await this.findOne(id, user);

    if (application.status !== 'submitted') {
      throw new BadRequestException('Only submitted applications can be shortlisted');
    }

    const { data: updated, error } = await this.supabase
      .from('bursary_applications')
      .update({
        status: 'shortlisted',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to shortlist application', error);
      throw new BadRequestException('Failed to shortlist application');
    }

    // Log audit
    await this.logAudit({
      user_id: user.id,
      action: 'bursary.application_shortlisted',
      resource_type: 'bursary_application',
      resource_id: id,
      details: { comments: approveDto.comments },
    });

    return updated;
  }

  async approve(id: string, approveDto: ApproveApplicationDto, user: any) {
    this.logger.log(`User ${user.id} processing approval for application ${id}`);

    const application = await this.findOne(id, user);

    // Validate current status
    if (application.status !== 'shortlisted' && application.status !== 'submitted') {
      throw new BadRequestException(`Cannot approve application in status: ${application.status}`);
    }

    // Check eligibility before approval
    if (approveDto.decision === ApprovalDecision.APPROVE) {
      const eligibility = await this.eligibilityService.checkEligibility(id);
      if (!eligibility.is_eligible) {
        throw new BadRequestException(`Cannot approve - eligibility not met: ${eligibility.blockers.join(', ')}`);
      }

      // Check for admission letter document
      const hasAdmissionLetter = await this.checkAdmissionLetter(id, application.constituency_id);
      if (!hasAdmissionLetter) {
        throw new BadRequestException('Cannot approve - admission letter document not uploaded');
      }
    }

    let newStatus: string;
    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    switch (approveDto.decision) {
      case ApprovalDecision.APPROVE:
        newStatus = 'approved';
        updateData.approved_by = user.id;
        updateData.approved_at = new Date().toISOString();
        updateData.approved_amount = approveDto.approved_amount || application.total_requested;
        break;
      case ApprovalDecision.REJECT:
        newStatus = 'rejected';
        updateData.rejection_reason = approveDto.rejection_reason;
        updateData.reviewed_by = user.id;
        updateData.reviewed_at = new Date().toISOString();
        break;
      default:
        throw new BadRequestException('Invalid decision');
    }

    updateData.status = newStatus;

    const { data: updated, error } = await this.supabase
      .from('bursary_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update application', error);
      throw new BadRequestException('Failed to process approval');
    }

    // Log audit
    await this.logAudit({
      user_id: user.id,
      action: `bursary.application_${newStatus}`,
      resource_type: 'bursary_application',
      resource_id: id,
      details: {
        decision: approveDto.decision,
        approved_amount: updateData.approved_amount,
        rejection_reason: approveDto.rejection_reason,
      },
    });

    return updated;
  }

  async getStatus(id: string, user: any) {
    const application = await this.findOne(id, user);

    // Get terms for this application
    const { data: terms } = await this.supabase
      .from('bursary_terms')
      .select('id, term_number, academic_year, payment_status, enrollment_verified, disbursed_at')
      .eq('application_id', id)
      .order('term_number', { ascending: true });

    // Check eligibility
    const eligibility = await this.eligibilityService.checkEligibility(id);

    // Check admission letter
    const hasAdmissionLetter = await this.checkAdmissionLetter(id, application.constituency_id);

    return {
      id: application.id,
      application_number: application.application_number,
      status: application.status,
      student_name: application.student_name,
      institution_name: application.institution_name,
      academic_year: application.academic_year,
      financial: {
        total_requested: application.total_requested,
        approved_amount: application.approved_amount,
      },
      eligibility: {
        is_eligible: eligibility.is_eligible,
        checks: eligibility.checks,
        blockers: eligibility.blockers,
      },
      documents: {
        has_admission_letter: hasAdmissionLetter,
      },
      terms: terms || [],
      workflow: {
        can_shortlist: application.status === 'submitted',
        can_approve: (application.status === 'submitted' || application.status === 'shortlisted')
                     && eligibility.is_eligible && hasAdmissionLetter,
        can_disburse: application.status === 'approved',
      },
      timeline: {
        submitted_at: application.submitted_at,
        reviewed_at: application.reviewed_at,
        approved_at: application.approved_at,
        disbursed_at: application.disbursed_at,
      },
    };
  }

  // ========== Helper Methods ==========

  private async generateApplicationNumber(constituencyId: string): Promise<string> {
    const year = new Date().getFullYear();

    const { data: constituency } = await this.supabase
      .from('constituencies')
      .select('code')
      .eq('id', constituencyId)
      .single();

    const code = constituency?.code || 'UNK';

    const { count } = await this.supabase
      .from('bursary_applications')
      .select('*', { count: 'exact', head: true })
      .eq('constituency_id', constituencyId)
      .gte('created_at', `${year}-01-01`);

    const sequence = String((count || 0) + 1).padStart(4, '0');
    return `BUR-${code}-${year}-${sequence}`;
  }

  private async validateUserConstituencyAccess(userId: string, constituencyId: string): Promise<boolean> {
    const { data: userRoles } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const roles = userRoles?.map(r => r.role) || [];
    if (roles.includes('super_admin') || roles.includes('ministry_official') || roles.includes('auditor')) {
      return true;
    }

    const { data: assignment } = await this.supabase
      .from('user_assignments')
      .select('constituency_id, province_id')
      .eq('user_id', userId)
      .single();

    if (!assignment) return false;

    if (assignment.constituency_id === constituencyId) return true;

    if (assignment.province_id) {
      const { data: constituency } = await this.supabase
        .from('constituencies')
        .select('district:districts(province_id)')
        .eq('id', constituencyId)
        .single();

      const district = constituency?.district as any;
      return district?.province_id === assignment.province_id;
    }

    return false;
  }

  private async checkAdmissionLetter(applicationId: string, constituencyId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('documents')
      .select('id')
      .eq('constituency_id', constituencyId)
      .eq('document_type', 'admission_letter')
      .contains('metadata', { application_id: applicationId })
      .limit(1);

    return data && data.length > 0;
  }

  private async logAudit(auditData: any) {
    await this.supabase.from('audit_logs').insert(auditData);
  }
}
