import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface CAPRCycle {
  id: string;
  constituency_id: string;
  constituency_name: string;
  province_name: string;
  fiscal_year: string;
  first_sitting_date: string;
  due_date: string;
  days_remaining: number;
  status: 'on_track' | 'due_soon' | 'overdue' | 'completed';
  artifacts: {
    name: string;
    submitted: boolean;
    submitted_at?: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface MinisterialItem {
  id: string;
  province: string;
  title: string;
  type: 'project_list' | 'special_approval' | 'policy_matter' | 'budget_amendment';
  submitted_date: string;
  due_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'deferred';
  priority: 'normal' | 'high' | 'urgent';
  constituency_id?: string;
  submitted_by: string;
}

export interface GazettePublication {
  id: string;
  title: string;
  province: string;
  fiscal_year: string;
  published_date?: string;
  url?: string;
  status: 'draft' | 'pending' | 'published';
  approved_projects_count: number;
}

@Injectable()
export class MinistryService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  /**
   * Get CAPR cycles with their status
   * CAPR = Constituency Annual Project Review
   * Due 90 days from first CDFC sitting of the fiscal year
   */
  async getCAPRCycles(
    provinceId?: string,
    fiscalYear?: string,
    status?: string,
  ): Promise<CAPRCycle[]> {
    // Build query for constituencies with their first meeting of the fiscal year
    let query = this.supabase
      .from('constituencies')
      .select(`
        id,
        name,
        districts!inner (
          provinces!inner (
            id,
            name
          )
        )
      `);

    if (provinceId) {
      query = query.eq('districts.provinces.id', provinceId);
    }

    const { data: constituencies, error: constError } = await query;

    if (constError) {
      throw new BadRequestException(`Failed to fetch constituencies: ${constError.message}`);
    }

    const currentFiscalYear = fiscalYear || this.getCurrentFiscalYear();
    const cycles: CAPRCycle[] = [];

    for (const constituency of constituencies || []) {
      // Get first CDFC meeting of the fiscal year
      const { data: meetings } = await this.supabase
        .from('meetings')
        .select('id, meeting_date')
        .eq('constituency_id', constituency.id)
        .gte('meeting_date', `${currentFiscalYear}-01-01`)
        .lte('meeting_date', `${currentFiscalYear}-12-31`)
        .order('meeting_date', { ascending: true })
        .limit(1);

      const firstMeeting = meetings?.[0];
      if (!firstMeeting) {
        continue; // No meetings for this constituency in the fiscal year
      }

      const firstSittingDate = new Date(firstMeeting.meeting_date);
      const dueDate = new Date(firstSittingDate);
      dueDate.setDate(dueDate.getDate() + 90);

      const today = new Date();
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Determine status
      let cycleStatus: 'on_track' | 'due_soon' | 'overdue' | 'completed' = 'on_track';
      if (daysRemaining < 0) {
        cycleStatus = 'overdue';
      } else if (daysRemaining <= 14) {
        cycleStatus = 'due_soon';
      }

      // Get artifacts status
      const artifacts = await this.getCAPRArtifacts(constituency.id, currentFiscalYear);

      // Check if all artifacts submitted = completed
      if (artifacts.every(a => a.submitted)) {
        cycleStatus = 'completed';
      }

      // Filter by status if provided
      if (status && cycleStatus !== status) {
        continue;
      }

      cycles.push({
        id: `capr-${constituency.id}-${currentFiscalYear}`,
        constituency_id: constituency.id,
        constituency_name: constituency.name,
        province_name: (constituency.districts as any)?.provinces?.name || 'Unknown',
        fiscal_year: currentFiscalYear,
        first_sitting_date: firstMeeting.meeting_date,
        due_date: dueDate.toISOString().split('T')[0],
        days_remaining: daysRemaining,
        status: cycleStatus,
        artifacts,
        created_at: firstMeeting.meeting_date,
        updated_at: new Date().toISOString(),
      });
    }

    // Sort by days remaining (most urgent first)
    cycles.sort((a, b) => a.days_remaining - b.days_remaining);

    return cycles;
  }

  /**
   * Get CAPR artifacts for a constituency
   */
  private async getCAPRArtifacts(
    constituencyId: string,
    fiscalYear: string,
  ): Promise<{ name: string; submitted: boolean; submitted_at?: string }[]> {
    const artifacts = [
      { name: 'CDFC Minutes', type: 'cdfc_minutes' },
      { name: 'Project List', type: 'project_list' },
      { name: 'Budget Allocation', type: 'budget_allocation' },
      { name: 'TAC Report', type: 'tac_report' },
    ];

    const result = [];

    for (const artifact of artifacts) {
      // Check if document exists for this type
      const { data: docs } = await this.supabase
        .from('documents')
        .select('id, created_at')
        .eq('entity_type', 'constituency')
        .eq('entity_id', constituencyId)
        .eq('document_type', artifact.type)
        .gte('created_at', `${fiscalYear}-01-01`)
        .lte('created_at', `${fiscalYear}-12-31`)
        .limit(1);

      result.push({
        name: artifact.name,
        submitted: (docs?.length || 0) > 0,
        submitted_at: docs?.[0]?.created_at,
      });
    }

    return result;
  }

  /**
   * Get ministerial inbox items
   */
  async getMinisterialInbox(
    status?: string,
    priority?: string,
    type?: string,
  ): Promise<MinisterialItem[]> {
    // Query projects awaiting ministry approval
    let projectQuery = this.supabase
      .from('projects')
      .select(`
        id,
        title,
        status,
        priority,
        created_at,
        constituency_id,
        constituencies (
          name,
          districts (
            provinces (
              name
            )
          )
        )
      `)
      .eq('status', 'plgo_review'); // Projects that passed PLGO, need ministry review

    const { data: projects, error: projectError } = await projectQuery;

    if (projectError) {
      throw new BadRequestException(`Failed to fetch ministerial items: ${projectError.message}`);
    }

    const items: MinisterialItem[] = (projects || []).map(project => {
      const dueDate = new Date(project.created_at);
      dueDate.setDate(dueDate.getDate() + 30); // 30 working days for ministry

      return {
        id: project.id,
        province: (project.constituencies as any)?.districts?.provinces?.name || 'Unknown',
        title: project.title,
        type: 'project_list' as const,
        submitted_date: project.created_at,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending' as const,
        priority: (project.priority || 'normal') as 'normal' | 'high' | 'urgent',
        constituency_id: project.constituency_id,
        submitted_by: 'PLGO',
      };
    });

    // Filter by criteria
    let filtered = items;
    if (status) {
      filtered = filtered.filter(i => i.status === status);
    }
    if (priority) {
      filtered = filtered.filter(i => i.priority === priority);
    }
    if (type) {
      filtered = filtered.filter(i => i.type === type);
    }

    return filtered;
  }

  /**
   * Get gazette publications by province
   */
  async getGazettePublications(
    provinceId?: string,
    fiscalYear?: string,
  ): Promise<GazettePublication[]> {
    const currentFiscalYear = fiscalYear || this.getCurrentFiscalYear();

    // Get provinces
    let provinceQuery = this.supabase.from('provinces').select('id, name');
    if (provinceId) {
      provinceQuery = provinceQuery.eq('id', provinceId);
    }

    const { data: provinces, error: provError } = await provinceQuery;

    if (provError) {
      throw new BadRequestException(`Failed to fetch provinces: ${provError.message}`);
    }

    const publications: GazettePublication[] = [];

    for (const province of provinces || []) {
      // Count approved projects for this province in the fiscal year
      const { count } = await this.supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gte('created_at', `${currentFiscalYear}-01-01`)
        .lte('created_at', `${currentFiscalYear}-12-31`);

      // Check if gazette document exists
      const { data: gazette } = await this.supabase
        .from('documents')
        .select('id, created_at, file_url')
        .eq('document_type', 'gazette_publication')
        .eq('entity_type', 'province')
        .eq('entity_id', province.id)
        .gte('created_at', `${currentFiscalYear}-01-01`)
        .limit(1);

      publications.push({
        id: `gazette-${province.id}-${currentFiscalYear}`,
        title: `Approved CDF Project List - ${province.name} Province ${currentFiscalYear}`,
        province: province.name,
        fiscal_year: currentFiscalYear,
        published_date: gazette?.[0]?.created_at,
        url: gazette?.[0]?.file_url,
        status: gazette?.[0] ? 'published' : (count || 0) > 0 ? 'pending' : 'draft',
        approved_projects_count: count || 0,
      });
    }

    return publications;
  }

  /**
   * Get ministry dashboard summary
   */
  async getDashboardSummary(): Promise<{
    pending_approvals: number;
    urgent_items: number;
    capr_overdue: number;
    provinces_published: number;
    total_provinces: number;
    total_budget_allocated: number;
    total_disbursed: number;
  }> {
    const currentFiscalYear = this.getCurrentFiscalYear();

    // Count pending ministerial items
    const { count: pendingCount } = await this.supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'plgo_review');

    // Count urgent items (high priority + pending)
    const { count: urgentCount } = await this.supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'plgo_review')
      .eq('priority', 'urgent');

    // Get CAPR cycles and count overdue
    const caprCycles = await this.getCAPRCycles(undefined, currentFiscalYear);
    const overdueCount = caprCycles.filter(c => c.status === 'overdue').length;

    // Count provinces with published gazettes
    const gazettes = await this.getGazettePublications(undefined, currentFiscalYear);
    const publishedCount = gazettes.filter(g => g.status === 'published').length;
    const totalProvinces = gazettes.length;

    // Get budget summary
    const { data: budgetData } = await this.supabase
      .from('budgets')
      .select('total_allocation, total_disbursed')
      .eq('fiscal_year', currentFiscalYear);

    const totalAllocated = (budgetData || []).reduce((sum, b) => sum + Number(b.total_allocation || 0), 0);
    const totalDisbursed = (budgetData || []).reduce((sum, b) => sum + Number(b.total_disbursed || 0), 0);

    return {
      pending_approvals: pendingCount || 0,
      urgent_items: urgentCount || 0,
      capr_overdue: overdueCount,
      provinces_published: publishedCount,
      total_provinces: totalProvinces,
      total_budget_allocated: totalAllocated,
      total_disbursed: totalDisbursed,
    };
  }

  /**
   * Approve ministerial item
   */
  async approveItem(
    itemId: string,
    userId: string,
    comments?: string,
  ): Promise<{ success: boolean; message: string }> {
    // Update project status to approved
    const { error } = await this.supabase
      .from('projects')
      .update({
        status: 'approved',
        ministry_approved_by: userId,
        ministry_approved_at: new Date().toISOString(),
        ministry_comments: comments,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (error) {
      throw new BadRequestException(`Failed to approve item: ${error.message}`);
    }

    // Log to audit trail
    await this.supabase.from('audit_logs').insert({
      action: 'ministry_approval',
      entity_type: 'project',
      entity_id: itemId,
      user_id: userId,
      details: { status: 'approved', comments },
    });

    return {
      success: true,
      message: 'Item approved successfully',
    };
  }

  /**
   * Reject ministerial item
   */
  async rejectItem(
    itemId: string,
    userId: string,
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    const { error } = await this.supabase
      .from('projects')
      .update({
        status: 'rejected',
        ministry_approved_by: userId,
        ministry_approved_at: new Date().toISOString(),
        ministry_comments: reason,
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (error) {
      throw new BadRequestException(`Failed to reject item: ${error.message}`);
    }

    // Log to audit trail
    await this.supabase.from('audit_logs').insert({
      action: 'ministry_rejection',
      entity_type: 'project',
      entity_id: itemId,
      user_id: userId,
      details: { status: 'rejected', reason },
    });

    return {
      success: true,
      message: 'Item rejected',
    };
  }

  /**
   * Publish gazette for a province
   */
  async publishGazette(
    provinceId: string,
    userId: string,
    fileUrl: string,
  ): Promise<{ success: boolean; gazette_id: string }> {
    const currentFiscalYear = this.getCurrentFiscalYear();

    // Get province name
    const { data: province } = await this.supabase
      .from('provinces')
      .select('name')
      .eq('id', provinceId)
      .single();

    // Create gazette document
    const { data: doc, error } = await this.supabase
      .from('documents')
      .insert({
        name: `Gazette - ${province?.name} Province ${currentFiscalYear}`,
        document_type: 'gazette_publication',
        entity_type: 'province',
        entity_id: provinceId,
        file_url: fileUrl,
        uploaded_by: userId,
        is_immutable: true,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to publish gazette: ${error.message}`);
    }

    // Log to audit trail
    await this.supabase.from('audit_logs').insert({
      action: 'gazette_published',
      entity_type: 'province',
      entity_id: provinceId,
      user_id: userId,
      details: { fiscal_year: currentFiscalYear, document_id: doc.id },
    });

    return {
      success: true,
      gazette_id: doc.id,
    };
  }

  private getCurrentFiscalYear(): string {
    const now = new Date();
    // Zambian fiscal year is calendar year
    return now.getFullYear().toString();
  }
}
