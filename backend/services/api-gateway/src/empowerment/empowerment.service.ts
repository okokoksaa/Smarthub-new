import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateEmpowermentDto, GrantType } from './dto/create-empowerment.dto';
import { UpdateEmpowermentDto } from './dto/update-empowerment.dto';
import { ApproveEmpowermentDto, ApprovalDecision } from './dto/approve-empowerment.dto';
import { DisburseEmpowermentDto } from './dto/disburse-empowerment.dto';
import { applyScopeToRows } from '../common/scope/scope.utils';

@Injectable()
export class EmpowermentService {
  private readonly logger = new Logger(EmpowermentService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
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
    const { status, constituencyId, grantType, page = 1, limit = 20, scopeContext } = filters;

    let query = this.supabase
      .from('empowerment_grants')
      .select(`
        *,
        constituency:constituencies(id, name, code, district:districts(id, name, province:provinces(id, name))),
        ward:wards(id, name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (constituencyId) query = query.eq('constituency_id', constituencyId);
    if (grantType) query = query.eq('grant_type', grantType);

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      this.logger.error('Failed to fetch empowerment grants', error);
      throw new BadRequestException('Failed to fetch empowerment grants');
    }

    const scopedData = applyScopeToRows(data, scopeContext);

    return {
      data: scopedData,
      pagination: {
        page,
        limit,
        total: scopedData.length,
        pages: Math.ceil(scopedData.length / limit) || 1,
      },
    };
  }

  async findOne(id: string, user: any) {
    const { data, error } = await this.supabase
      .from('empowerment_grants')
      .select(`
        *,
        constituency:constituencies(id, name, code),
        ward:wards(id, name),
        reviewed_by_user:profiles!empowerment_grants_reviewed_by_fkey(id, first_name, last_name),
        approved_by_user:profiles!empowerment_grants_approved_by_fkey(id, first_name, last_name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Empowerment grant with ID ${id} not found`);
    }

    return data;
  }

  async create(createDto: CreateEmpowermentDto, user: any) {
    this.logger.log(`Creating empowerment grant by user ${user.id}`);

    // Validate constituency access
    const hasAccess = await this.validateUserConstituencyAccess(user.id, createDto.constituency_id);
    if (!hasAccess) {
      throw new ForbiddenException('User does not have access to this constituency');
    }

    // Check eligibility
    const eligibility = await this.checkEligibility(createDto);
    if (!eligibility.is_eligible) {
      throw new BadRequestException(`Eligibility not met: ${eligibility.blockers.join(', ')}`);
    }

    // Generate grant number
    const grantNumber = await this.generateGrantNumber(createDto.constituency_id);

    const { data: grant, error } = await this.supabase
      .from('empowerment_grants')
      .insert({
        grant_number: grantNumber,
        constituency_id: createDto.constituency_id,
        ward_id: createDto.ward_id,
        applicant_name: createDto.applicant_name,
        applicant_nrc: createDto.applicant_nrc,
        applicant_phone: createDto.applicant_phone,
        applicant_address: createDto.applicant_address,
        group_name: createDto.group_name,
        group_size: createDto.group_size,
        grant_type: createDto.grant_type,
        purpose: createDto.purpose,
        requested_amount: createDto.requested_amount,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create empowerment grant', error);
      throw new BadRequestException('Failed to create empowerment grant');
    }

    // Log audit trail
    await this.logAudit({
      user_id: user.id,
      action: 'empowerment.grant_created',
      resource_type: 'empowerment_grant',
      resource_id: grant.id,
      details: {
        grant_number: grantNumber,
        applicant_name: createDto.applicant_name,
        grant_type: createDto.grant_type,
        requested_amount: createDto.requested_amount,
      },
    });

    return grant;
  }

  async update(id: string, updateDto: UpdateEmpowermentDto, user: any) {
    const grant = await this.findOne(id, user);

    if (grant.status !== 'submitted') {
      throw new BadRequestException('Can only update grants in submitted status');
    }

    const { data, error } = await this.supabase
      .from('empowerment_grants')
      .update({
        ...updateDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to update empowerment grant');
    }

    return data;
  }

  async shortlist(id: string, user: any, comments?: string) {
    this.logger.log(`User ${user.id} shortlisting grant ${id}`);

    const grant = await this.findOne(id, user);

    if (grant.status !== 'submitted') {
      throw new BadRequestException('Only submitted grants can be shortlisted');
    }

    const { data, error } = await this.supabase
      .from('empowerment_grants')
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
      throw new BadRequestException('Failed to shortlist grant');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'empowerment.grant_shortlisted',
      resource_type: 'empowerment_grant',
      resource_id: id,
      details: { comments },
    });

    return data;
  }

  async approve(id: string, approveDto: ApproveEmpowermentDto, user: any) {
    this.logger.log(`User ${user.id} processing approval for grant ${id}`);

    const grant = await this.findOne(id, user);

    if (grant.status !== 'shortlisted' && grant.status !== 'submitted') {
      throw new BadRequestException(`Cannot approve grant in status: ${grant.status}`);
    }

    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (approveDto.decision === ApprovalDecision.APPROVE) {
      // Check training requirement for certain grant types
      const requiresTraining = ['women_group', 'youth_group', 'cooperative'].includes(grant.grant_type);
      if (requiresTraining && !approveDto.training_requirement) {
        throw new BadRequestException('Training requirement must be specified for this grant type');
      }

      updateData.status = 'approved';
      updateData.approved_amount = approveDto.approved_amount || grant.requested_amount;
      updateData.approved_by = user.id;
      updateData.approved_at = new Date().toISOString();
    } else {
      if (!approveDto.rejection_reason) {
        throw new BadRequestException('Rejection reason is required');
      }
      updateData.status = 'rejected';
      updateData.reviewed_by = user.id;
      updateData.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('empowerment_grants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to process approval');
    }

    await this.logAudit({
      user_id: user.id,
      action: `empowerment.grant_${updateData.status}`,
      resource_type: 'empowerment_grant',
      resource_id: id,
      details: {
        decision: approveDto.decision,
        approved_amount: updateData.approved_amount,
        rejection_reason: approveDto.rejection_reason,
      },
    });

    return data;
  }

  async disburse(id: string, disburseDto: DisburseEmpowermentDto, user: any) {
    this.logger.log(`User ${user.id} disbursing grant ${id}`);

    const grant = await this.findOne(id, user);

    if (grant.status !== 'approved') {
      throw new BadRequestException('Only approved grants can be disbursed');
    }

    // Check budget availability
    const budgetAvailable = await this.checkBudgetAvailability(
      grant.constituency_id,
      grant.approved_amount
    );
    if (!budgetAvailable) {
      throw new BadRequestException('Insufficient empowerment budget for this disbursement');
    }

    const { data, error } = await this.supabase
      .from('empowerment_grants')
      .update({
        status: 'disbursed',
        disbursed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to disburse grant');
    }

    // Create payment record
    await this.createPaymentRecord(grant, disburseDto, user.id);

    await this.logAudit({
      user_id: user.id,
      action: 'empowerment.grant_disbursed',
      resource_type: 'empowerment_grant',
      resource_id: id,
      details: {
        approved_amount: grant.approved_amount,
        payment_reference: disburseDto.payment_reference,
        payment_method: disburseDto.payment_method,
      },
    });

    return data;
  }

  async submitCompletionReport(id: string, report: string, user: any) {
    const grant = await this.findOne(id, user);

    if (grant.status !== 'disbursed') {
      throw new BadRequestException('Can only submit completion report for disbursed grants');
    }

    const { data, error } = await this.supabase
      .from('empowerment_grants')
      .update({
        status: 'completed',
        completion_report: report,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to submit completion report');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'empowerment.completion_report_submitted',
      resource_type: 'empowerment_grant',
      resource_id: id,
      details: { report_length: report.length },
    });

    return data;
  }

  async getStatus(id: string, user: any) {
    const grant = await this.findOne(id, user);

    // Check eligibility
    const eligibility = await this.checkEligibilityById(id);

    return {
      id: grant.id,
      grant_number: grant.grant_number,
      status: grant.status,
      applicant_name: grant.applicant_name,
      grant_type: grant.grant_type,
      financial: {
        requested_amount: grant.requested_amount,
        approved_amount: grant.approved_amount,
      },
      eligibility,
      workflow: {
        can_shortlist: grant.status === 'submitted',
        can_approve: grant.status === 'submitted' || grant.status === 'shortlisted',
        can_disburse: grant.status === 'approved',
        can_submit_report: grant.status === 'disbursed',
      },
      timeline: {
        submitted_at: grant.submitted_at,
        reviewed_at: grant.reviewed_at,
        approved_at: grant.approved_at,
        disbursed_at: grant.disbursed_at,
      },
    };
  }

  async getAnalytics(constituencyId: string) {
    // Get grant statistics
    const { data: grants, error } = await this.supabase
      .from('empowerment_grants')
      .select('status, grant_type, requested_amount, approved_amount')
      .eq('constituency_id', constituencyId);

    if (error) {
      throw new BadRequestException('Failed to fetch analytics');
    }

    const stats = {
      total_applications: grants?.length || 0,
      by_status: {} as Record<string, number>,
      by_type: {} as Record<string, number>,
      total_requested: 0,
      total_approved: 0,
      total_disbursed: 0,
    };

    grants?.forEach(grant => {
      // By status
      stats.by_status[grant.status] = (stats.by_status[grant.status] || 0) + 1;

      // By type
      stats.by_type[grant.grant_type] = (stats.by_type[grant.grant_type] || 0) + 1;

      // Financial totals
      stats.total_requested += grant.requested_amount || 0;
      if (grant.approved_amount) {
        stats.total_approved += grant.approved_amount;
      }
      if (grant.status === 'disbursed' || grant.status === 'completed') {
        stats.total_disbursed += grant.approved_amount || 0;
      }
    });

    return stats;
  }

  // ========== Eligibility Methods ==========

  async checkEligibility(dto: CreateEmpowermentDto) {
    const checks: Array<{ name: string; passed: boolean; reason?: string }> = [];
    const blockers: string[] = [];

    // Check 1: NRC format (if provided)
    if (dto.applicant_nrc) {
      const nrcValid = /^\d{6}\/\d{2}\/\d$/.test(dto.applicant_nrc);
      checks.push({
        name: 'nrc_format',
        passed: nrcValid,
        reason: nrcValid ? undefined : 'Invalid NRC format',
      });
      if (!nrcValid) blockers.push('Invalid NRC format');
    }

    // Check 2: Group size for group grants
    if (['group', 'women_group', 'youth_group', 'cooperative', 'disability_group'].includes(dto.grant_type)) {
      const hasGroupInfo = dto.group_name && dto.group_size && dto.group_size >= 5;
      checks.push({
        name: 'group_requirements',
        passed: !!hasGroupInfo,
        reason: hasGroupInfo ? undefined : 'Group grants require group name and at least 5 members',
      });
      if (!hasGroupInfo) blockers.push('Group grants require group name and minimum 5 members');
    }

    // Check 3: Amount within limits
    const maxAmount = this.getMaxGrantAmount(dto.grant_type);
    const amountValid = dto.requested_amount <= maxAmount;
    checks.push({
      name: 'amount_limit',
      passed: amountValid,
      reason: amountValid ? undefined : `Requested amount exceeds maximum of K${maxAmount.toLocaleString()}`,
    });
    if (!amountValid) blockers.push(`Amount exceeds maximum of K${maxAmount.toLocaleString()}`);

    // Check 4: No duplicate active grants (by NRC)
    if (dto.applicant_nrc) {
      const { data: existing } = await this.supabase
        .from('empowerment_grants')
        .select('id')
        .eq('applicant_nrc', dto.applicant_nrc)
        .in('status', ['submitted', 'shortlisted', 'approved'])
        .limit(1);

      const noDuplicate = !existing || existing.length === 0;
      checks.push({
        name: 'no_duplicate',
        passed: noDuplicate,
        reason: noDuplicate ? undefined : 'Applicant has an active grant application',
      });
      if (!noDuplicate) blockers.push('Applicant has an active grant application');
    }

    return {
      is_eligible: blockers.length === 0,
      checks,
      blockers,
    };
  }

  private async checkEligibilityById(id: string) {
    const grant = await this.findOne(id, null);

    return this.checkEligibility({
      constituency_id: grant.constituency_id,
      ward_id: grant.ward_id,
      applicant_name: grant.applicant_name,
      applicant_nrc: grant.applicant_nrc,
      grant_type: grant.grant_type as GrantType,
      purpose: grant.purpose,
      requested_amount: grant.requested_amount,
      group_name: grant.group_name,
      group_size: grant.group_size,
    });
  }

  private getMaxGrantAmount(grantType: string): number {
    const limits: Record<string, number> = {
      individual: 15000,
      group: 50000,
      cooperative: 100000,
      women_group: 75000,
      youth_group: 50000,
      disability_group: 75000,
    };
    return limits[grantType] || 15000;
  }

  // ========== Helper Methods ==========

  private async generateGrantNumber(constituencyId: string): Promise<string> {
    const year = new Date().getFullYear();

    const { data: constituency } = await this.supabase
      .from('constituencies')
      .select('code')
      .eq('id', constituencyId)
      .single();

    const code = constituency?.code || 'UNK';

    const { count } = await this.supabase
      .from('empowerment_grants')
      .select('*', { count: 'exact', head: true })
      .eq('constituency_id', constituencyId)
      .gte('created_at', `${year}-01-01`);

    const sequence = String((count || 0) + 1).padStart(4, '0');
    return `EMP-${code}-${year}-${sequence}`;
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

  private async checkBudgetAvailability(constituencyId: string, amount: number): Promise<boolean> {
    const year = new Date().getFullYear();

    const { data: budget } = await this.supabase
      .from('budgets')
      .select('empowerment_allocation, disbursed_amount')
      .eq('constituency_id', constituencyId)
      .eq('fiscal_year', year)
      .single();

    if (!budget) return true; // No budget set, allow (will be tracked)

    const { data: disbursed } = await this.supabase
      .from('empowerment_grants')
      .select('approved_amount')
      .eq('constituency_id', constituencyId)
      .eq('status', 'disbursed')
      .gte('disbursed_at', `${year}-01-01`);

    const totalDisbursed = disbursed?.reduce((sum, g) => sum + (g.approved_amount || 0), 0) || 0;
    const available = (budget.empowerment_allocation || 0) - totalDisbursed;

    return amount <= available;
  }

  private async createPaymentRecord(grant: any, disburseDto: DisburseEmpowermentDto, userId: string) {
    await this.supabase.from('payments').insert({
      constituency_id: grant.constituency_id,
      project_id: null,
      payment_type: 'empowerment_grant',
      payee_name: grant.applicant_name,
      amount: grant.approved_amount,
      reference_number: disburseDto.payment_reference,
      payment_method: disburseDto.payment_method,
      status: 'disbursed',
      disbursed_at: new Date().toISOString(),
      created_by: userId,
      metadata: {
        empowerment_grant_id: grant.id,
        grant_number: grant.grant_number,
        grant_type: grant.grant_type,
      },
    });
  }

  private async logAudit(auditData: any) {
    await this.supabase.from('audit_logs').insert(auditData);
  }
}
