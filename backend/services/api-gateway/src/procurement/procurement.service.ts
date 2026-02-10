import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateProcurementDto } from './dto/create-procurement.dto';
import { EvaluateBidDto } from './dto/evaluate-bid.dto';
import { AwardContractDto } from './dto/award-contract.dto';

@Injectable()
export class ProcurementService {
  private readonly logger = new Logger(ProcurementService.name);
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
    const { status, constituencyId, procurementMethod, page, limit } = filters;

    let query = this.supabase
      .from('procurements')
      .select(`
        *,
        constituency:constituencies(id, name, code),
        project:projects(id, name, project_number),
        awarded_contractor:contractors(id, company_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (constituencyId) query = query.eq('constituency_id', constituencyId);
    if (procurementMethod) query = query.eq('procurement_method', procurementMethod);

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      this.logger.error('Failed to fetch procurements', error);
      throw new BadRequestException('Failed to fetch procurements');
    }

    return { data, pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) } };
  }

  async findOne(id: string, user: any) {
    const { data, error } = await this.supabase
      .from('procurements')
      .select(`*, constituency:constituencies(id, name, code), project:projects(id, name, project_number, status, budget), awarded_contractor:contractors(id, company_name, registration_number)`)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException(`Procurement with ID ${id} not found`);
    return data;
  }

  async create(createProcurementDto: CreateProcurementDto, user: any) {
    this.logger.log(`Creating procurement by user ${user.id}`);

    const hasAccess = await this.validateUserConstituencyAccess(user.id, createProcurementDto.constituency_id);
    if (!hasAccess) throw new ForbiddenException('User does not have access to this constituency');

    const procurementNumber = await this.generateProcurementNumber(createProcurementDto.constituency_id);

    const { data: procurement, error } = await this.supabase
      .from('procurements')
      .insert({ procurement_number: procurementNumber, ...createProcurementDto, status: 'draft', created_by: user.id })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create procurement', error);
      throw new BadRequestException('Failed to create procurement');
    }

    await this.logAuditEvent(procurement.id, null, 'procurement_created', 'Procurement created', user.id, { title: procurement.title });
    return procurement;
  }

  async update(id: string, updateDto: Partial<CreateProcurementDto>, user: any) {
    const procurement = await this.findOne(id, user);
    if (procurement.status !== 'draft') throw new BadRequestException('Cannot update after publishing');

    const { data, error } = await this.supabase.from('procurements').update({ ...updateDto, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw new BadRequestException('Failed to update procurement');
    return data;
  }

  async publish(id: string, user: any) {
    const procurement = await this.findOne(id, user);
    if (procurement.status !== 'draft') throw new BadRequestException('Only draft procurements can be published');
    if (!procurement.closing_date || !procurement.bid_opening_date) throw new BadRequestException('Closing and opening dates required');

    const { data, error } = await this.supabase.from('procurements').update({ status: 'published', publish_date: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw new BadRequestException('Failed to publish');

    await this.logAuditEvent(id, null, 'tender_published', 'Tender published', user.id, {});
    return data;
  }

  async evaluateBid(procurementId: string, dto: EvaluateBidDto, user: any) {
    const procurement = await this.findOne(procurementId, user);
    if (procurement.status !== 'evaluation') throw new BadRequestException('Must be in evaluation status');

    const { data: existing } = await this.supabase.from('procurement_evaluations').select('id').eq('bid_id', dto.bid_id).eq('evaluator_id', user.id).single();
    if (existing) throw new BadRequestException('Already evaluated this bid');

    const totalScore = (dto.technical_score * 0.4) + (dto.financial_score * 0.3) + ((dto.experience_score || 0) * 0.15) + ((dto.compliance_score || 0) * 0.15);

    const { data, error } = await this.supabase.from('procurement_evaluations').insert({
      procurement_id: procurementId, bid_id: dto.bid_id, evaluator_id: user.id,
      technical_score: dto.technical_score, financial_score: dto.financial_score,
      experience_score: dto.experience_score, compliance_score: dto.compliance_score,
      total_score: totalScore, recommendation: dto.recommendation, recommendation_reason: dto.recommendation_reason,
      status: 'completed', completed_at: new Date().toISOString()
    }).select().single();

    if (error) throw new BadRequestException('Failed to submit evaluation');
    await this.logAuditEvent(procurementId, dto.bid_id, 'bid_evaluated', 'Evaluation submitted', user.id, { total_score: totalScore });
    return data;
  }

  async getEvaluations(procurementId: string, user: any) {
    const { data, error } = await this.supabase.from('procurement_evaluations').select(`*, evaluator:profiles!procurement_evaluations_evaluator_id_fkey(id, first_name, last_name)`).eq('procurement_id', procurementId);
    if (error) throw new BadRequestException('Failed to fetch evaluations');
    return data;
  }

  async awardContract(procurementId: string, dto: AwardContractDto, user: any) {
    const procurement = await this.findOne(procurementId, user);
    if (procurement.status !== 'evaluation') throw new BadRequestException('Must be in evaluation status');

    const hasTwoEvaluators = await this.checkTwoEvaluatorRule(procurementId);
    if (!hasTwoEvaluators) throw new BadRequestException('Two-evaluator rule not met');

    const { data: bid } = await this.supabase.from('procurement_bids').select('contractor_id').eq('id', dto.winning_bid_id).single();
    if (!bid) throw new NotFoundException('Winning bid not found');

    const { data, error } = await this.supabase.from('procurements').update({ status: 'awarded', awarded_contractor_id: bid.contractor_id, contract_value: dto.contract_value, award_date: dto.award_date || new Date().toISOString() }).eq('id', procurementId).select().single();
    if (error) throw new BadRequestException('Failed to award contract');

    await this.logAuditEvent(procurementId, dto.winning_bid_id, 'contract_awarded', 'Contract awarded', user.id, { contract_value: dto.contract_value });
    return data;
  }

  async getAuditTrail(procurementId: string, user: any) {
    const { data, error } = await this.supabase.from('procurement_audit_events').select(`*, actor:profiles!procurement_audit_events_actor_id_fkey(id, first_name, last_name)`).eq('procurement_id', procurementId).order('created_at', { ascending: false });
    if (error) throw new BadRequestException('Failed to fetch audit trail');
    return data;
  }

  async getStatus(procurementId: string, user: any) {
    const procurement = await this.findOne(procurementId, user);
    const { count: bidCount } = await this.supabase.from('procurement_bids').select('*', { count: 'exact', head: true }).eq('procurement_id', procurementId);
    const hasTwoEvaluators = await this.checkTwoEvaluatorRule(procurementId);

    return {
      id: procurement.id, procurement_number: procurement.procurement_number, status: procurement.status,
      statistics: { total_bids: bidCount || 0, has_two_evaluators: hasTwoEvaluators },
      workflow: { can_publish: procurement.status === 'draft', can_open_bids: procurement.status === 'bid_opening', can_evaluate: procurement.status === 'evaluation', can_award: procurement.status === 'evaluation' && hasTwoEvaluators }
    };
  }

  private async generateProcurementNumber(constituencyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { data: constituency } = await this.supabase.from('constituencies').select('code').eq('id', constituencyId).single();
    const { count } = await this.supabase.from('procurements').select('*', { count: 'exact', head: true }).eq('constituency_id', constituencyId).gte('created_at', `${year}-01-01`);
    return `PROC-${constituency?.code || 'UNK'}-${year}-${String((count || 0) + 1).padStart(4, '0')}`;
  }

  private async validateUserConstituencyAccess(userId: string, constituencyId: string): Promise<boolean> {
    const { data: userRoles } = await this.supabase.from('user_roles').select('role').eq('user_id', userId);
    const roles = userRoles?.map(r => r.role) || [];
    if (['super_admin', 'ministry_official', 'auditor'].some(r => roles.includes(r))) return true;

    const { data: assignment } = await this.supabase.from('user_assignments').select('constituency_id').eq('user_id', userId).single();
    return assignment?.constituency_id === constituencyId;
  }

  private async checkTwoEvaluatorRule(procurementId: string): Promise<boolean> {
    const { data: bids } = await this.supabase.from('procurement_bids').select('id').eq('procurement_id', procurementId).eq('status', 'valid');
    if (!bids?.length) return false;

    for (const bid of bids) {
      const { count } = await this.supabase.from('procurement_evaluations').select('*', { count: 'exact', head: true }).eq('bid_id', bid.id).eq('status', 'completed');
      if ((count || 0) < 2) return false;
    }
    return true;
  }

  private async logAuditEvent(procurementId: string, bidId: string | null, eventType: string, description: string, actorId: string, eventData: any) {
    const { data: userRole } = await this.supabase.from('user_roles').select('role').eq('user_id', actorId).limit(1).single();
    await this.supabase.from('procurement_audit_events').insert({ procurement_id: procurementId, bid_id: bidId, event_type: eventType, event_description: description, actor_id: actorId, actor_role: userRole?.role, event_data: eventData });
  }
}
