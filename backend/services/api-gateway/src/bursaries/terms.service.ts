import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VerifyEnrollmentDto } from './dto/verify-enrollment.dto';
import { DisburseTermDto } from './dto/disburse-term.dto';

@Injectable()
export class TermsService {
  private readonly logger = new Logger(TermsService.name);
  private supabase: SupabaseClient;

  // SLA: 5 working days for payment after approval
  private readonly SLA_WORKING_DAYS = 5;

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

  async getTermsForApplication(applicationId: string, user: any) {
    const { data, error } = await this.supabase
      .from('bursary_terms')
      .select(`
        *,
        enrollment_verifier:profiles!bursary_terms_enrollment_verified_by_fkey(id, first_name, last_name),
        payment_approver:profiles!bursary_terms_payment_approved_by_fkey(id, first_name, last_name),
        disburser:profiles!bursary_terms_disbursed_by_fkey(id, first_name, last_name)
      `)
      .eq('application_id', applicationId)
      .order('term_number', { ascending: true });

    if (error) {
      this.logger.error('Failed to fetch terms', error);
      throw new BadRequestException('Failed to fetch terms');
    }

    // Add SLA status to each term
    const termsWithSla = data?.map(term => ({
      ...term,
      sla_status: this.calculateSlaStatus(term),
    }));

    return termsWithSla;
  }

  async createTermsForApplication(
    applicationId: string,
    termsData: { terms_count: number; academic_year: number },
    user: any
  ) {
    this.logger.log(`Creating ${termsData.terms_count} terms for application ${applicationId}`);

    // Verify application exists and is approved
    const { data: application, error: appError } = await this.supabase
      .from('bursary_applications')
      .select('id, status, approved_amount, tuition_fees, accommodation_fees, book_allowance')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== 'approved') {
      throw new BadRequestException('Can only create terms for approved applications');
    }

    // Check if terms already exist
    const { count } = await this.supabase
      .from('bursary_terms')
      .select('*', { count: 'exact', head: true })
      .eq('application_id', applicationId)
      .eq('academic_year', termsData.academic_year);

    if ((count || 0) > 0) {
      throw new BadRequestException('Terms already exist for this academic year');
    }

    // Calculate per-term amounts
    const approvedAmount = application.approved_amount || 0;
    const perTermTuition = Math.round((application.tuition_fees / termsData.terms_count) * 100) / 100;
    const perTermAccommodation = Math.round((application.accommodation_fees / termsData.terms_count) * 100) / 100;
    const perTermBooks = Math.round((application.book_allowance / termsData.terms_count) * 100) / 100;

    // Create terms
    const termsToInsert = [];
    for (let i = 1; i <= termsData.terms_count; i++) {
      const totalAmount = perTermTuition + perTermAccommodation + perTermBooks;
      termsToInsert.push({
        application_id: applicationId,
        term_number: i,
        academic_year: termsData.academic_year,
        term_name: `Term ${i}`,
        tuition_amount: perTermTuition,
        accommodation_amount: perTermAccommodation,
        book_allowance: perTermBooks,
        transport_allowance: 0,
        total_amount: totalAmount,
        payment_status: 'pending',
        enrollment_verified: false,
      });
    }

    const { data: terms, error } = await this.supabase
      .from('bursary_terms')
      .insert(termsToInsert)
      .select();

    if (error) {
      this.logger.error('Failed to create terms', error);
      throw new BadRequestException('Failed to create terms');
    }

    // Log audit
    await this.logAudit({
      user_id: user.id,
      action: 'bursary.terms_created',
      resource_type: 'bursary_application',
      resource_id: applicationId,
      details: { terms_count: termsData.terms_count, academic_year: termsData.academic_year },
    });

    return terms;
  }

  async verifyEnrollment(termId: string, verifyDto: VerifyEnrollmentDto, user: any) {
    this.logger.log(`User ${user.id} verifying enrollment for term ${termId}`);

    const term = await this.getTermById(termId);

    if (term.enrollment_verified) {
      throw new BadRequestException('Enrollment already verified for this term');
    }

    const { data: updated, error } = await this.supabase
      .from('bursary_terms')
      .update({
        enrollment_verified: verifyDto.enrollment_verified,
        enrollment_verified_at: new Date().toISOString(),
        enrollment_verified_by: user.id,
        enrollment_proof_document_id: verifyDto.enrollment_proof_document_id,
        enrollment_verification_notes: verifyDto.verification_notes,
        payment_status: verifyDto.enrollment_verified ? 'enrollment_verified' : 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', termId)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to verify enrollment', error);
      throw new BadRequestException('Failed to verify enrollment');
    }

    // Log audit
    await this.logAudit({
      user_id: user.id,
      action: 'bursary.enrollment_verified',
      resource_type: 'bursary_term',
      resource_id: termId,
      details: { verified: verifyDto.enrollment_verified, notes: verifyDto.verification_notes },
    });

    return updated;
  }

  async approveTerm(termId: string, user: any) {
    this.logger.log(`User ${user.id} approving term ${termId}`);

    const term = await this.getTermById(termId);

    // Check prerequisites
    if (!term.enrollment_verified) {
      throw new BadRequestException('Cannot approve - enrollment not verified');
    }

    if (term.payment_status !== 'enrollment_verified') {
      throw new BadRequestException(`Cannot approve term in status: ${term.payment_status}`);
    }

    // Calculate SLA due date (5 working days)
    const slaDueDate = await this.calculateSlaDueDate(new Date());

    const { data: updated, error } = await this.supabase
      .from('bursary_terms')
      .update({
        payment_status: 'approved',
        payment_approved_at: new Date().toISOString(),
        payment_approved_by: user.id,
        payment_due_date: slaDueDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', termId)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to approve term', error);
      throw new BadRequestException('Failed to approve term');
    }

    // Create SLA tracking record
    await this.supabase.from('bursary_sla_tracking').insert({
      term_id: termId,
      application_id: term.application_id,
      approval_date: new Date().toISOString(),
      sla_due_date: slaDueDate.toISOString(),
    });

    // Log audit
    await this.logAudit({
      user_id: user.id,
      action: 'bursary.term_approved',
      resource_type: 'bursary_term',
      resource_id: termId,
      details: { sla_due_date: slaDueDate.toISOString() },
    });

    return {
      ...updated,
      sla_due_date: slaDueDate.toISOString(),
      message: `Term payment approved. SLA: Payment must be disbursed by ${slaDueDate.toDateString()}`,
    };
  }

  async disburseTerm(termId: string, disburseDto: DisburseTermDto, user: any) {
    this.logger.log(`User ${user.id} disbursing term ${termId}`);

    const term = await this.getTermById(termId);

    // Check prerequisites using DB function
    const { data: prereqCheck, error: prereqError } = await this.supabase
      .rpc('can_disburse_bursary_term', { term_id: termId });

    if (prereqError) {
      // Fallback to manual checks if function doesn't exist
      if (term.payment_status !== 'approved') {
        throw new BadRequestException('Term payment not approved');
      }
      if (!term.enrollment_verified) {
        throw new BadRequestException('Enrollment not verified');
      }
    } else if (prereqCheck && !prereqCheck.can_disburse) {
      throw new BadRequestException(`Cannot disburse: ${prereqCheck.blockers.join(', ')}`);
    }

    const now = new Date();
    const disbursementDate = disburseDto.disbursement_date
      ? new Date(disburseDto.disbursement_date)
      : now;

    const { data: updated, error } = await this.supabase
      .from('bursary_terms')
      .update({
        payment_status: 'disbursed',
        disbursed_at: disbursementDate.toISOString(),
        disbursed_by: user.id,
        transaction_reference: disburseDto.transaction_reference,
        payment_method: disburseDto.payment_method,
        institution_account_name: disburseDto.institution_account_name,
        institution_account_number: disburseDto.institution_account_number,
        institution_bank_name: disburseDto.institution_bank_name,
        updated_at: now.toISOString(),
      })
      .eq('id', termId)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to disburse term', error);
      throw new BadRequestException('Failed to disburse term');
    }

    // Update SLA tracking
    const workingDays = await this.calculateWorkingDaysBetween(
      term.payment_approved_at ? new Date(term.payment_approved_at) : now,
      disbursementDate
    );

    await this.supabase
      .from('bursary_sla_tracking')
      .update({
        actual_payment_date: disbursementDate.toISOString(),
        working_days_taken: workingDays,
        sla_breached: workingDays > this.SLA_WORKING_DAYS,
        updated_at: now.toISOString(),
      })
      .eq('term_id', termId);

    // Check if all terms for this application are disbursed
    await this.checkAndUpdateApplicationStatus(term.application_id);

    // Log audit
    await this.logAudit({
      user_id: user.id,
      action: 'bursary.term_disbursed',
      resource_type: 'bursary_term',
      resource_id: termId,
      details: {
        amount: term.total_amount,
        transaction_reference: disburseDto.transaction_reference,
        working_days: workingDays,
        sla_breached: workingDays > this.SLA_WORKING_DAYS,
      },
    });

    return {
      ...updated,
      sla: {
        working_days_taken: workingDays,
        sla_target: this.SLA_WORKING_DAYS,
        breached: workingDays > this.SLA_WORKING_DAYS,
      },
    };
  }

  async getSlaReport(constituencyId?: string) {
    let query = this.supabase
      .from('bursary_sla_tracking')
      .select(`
        *,
        term:bursary_terms(
          id,
          term_number,
          total_amount,
          application:bursary_applications(
            id,
            application_number,
            student_name,
            constituency_id,
            constituency:constituencies(id, name)
          )
        )
      `)
      .order('sla_due_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to fetch SLA report', error);
      throw new BadRequestException('Failed to fetch SLA report');
    }

    // Filter by constituency if provided
    let filtered = data || [];
    if (constituencyId) {
      filtered = filtered.filter((sla: any) =>
        sla.term?.application?.constituency_id === constituencyId
      );
    }

    // Calculate summary statistics
    const totalPayments = filtered.length;
    const onTimePayments = filtered.filter((sla: any) => !sla.sla_breached && sla.actual_payment_date).length;
    const breachedPayments = filtered.filter((sla: any) => sla.sla_breached).length;
    const pendingPayments = filtered.filter((sla: any) => !sla.actual_payment_date).length;
    const overduePayments = filtered.filter((sla: any) =>
      !sla.actual_payment_date && new Date(sla.sla_due_date) < new Date()
    ).length;

    return {
      summary: {
        total_payments: totalPayments,
        on_time: onTimePayments,
        breached: breachedPayments,
        pending: pendingPayments,
        overdue: overduePayments,
        compliance_rate: totalPayments > 0
          ? Math.round((onTimePayments / (onTimePayments + breachedPayments)) * 100)
          : 100,
      },
      data: filtered,
    };
  }

  async getOverduePayments(constituencyId?: string) {
    const now = new Date();

    let query = this.supabase
      .from('bursary_sla_tracking')
      .select(`
        *,
        term:bursary_terms(
          id,
          term_number,
          total_amount,
          application:bursary_applications(
            id,
            application_number,
            student_name,
            institution_name,
            constituency_id,
            constituency:constituencies(id, name)
          )
        )
      `)
      .is('actual_payment_date', null)
      .lt('sla_due_date', now.toISOString())
      .order('sla_due_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to fetch overdue payments', error);
      throw new BadRequestException('Failed to fetch overdue payments');
    }

    let filtered = data || [];
    if (constituencyId) {
      filtered = filtered.filter((sla: any) =>
        sla.term?.application?.constituency_id === constituencyId
      );
    }

    // Add days overdue
    const overdueWithDays = filtered.map((sla: any) => ({
      ...sla,
      days_overdue: Math.ceil(
        (now.getTime() - new Date(sla.sla_due_date).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return overdueWithDays;
  }

  // ========== Helper Methods ==========

  private async getTermById(termId: string) {
    const { data, error } = await this.supabase
      .from('bursary_terms')
      .select('*')
      .eq('id', termId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Term with ID ${termId} not found`);
    }

    return data;
  }

  private calculateSlaStatus(term: any): { status: string; days_remaining?: number; days_overdue?: number } {
    if (term.payment_status === 'disbursed') {
      return { status: 'completed' };
    }

    if (!term.payment_due_date) {
      return { status: 'not_started' };
    }

    const now = new Date();
    const dueDate = new Date(term.payment_due_date);
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      return { status: 'overdue', days_overdue: Math.abs(daysUntilDue) };
    } else if (daysUntilDue <= 2) {
      return { status: 'due_soon', days_remaining: daysUntilDue };
    } else {
      return { status: 'on_track', days_remaining: daysUntilDue };
    }
  }

  private async calculateSlaDueDate(startDate: Date): Promise<Date> {
    // Try to use DB function
    const { data, error } = await this.supabase
      .rpc('calculate_sla_due_date', {
        start_date: startDate.toISOString(),
        working_days: this.SLA_WORKING_DAYS,
      });

    if (!error && data) {
      return new Date(data);
    }

    // Fallback: simple calculation (add 7 calendar days to account for weekends)
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + 7);
    return dueDate;
  }

  private async calculateWorkingDaysBetween(startDate: Date, endDate: Date): Promise<number> {
    // Simple calculation: count weekdays
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  private async checkAndUpdateApplicationStatus(applicationId: string) {
    const { data: terms } = await this.supabase
      .from('bursary_terms')
      .select('id, payment_status')
      .eq('application_id', applicationId);

    if (!terms || terms.length === 0) return;

    const allDisbursed = terms.every(t => t.payment_status === 'disbursed');

    if (allDisbursed) {
      await this.supabase
        .from('bursary_applications')
        .update({
          status: 'disbursed',
          disbursed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
    }
  }

  private async logAudit(auditData: any) {
    await this.supabase.from('audit_logs').insert(auditData);
  }
}
