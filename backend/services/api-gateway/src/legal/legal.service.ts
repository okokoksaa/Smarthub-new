import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ScopeContext } from '../common/scope/scope-context';
import { applyScopeToRows } from '../common/scope/scope.utils';

export interface Contract {
  id: string;
  contract_number: string;
  title: string;
  contractor_id: string;
  contractor_name: string;
  project_id: string;
  project_name: string;
  constituency_id: string;
  contract_type: 'construction' | 'supply' | 'service' | 'consultancy';
  contract_value: number;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'terminated' | 'disputed';
  signed_date?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export interface LegalCase {
  id: string;
  case_number: string;
  title: string;
  case_type: 'contract_dispute' | 'land_issue' | 'compliance_review' | 'fraud_investigation' | 'other';
  related_entity_type?: 'project' | 'contract' | 'payment' | 'contractor';
  related_entity_id?: string;
  constituency_id?: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resolution?: string;
  filed_date: string;
  resolved_date?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceItem {
  id: string;
  regulation: string;
  description: string;
  constituency_id?: string;
  due_date: string;
  status: 'compliant' | 'pending' | 'non_compliant' | 'waived';
  notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface LegalOpinion {
  id: string;
  reference_number: string;
  title: string;
  subject: string;
  opinion_type: 'advisory' | 'binding' | 'clarification';
  related_regulation?: string;
  opinion_text: string;
  issued_by: string;
  issued_date: string;
  file_url?: string;
  created_at: string;
}

@Injectable()
export class LegalService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  /**
   * Get contracts with filtering
   */
  async getContracts(
    constituencyId?: string,
    status?: string,
    contractType?: string,
    scopeContext?: ScopeContext,
  ): Promise<Contract[]> {
    let query = this.supabase
      .from('contracts')
      .select(`
        *,
        contractors (name),
        projects (title, constituency_id)
      `)
      .order('created_at', { ascending: false });

    if (constituencyId) {
      query = query.eq('projects.constituency_id', constituencyId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (contractType) {
      query = query.eq('contract_type', contractType);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to fetch contracts: ${error.message}`);
    }

    const contracts = (data || []).map(c => ({
      ...c,
      contractor_name: c.contractors?.name || 'Unknown',
      project_name: c.projects?.title || 'Unknown',
      constituency_id: c.projects?.constituency_id,
    }));

    return applyScopeToRows(contracts, scopeContext);
  }

  /**
   * Get contract by ID
   */
  async getContract(id: string, scopeContext?: ScopeContext): Promise<Contract> {
    const { data, error } = await this.supabase
      .from('contracts')
      .select(`
        *,
        contractors (name),
        projects (title, constituency_id)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Contract not found');
    }

    const contract = {
      ...data,
      contractor_name: data.contractors?.name || 'Unknown',
      project_name: data.projects?.title || 'Unknown',
      constituency_id: data.projects?.constituency_id,
    };

    if (scopeContext && applyScopeToRows([contract as any], scopeContext).length === 0) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  /**
   * Create a new contract
   */
  async createContract(
    dto: Partial<Contract>,
    userId: string,
    scopeContext?: ScopeContext,
  ): Promise<Contract> {
    if (dto.project_id && scopeContext) {
      const { data: project } = await this.supabase
        .from('projects')
        .select('id, constituency:constituencies(id, district:districts(province:provinces(name)))')
        .eq('id', dto.project_id)
        .maybeSingle();
      if (applyScopeToRows(project ? [project] : [], scopeContext).length === 0) {
        throw new BadRequestException('Project is outside scope');
      }
    }

    const contractNumber = await this.generateContractNumber();

    const { data, error } = await this.supabase
      .from('contracts')
      .insert({
        ...dto,
        contract_number: contractNumber,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create contract: ${error.message}`);
    }

    // Log to audit
    await this.supabase.from('audit_logs').insert({
      action: 'contract_created',
      entity_type: 'contract',
      entity_id: data.id,
      user_id: userId,
      details: { contract_number: contractNumber },
    });

    return data;
  }

  /**
   * Update contract status
   */
  async updateContractStatus(
    id: string,
    status: string,
    userId: string,
    scopeContext?: ScopeContext,
  ): Promise<Contract> {
    await this.getContract(id, scopeContext);

    const { data, error } = await this.supabase
      .from('contracts')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update contract: ${error.message}`);
    }

    await this.supabase.from('audit_logs').insert({
      action: 'contract_status_updated',
      entity_type: 'contract',
      entity_id: id,
      user_id: userId,
      details: { new_status: status },
    });

    return data;
  }

  /**
   * Get legal cases
   */
  async getLegalCases(
    status?: string,
    caseType?: string,
    priority?: string,
    scopeContext?: ScopeContext,
  ): Promise<LegalCase[]> {
    let query = this.supabase
      .from('legal_cases')
      .select('*')
      .order('filed_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (caseType) {
      query = query.eq('case_type', caseType);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to fetch legal cases: ${error.message}`);
    }

    return applyScopeToRows(data || [], scopeContext);
  }

  /**
   * Get legal case by ID
   */
  async getLegalCase(id: string, scopeContext?: ScopeContext): Promise<LegalCase> {
    const { data, error } = await this.supabase
      .from('legal_cases')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Legal case not found');
    }

    return data;
  }

  /**
   * Create a new legal case
   */
  async createLegalCase(
    dto: Partial<LegalCase>,
    userId: string,
    scopeContext?: ScopeContext,
  ): Promise<LegalCase> {
    if (dto.constituency_id && scopeContext) {
      const scoped = applyScopeToRows([{ constituency_id: dto.constituency_id } as any], scopeContext);
      if (scoped.length === 0) throw new BadRequestException('Case constituency is outside scope');
    }

    const caseNumber = await this.generateCaseNumber();

    const { data, error } = await this.supabase
      .from('legal_cases')
      .insert({
        ...dto,
        case_number: caseNumber,
        filed_date: new Date().toISOString(),
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create legal case: ${error.message}`);
    }

    await this.supabase.from('audit_logs').insert({
      action: 'legal_case_created',
      entity_type: 'legal_case',
      entity_id: data.id,
      user_id: userId,
      details: { case_number: caseNumber, case_type: dto.case_type },
    });

    return data;
  }

  /**
   * Update legal case
   */
  async updateLegalCase(
    id: string,
    dto: Partial<LegalCase>,
    userId: string,
    scopeContext?: ScopeContext,
  ): Promise<LegalCase> {
    await this.getLegalCase(id, scopeContext);

    const updates: any = {
      ...dto,
      updated_at: new Date().toISOString(),
    };

    // If resolving, set resolved_date
    if (dto.status === 'resolved' || dto.status === 'closed') {
      updates.resolved_date = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('legal_cases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update legal case: ${error.message}`);
    }

    await this.supabase.from('audit_logs').insert({
      action: 'legal_case_updated',
      entity_type: 'legal_case',
      entity_id: id,
      user_id: userId,
      details: dto,
    });

    return data;
  }

  /**
   * Get compliance items
   */
  async getComplianceItems(
    constituencyId?: string,
    status?: string,
    scopeContext?: ScopeContext,
  ): Promise<ComplianceItem[]> {
    let query = this.supabase
      .from('compliance_items')
      .select('*')
      .order('due_date', { ascending: true });

    if (constituencyId) {
      query = query.or(`constituency_id.eq.${constituencyId},constituency_id.is.null`);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to fetch compliance items: ${error.message}`);
    }

    return applyScopeToRows(data || [], scopeContext);
  }

  /**
   * Update compliance status
   */
  async updateComplianceStatus(
    id: string,
    status: string,
    userId: string,
    notes?: string,
    scopeContext?: ScopeContext,
  ): Promise<ComplianceItem> {
    const existing = await this.getComplianceItems(undefined, undefined, scopeContext);
    if (!existing.find(x => x.id === id)) {
      throw new NotFoundException('Compliance item not found');
    }

    const { data, error } = await this.supabase
      .from('compliance_items')
      .update({
        status,
        notes,
        verified_by: userId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update compliance: ${error.message}`);
    }

    await this.supabase.from('audit_logs').insert({
      action: 'compliance_status_updated',
      entity_type: 'compliance_item',
      entity_id: id,
      user_id: userId,
      details: { status, notes },
    });

    return data;
  }

  /**
   * Get legal opinions
   */
  async getLegalOpinions(
    opinionType?: string,
    search?: string,
    scopeContext?: ScopeContext,
  ): Promise<LegalOpinion[]> {
    let query = this.supabase
      .from('legal_opinions')
      .select('*')
      .order('issued_date', { ascending: false });

    if (opinionType) {
      query = query.eq('opinion_type', opinionType);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to fetch legal opinions: ${error.message}`);
    }

    return applyScopeToRows(data || [], scopeContext);
  }

  /**
   * Create legal opinion
   */
  async createLegalOpinion(
    dto: Partial<LegalOpinion>,
    userId: string,
    scopeContext?: ScopeContext,
  ): Promise<LegalOpinion> {
    const referenceNumber = await this.generateOpinionReference();

    const { data, error } = await this.supabase
      .from('legal_opinions')
      .insert({
        ...dto,
        reference_number: referenceNumber,
        issued_date: new Date().toISOString(),
        issued_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create legal opinion: ${error.message}`);
    }

    await this.supabase.from('audit_logs').insert({
      action: 'legal_opinion_created',
      entity_type: 'legal_opinion',
      entity_id: data.id,
      user_id: userId,
      details: { reference_number: referenceNumber },
    });

    return data;
  }

  /**
   * Get legal dashboard summary
   */
  async getDashboardSummary(scopeContext?: ScopeContext): Promise<{
    compliance_rate: number;
    pending_items: number;
    active_cases: number;
    non_compliant: number;
    contracts_expiring_soon: number;
  }> {
    // Get compliance stats
    const complianceData = await this.getComplianceItems(undefined, undefined, scopeContext);

    const total = (complianceData || []).length;
    const compliant = (complianceData || []).filter(c => c.status === 'compliant').length;
    const pending = (complianceData || []).filter(c => c.status === 'pending').length;
    const nonCompliant = (complianceData || []).filter(c => c.status === 'non_compliant').length;

    // Get active cases count
    const activeCases = (await this.getLegalCases(undefined, undefined, undefined, scopeContext))
      .filter(c => ['open', 'under_review'].includes(c.status)).length;

    // Get contracts expiring in 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringContracts = (await this.getContracts(undefined, 'active', undefined, scopeContext))
      .filter(c => (c.end_date || '') <= thirtyDaysFromNow.toISOString().split('T')[0]).length;

    return {
      compliance_rate: total > 0 ? Math.round((compliant / total) * 100) : 100,
      pending_items: pending,
      active_cases: activeCases || 0,
      non_compliant: nonCompliant,
      contracts_expiring_soon: expiringContracts || 0,
    };
  }

  private async generateContractNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await this.supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`);

    return `CDF-CON-${year}-${String((count || 0) + 1).padStart(4, '0')}`;
  }

  private async generateCaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await this.supabase
      .from('legal_cases')
      .select('id', { count: 'exact', head: true })
      .gte('filed_date', `${year}-01-01`);

    return `LC-${year}-${String((count || 0) + 1).padStart(3, '0')}`;
  }

  private async generateOpinionReference(): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await this.supabase
      .from('legal_opinions')
      .select('id', { count: 'exact', head: true })
      .gte('issued_date', `${year}-01-01`);

    return `LO-${year}-${String((count || 0) + 1).padStart(3, '0')}`;
  }
}
