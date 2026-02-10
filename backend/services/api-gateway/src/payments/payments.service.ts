import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApprovePanelDto } from './dto/approve-panel.dto';
import { DisbursePaymentDto } from './dto/disburse-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
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
    const { status, projectId, constituencyId, page, limit, user } = filters;

    let query = this.supabase
      .from('payments')
      .select(`
        *,
        project:projects(id, title, constituency_id),
        panel_a_approver:profiles!payments_panel_a_approved_by_fkey(id, email, first_name, last_name),
        panel_b_approver:profiles!payments_panel_b_approved_by_fkey(id, email, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (constituencyId) {
      query = query.eq('project.constituency_id', constituencyId);
    }

    // Apply RLS based on user role
    // Super admin and auditors can see all
    // Others see only their constituency/province

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      this.logger.error('Failed to fetch payments', error);
      throw new BadRequestException('Failed to fetch payments');
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
      .from('payments')
      .select(`
        *,
        project:projects(
          id,
          title,
          constituency_id,
          constituency:constituencies(id, name, code)
        ),
        milestone:milestones(id, name, amount, due_date),
        panel_a_approver:profiles!payments_panel_a_approved_by_fkey(id, email, first_name, last_name),
        panel_b_approver:profiles!payments_panel_b_approved_by_fkey(id, email, first_name, last_name),
        disbursed_by_user:profiles!payments_disbursed_by_fkey(id, email, first_name, last_name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return data;
  }

  async create(createPaymentDto: CreatePaymentDto, user: any) {
    this.logger.log(`Creating payment request for project ${createPaymentDto.project_id} by user ${user.id}`);

    // 1. Validate project exists and is approved
    const { data: project, error: projectError } = await this.supabase
      .from('projects')
      .select('id, status, estimated_budget, total_disbursed, constituency_id')
      .eq('id', createPaymentDto.project_id)
      .single();

    if (projectError || !project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status !== 'approved') {
      throw new BadRequestException('Can only create payments for approved projects');
    }

    // 2. Validate milestone exists and not already paid (if milestone payment)
    if (createPaymentDto.milestone_id) {
      const { data: milestone, error: milestoneError } = await this.supabase
        .from('milestones')
        .select('id, status, amount')
        .eq('id', createPaymentDto.milestone_id)
        .eq('project_id', createPaymentDto.project_id)
        .single();

      if (milestoneError || !milestone) {
        throw new NotFoundException('Milestone not found');
      }

      if (milestone.status === 'paid') {
        throw new BadRequestException('Milestone already paid');
      }

      // Amount must match milestone allocation
      if (createPaymentDto.amount !== milestone.amount) {
        throw new BadRequestException(
          `Payment amount must match milestone allocation (${milestone.amount} ZMW)`
        );
      }
    }

    // 3. Check budget availability
    const availableBudget = project.estimated_budget - (project.total_disbursed || 0);
    if (createPaymentDto.amount > availableBudget) {
      throw new BadRequestException(
        `Insufficient budget. Available: ${availableBudget} ZMW, Requested: ${createPaymentDto.amount} ZMW`
      );
    }

    // 4. Validate user has authority in this constituency
    const hasAuthority = await this.validateUserConstituencyAccess(user.id, project.constituency_id);
    if (!hasAuthority) {
      throw new ForbiddenException('User does not have authority in this constituency');
    }

    // 5. Create payment request
    const { data: payment, error: paymentError } = await this.supabase
      .from('payments')
      .insert({
        project_id: createPaymentDto.project_id,
        milestone_id: createPaymentDto.milestone_id,
        amount: createPaymentDto.amount,
        payment_type: createPaymentDto.payment_type,
        recipient_name: createPaymentDto.recipient_name,
        recipient_account: createPaymentDto.recipient_account,
        recipient_bank: createPaymentDto.recipient_bank,
        description: createPaymentDto.description,
        supporting_documents: createPaymentDto.supporting_documents,
        status: 'pending',
        requested_by: user.id,
      })
      .select()
      .single();

    if (paymentError) {
      this.logger.error('Failed to create payment', paymentError);
      throw new BadRequestException('Failed to create payment request');
    }

    // 6. Log audit trail
    await this.logAudit({
      user_id: user.id,
      action: 'payment.created',
      resource_type: 'payment',
      resource_id: payment.id,
      details: { amount: payment.amount, project_id: payment.project_id },
    });

    return payment;
  }

  async approvePanelA(id: string, user: any, approvePanelDto: ApprovePanelDto) {
    this.logger.log(`Panel A approval for payment ${id} by user ${user.id}`);

    // 1. Get payment with lock
    const payment = await this.findOne(id, user);

    // 2. Validate payment status
    if (payment.status !== 'pending') {
      throw new BadRequestException(`Payment is not pending (current status: ${payment.status})`);
    }

    // 3. Check if already approved by Panel A
    if (payment.panel_a_approved_by) {
      throw new BadRequestException('Payment already approved by Panel A');
    }

    // 4. Validate user has Panel A authority (checked by @Roles decorator)
    const userRoles = await this.getUserRoles(user.id);
    const panelARoles = ['mp', 'cdfc_chair', 'finance_officer'];
    const hasAuthority = userRoles.some(role => panelARoles.includes(role));

    if (!hasAuthority) {
      throw new ForbiddenException('User does not have Panel A approval authority');
    }

    // 5. Update payment
    const { data: updatedPayment, error } = await this.supabase
      .from('payments')
      .update({
        panel_a_approved_by: user.id,
        panel_a_approved_at: new Date().toISOString(),
        panel_a_decision: approvePanelDto.decision,
        panel_a_comments: approvePanelDto.comments,
        status: approvePanelDto.decision === 'rejected' ? 'rejected' : 'panel_a_approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update payment', error);
      throw new BadRequestException('Failed to record Panel A approval');
    }

    // 6. Log audit trail
    await this.logAudit({
      user_id: user.id,
      action: 'payment.panel_a_approval',
      resource_type: 'payment',
      resource_id: id,
      details: {
        decision: approvePanelDto.decision,
        comments: approvePanelDto.comments,
      },
    });

    // 7. Notify Panel B members if approved
    if (approvePanelDto.decision === 'approved') {
      // TODO: Send notifications to Panel B members
    }

    return updatedPayment;
  }

  async approvePanelB(id: string, user: any, approvePanelDto: ApprovePanelDto) {
    this.logger.log(`Panel B approval for payment ${id} by user ${user.id}`);

    // 1. Get payment
    const payment = await this.findOne(id, user);

    // 2. CRITICAL: Panel A must be approved first
    if (payment.status !== 'panel_a_approved') {
      throw new BadRequestException('Panel A must approve before Panel B');
    }

    // 3. Check if already approved by Panel B
    if (payment.panel_b_approved_by) {
      throw new BadRequestException('Payment already approved by Panel B');
    }

    // 4. CRITICAL: Same user cannot approve both panels
    if (payment.panel_a_approved_by === user.id) {
      throw new ForbiddenException('Same user cannot approve in both Panel A and Panel B');
    }

    // 5. Validate user has Panel B authority
    const userRoles = await this.getUserRoles(user.id);
    const panelBRoles = ['plgo', 'ministry_official'];
    const hasAuthority = userRoles.some(role => panelBRoles.includes(role));

    if (!hasAuthority) {
      throw new ForbiddenException('User does not have Panel B approval authority');
    }

    // 6. Update payment
    const { data: updatedPayment, error } = await this.supabase
      .from('payments')
      .update({
        panel_b_approved_by: user.id,
        panel_b_approved_at: new Date().toISOString(),
        panel_b_decision: approvePanelDto.decision,
        panel_b_comments: approvePanelDto.comments,
        status: approvePanelDto.decision === 'rejected' ? 'rejected' : 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update payment', error);
      throw new BadRequestException('Failed to record Panel B approval');
    }

    // 7. Log audit trail
    await this.logAudit({
      user_id: user.id,
      action: 'payment.panel_b_approval',
      resource_type: 'payment',
      resource_id: id,
      details: {
        decision: approvePanelDto.decision,
        comments: approvePanelDto.comments,
      },
    });

    // 8. Notify finance team for disbursement if approved
    if (approvePanelDto.decision === 'approved') {
      // TODO: Notify finance officers for disbursement
    }

    return updatedPayment;
  }

  async disburse(id: string, user: any, disbursePaymentDto: DisbursePaymentDto) {
    this.logger.log(`Disbursing payment ${id} by user ${user.id}`);

    // 1. Get payment
    const payment = await this.findOne(id, user);

    // 2. CRITICAL: Both panels must be approved
    if (payment.status !== 'approved') {
      throw new BadRequestException('Payment must be approved by both Panel A and Panel B');
    }

    // 3. Check if already disbursed
    if (payment.disbursed_at) {
      throw new BadRequestException('Payment already disbursed');
    }

    // 4. Update payment
    const { data: updatedPayment, error } = await this.supabase
      .from('payments')
      .update({
        status: 'disbursed',
        disbursed_by: user.id,
        disbursed_at: new Date().toISOString(),
        transaction_reference: disbursePaymentDto.transaction_reference,
        disbursement_date: disbursePaymentDto.disbursement_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to disburse payment', error);
      throw new BadRequestException('Failed to disburse payment');
    }

    // 5. Update milestone status if milestone payment
    if (payment.milestone_id) {
      await this.supabase
        .from('milestones')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', payment.milestone_id);
    }

    // 6. Update project total_disbursed
    await this.updateProjectBudget(payment.project_id, payment.amount);

    // 7. Log audit trail
    await this.logAudit({
      user_id: user.id,
      action: 'payment.disbursed',
      resource_type: 'payment',
      resource_id: id,
      details: {
        amount: payment.amount,
        transaction_reference: disbursePaymentDto.transaction_reference,
      },
    });

    return updatedPayment;
  }

  async getStatus(id: string, user: any) {
    const payment = await this.findOne(id, user);

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      workflow: {
        panel_a: {
          approved: !!payment.panel_a_approved_by,
          approved_by: payment.panel_a_approver,
          approved_at: payment.panel_a_approved_at,
          decision: payment.panel_a_decision,
          comments: payment.panel_a_comments,
        },
        panel_b: {
          approved: !!payment.panel_b_approved_by,
          approved_by: payment.panel_b_approver,
          approved_at: payment.panel_b_approved_at,
          decision: payment.panel_b_decision,
          comments: payment.panel_b_comments,
        },
        disbursement: {
          disbursed: !!payment.disbursed_at,
          disbursed_by: payment.disbursed_by_user,
          disbursed_at: payment.disbursed_at,
          transaction_reference: payment.transaction_reference,
        },
      },
      timeline: [
        { event: 'created', timestamp: payment.created_at, user: user },
        payment.panel_a_approved_at && { event: 'panel_a_approved', timestamp: payment.panel_a_approved_at },
        payment.panel_b_approved_at && { event: 'panel_b_approved', timestamp: payment.panel_b_approved_at },
        payment.disbursed_at && { event: 'disbursed', timestamp: payment.disbursed_at },
      ].filter(Boolean),
    };
  }

  // Helper methods
  private async getUserRoles(userId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    return data?.map(r => r.role) || [];
  }

  private async validateUserConstituencyAccess(userId: string, constituencyId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('user_assignments')
      .select('constituency_id, province_id')
      .eq('user_id', userId)
      .single();

    if (!data) return false;

    // Check if user is assigned to this constituency
    if (data.constituency_id === constituencyId) return true;

    // Check if user is assigned to province that contains this constituency
    if (data.province_id) {
      const { data: constituency } = await this.supabase
        .from('constituencies')
        .select('district:districts(province_id)')
        .eq('id', constituencyId)
        .single();

      const district = constituency?.district as any;
      return district?.province_id === data.province_id;
    }

    return false;
  }

  private async updateProjectBudget(projectId: string, amount: number) {
    const { data: project } = await this.supabase
      .from('projects')
      .select('total_disbursed')
      .eq('id', projectId)
      .single();

    if (project) {
      await this.supabase
        .from('projects')
        .update({ total_disbursed: (project.total_disbursed || 0) + amount })
        .eq('id', projectId);
    }
  }

  private async logAudit(auditData: any) {
    await this.supabase.from('audit_logs').insert(auditData);
  }
}
