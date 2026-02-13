import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  ApproveBudgetDto,
  CreateExpenditureReturnDto,
  ReviewReturnDto,
} from './dto/budget.dto';
import { applyScopeToRows } from '../common/scope/scope.utils';

@Injectable()
export class BudgetsService {
  private readonly logger = new Logger(BudgetsService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  // ==================== BUDGETS ====================

  async findAllBudgets(filters: any) {
    const { fiscalYear, constituencyId, page = 1, limit = 20, scopeContext } = filters;

    let query = this.supabase
      .from('budgets')
      .select(`
        *,
        constituency:constituencies(id, name, code, district:districts(id, name, province:provinces(id, name)))
      `, { count: 'exact' })
      .order('fiscal_year', { ascending: false });

    if (fiscalYear) query = query.eq('fiscal_year', fiscalYear);
    if (constituencyId) query = query.eq('constituency_id', constituencyId);

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      this.logger.error('Failed to fetch budgets', error);
      throw new BadRequestException('Failed to fetch budgets');
    }

    const scopedData = applyScopeToRows(data || [], scopeContext);

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

  async findBudgetByConstituency(constituencyId: string, fiscalYear: number) {
    const { data, error } = await this.supabase
      .from('budgets')
      .select(`
        *,
        constituency:constituencies(id, name, code)
      `)
      .eq('constituency_id', constituencyId)
      .eq('fiscal_year', fiscalYear)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Budget not found for constituency ${constituencyId} in fiscal year ${fiscalYear}`);
    }

    return data;
  }

  async createBudget(dto: CreateBudgetDto, user: any) {
    // Validate allocations sum to total
    const allocationsSum = dto.projects_allocation + dto.empowerment_allocation +
                           dto.bursaries_allocation + dto.admin_allocation;

    if (allocationsSum !== dto.total_allocation) {
      throw new BadRequestException(
        `Allocations (${allocationsSum}) must equal total allocation (${dto.total_allocation})`
      );
    }

    const { data: budget, error } = await this.supabase
      .from('budgets')
      .insert({
        ...dto,
        disbursed_amount: 0,
        is_approved: false,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create budget', error);
      throw new BadRequestException('Failed to create budget');
    }

    await this.logAudit(user.id, 'budget.created', 'budget', budget.id, dto);
    return budget;
  }

  async updateBudget(id: string, dto: UpdateBudgetDto, user: any) {
    const { data: existing } = await this.supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      throw new NotFoundException('Budget not found');
    }

    if (existing.is_approved) {
      throw new BadRequestException('Cannot modify an approved budget');
    }

    const { data: budget, error } = await this.supabase
      .from('budgets')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to update budget');
    }

    await this.logAudit(user.id, 'budget.updated', 'budget', id, dto);
    return budget;
  }

  async approveBudget(id: string, dto: ApproveBudgetDto, user: any) {
    const { data: budget, error } = await this.supabase
      .from('budgets')
      .update({
        is_approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to approve budget');
    }

    await this.logAudit(user.id, 'budget.approved', 'budget', id, { comments: dto.comments });
    return budget;
  }

  async getBudgetUtilization(constituencyId: string, fiscalYear: number) {
    const budget = await this.findBudgetByConstituency(constituencyId, fiscalYear);

    // Get project spending
    const { data: payments } = await this.supabase
      .from('payments')
      .select('amount, status')
      .eq('status', 'executed');

    const totalDisbursed = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    return {
      budget_id: budget.id,
      fiscal_year: budget.fiscal_year,
      total_allocation: budget.total_allocation,
      disbursed_amount: totalDisbursed,
      remaining: budget.total_allocation - totalDisbursed,
      utilization_rate: ((totalDisbursed / budget.total_allocation) * 100).toFixed(2),
      by_category: {
        projects: { allocated: budget.projects_allocation, spent: 0 },
        empowerment: { allocated: budget.empowerment_allocation, spent: 0 },
        bursaries: { allocated: budget.bursaries_allocation, spent: 0 },
        admin: { allocated: budget.admin_allocation, spent: 0 },
      },
    };
  }

  // ==================== EXPENDITURE RETURNS ====================

  async findAllReturns(filters: any) {
    const { fiscalYear, quarter, constituencyId, status, page = 1, limit = 20, scopeContext } = filters;

    let query = this.supabase
      .from('expenditure_returns')
      .select(`
        *,
        constituency:constituencies(id, name, code, district:districts(id, name, province:provinces(id, name)))
      `, { count: 'exact' })
      .order('fiscal_year', { ascending: false })
      .order('quarter', { ascending: false });

    if (fiscalYear) query = query.eq('fiscal_year', fiscalYear);
    if (quarter) query = query.eq('quarter', quarter);
    if (constituencyId) query = query.eq('constituency_id', constituencyId);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new BadRequestException('Failed to fetch expenditure returns');
    }

    const scopedData = applyScopeToRows(data || [], scopeContext);

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

  async createReturn(dto: CreateExpenditureReturnDto, user: any) {
    // ENFORCEMENT: Check if prior quarter return exists (Q > 1)
    if (dto.quarter > 1) {
      const { data: priorReturn } = await this.supabase
        .from('expenditure_returns')
        .select('id, status')
        .eq('constituency_id', dto.constituency_id)
        .eq('fiscal_year', dto.fiscal_year)
        .eq('quarter', dto.quarter - 1)
        .single();

      if (!priorReturn || !['approved', 'submitted'].includes(priorReturn.status)) {
        throw new BadRequestException(
          `ENFORCEMENT: Q${dto.quarter - 1} return must be submitted before creating Q${dto.quarter} return. ` +
          '(Ref: CDF Act Section 22)'
        );
      }
    }

    const returnNumber = `RET-${dto.fiscal_year}-Q${dto.quarter}-${Date.now().toString(36).toUpperCase()}`;
    const balance = dto.total_received - dto.total_spent;

    const { data: expenditureReturn, error } = await this.supabase
      .from('expenditure_returns')
      .insert({
        return_number: returnNumber,
        ...dto,
        balance,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create expenditure return', error);
      throw new BadRequestException('Failed to create expenditure return');
    }

    await this.logAudit(user.id, 'expenditure_return.created', 'expenditure_return', expenditureReturn.id, dto);
    return expenditureReturn;
  }

  async submitReturn(id: string, user: any) {
    const { data: ret, error } = await this.supabase
      .from('expenditure_returns')
      .update({
        status: 'submitted',
        submitted_by: user.id,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to submit expenditure return');
    }

    await this.logAudit(user.id, 'expenditure_return.submitted', 'expenditure_return', id, {});
    return ret;
  }

  async reviewReturn(id: string, dto: ReviewReturnDto, user: any) {
    const newStatus = dto.approved ? 'approved' : 'revision_required';

    const { data: ret, error } = await this.supabase
      .from('expenditure_returns')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: dto.review_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to review expenditure return');
    }

    await this.logAudit(user.id, 'expenditure_return.reviewed', 'expenditure_return', id, dto);
    return ret;
  }

  // ==================== HELPERS ====================

  private async logAudit(userId: string, action: string, entityType: string, entityId: string, details: any) {
    await this.supabase.from('audit_logs').insert({
      event_type: action.split('.')[0],
      entity_type: entityType,
      entity_id: entityId,
      actor_id: userId,
      action,
      metadata: details,
      created_at: new Date().toISOString(),
    });
  }
}
