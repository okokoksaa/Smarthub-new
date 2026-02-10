import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);
  private supabase: SupabaseClient;

  // Public-visible project statuses
  private readonly PUBLIC_STATUSES = ['approved', 'implementation', 'completed'];

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

  async getProjects(filters: any) {
    const { constituencyId, sector, status, page, limit } = filters;

    let query = this.supabase
      .from('projects')
      .select(`
        id,
        project_number,
        name,
        sector,
        budget,
        progress,
        status,
        start_date,
        expected_end_date,
        actual_end_date,
        beneficiaries,
        location_description,
        constituency:constituencies(id, name, code)
      `, { count: 'exact' })
      .in('status', this.PUBLIC_STATUSES)
      .order('created_at', { ascending: false });

    if (constituencyId) {
      query = query.eq('constituency_id', constituencyId);
    }

    if (sector) {
      query = query.eq('sector', sector);
    }

    if (status && this.PUBLIC_STATUSES.includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      this.logger.error('Failed to fetch public projects', error);
      throw new BadRequestException('Failed to fetch projects');
    }

    // Sanitize data - remove any sensitive fields
    const sanitizedData = data?.map(project => this.sanitizeProject(project));

    return {
      data: sanitizedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async getProject(id: string) {
    const { data, error } = await this.supabase
      .from('projects')
      .select(`
        id,
        project_number,
        name,
        description,
        sector,
        budget,
        progress,
        status,
        start_date,
        expected_end_date,
        actual_end_date,
        beneficiaries,
        location_description,
        constituency:constituencies(id, name, code),
        ward:wards(id, name)
      `)
      .eq('id', id)
      .in('status', this.PUBLIC_STATUSES)
      .single();

    if (error || !data) {
      throw new NotFoundException('Project not found or not publicly accessible');
    }

    return this.sanitizeProject(data);
  }

  async getConstituencies(provinceId?: string) {
    let query = this.supabase
      .from('constituencies')
      .select(`
        id,
        name,
        code,
        total_budget,
        allocated_budget,
        disbursed_budget,
        district:districts(id, name, province:provinces(id, name))
      `)
      .order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to fetch constituencies', error);
      throw new BadRequestException('Failed to fetch constituencies');
    }

    // Filter by province if provided
    let filtered = data || [];
    if (provinceId) {
      filtered = filtered.filter((c: any) =>
        c.district?.province?.id === provinceId
      );
    }

    // Add derived statistics
    const withStats = filtered.map((c: any) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      district: c.district?.name,
      province: c.district?.province?.name,
      budget: {
        total: c.total_budget || 0,
        allocated: c.allocated_budget || 0,
        disbursed: c.disbursed_budget || 0,
        utilization_rate: c.total_budget > 0
          ? Math.round((c.disbursed_budget / c.total_budget) * 100)
          : 0,
      },
    }));

    return withStats;
  }

  async getConstituencyStats(id: string) {
    // Get constituency details
    const { data: constituency, error: consError } = await this.supabase
      .from('constituencies')
      .select(`
        id,
        name,
        code,
        total_budget,
        allocated_budget,
        disbursed_budget
      `)
      .eq('id', id)
      .single();

    if (consError || !constituency) {
      throw new NotFoundException('Constituency not found');
    }

    // Get project counts by status
    const { data: projects } = await this.supabase
      .from('projects')
      .select('status')
      .eq('constituency_id', id);

    const projectCounts = {
      total: projects?.length || 0,
      approved: projects?.filter(p => p.status === 'approved').length || 0,
      implementation: projects?.filter(p => p.status === 'implementation').length || 0,
      completed: projects?.filter(p => p.status === 'completed').length || 0,
    };

    // Get sector breakdown
    const { data: sectorData } = await this.supabase
      .from('projects')
      .select('sector, budget')
      .eq('constituency_id', id)
      .in('status', this.PUBLIC_STATUSES);

    const sectorBreakdown: Record<string, { count: number; budget: number }> = {};
    sectorData?.forEach((p: any) => {
      if (!sectorBreakdown[p.sector]) {
        sectorBreakdown[p.sector] = { count: 0, budget: 0 };
      }
      sectorBreakdown[p.sector].count++;
      sectorBreakdown[p.sector].budget += p.budget || 0;
    });

    return {
      constituency: {
        id: constituency.id,
        name: constituency.name,
        code: constituency.code,
      },
      budget: {
        total: constituency.total_budget || 0,
        allocated: constituency.allocated_budget || 0,
        disbursed: constituency.disbursed_budget || 0,
        available: (constituency.total_budget || 0) - (constituency.allocated_budget || 0),
        utilization_rate: constituency.total_budget > 0
          ? Math.round((constituency.disbursed_budget / constituency.total_budget) * 100)
          : 0,
      },
      projects: projectCounts,
      sectors: Object.entries(sectorBreakdown).map(([sector, data]) => ({
        sector,
        ...data,
      })),
    };
  }

  async getNationalStats() {
    // Get all constituencies
    const { data: constituencies } = await this.supabase
      .from('constituencies')
      .select('total_budget, allocated_budget, disbursed_budget');

    const nationalBudget = {
      total: 0,
      allocated: 0,
      disbursed: 0,
    };

    constituencies?.forEach((c: any) => {
      nationalBudget.total += c.total_budget || 0;
      nationalBudget.allocated += c.allocated_budget || 0;
      nationalBudget.disbursed += c.disbursed_budget || 0;
    });

    // Get project counts
    const { count: totalProjects } = await this.supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    const { count: completedProjects } = await this.supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { count: activeProjects } = await this.supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('status', ['approved', 'implementation']);

    // Get province breakdown
    const { data: provinces } = await this.supabase
      .from('provinces')
      .select(`
        id,
        name,
        districts:districts(
          constituencies:constituencies(total_budget, disbursed_budget)
        )
      `);

    const provinceStats = provinces?.map((p: any) => {
      let totalBudget = 0;
      let disbursed = 0;

      p.districts?.forEach((d: any) => {
        d.constituencies?.forEach((c: any) => {
          totalBudget += c.total_budget || 0;
          disbursed += c.disbursed_budget || 0;
        });
      });

      return {
        id: p.id,
        name: p.name,
        total_budget: totalBudget,
        disbursed: disbursed,
        utilization_rate: totalBudget > 0 ? Math.round((disbursed / totalBudget) * 100) : 0,
      };
    });

    return {
      budget: {
        ...nationalBudget,
        utilization_rate: nationalBudget.total > 0
          ? Math.round((nationalBudget.disbursed / nationalBudget.total) * 100)
          : 0,
      },
      projects: {
        total: totalProjects || 0,
        completed: completedProjects || 0,
        active: activeProjects || 0,
        completion_rate: (totalProjects || 0) > 0
          ? Math.round(((completedProjects || 0) / (totalProjects || 0)) * 100)
          : 0,
      },
      constituencies: {
        total: constituencies?.length || 0,
      },
      provinces: provinceStats,
    };
  }

  async getSummaryStats() {
    const { count: totalProjects } = await this.supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('status', this.PUBLIC_STATUSES);

    const { count: completedProjects } = await this.supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { data: budgetData } = await this.supabase
      .from('constituencies')
      .select('total_budget, disbursed_budget');

    let totalBudget = 0;
    let totalDisbursed = 0;
    budgetData?.forEach((c: any) => {
      totalBudget += c.total_budget || 0;
      totalDisbursed += c.disbursed_budget || 0;
    });

    return {
      total_projects: totalProjects || 0,
      completed_projects: completedProjects || 0,
      total_budget: totalBudget,
      total_disbursed: totalDisbursed,
      budget_utilization: totalBudget > 0
        ? Math.round((totalDisbursed / totalBudget) * 100)
        : 0,
    };
  }

  async submitFeedback(feedbackDto: any) {
    const { data, error } = await this.supabase
      .from('public_feedback')
      .insert({
        feedback_type: feedbackDto.feedback_type,
        category: feedbackDto.category,
        subject: feedbackDto.subject,
        description: feedbackDto.description,
        constituency_id: feedbackDto.constituency_id,
        ward_id: feedbackDto.ward_id,
        project_id: feedbackDto.project_id,
        contact_name: feedbackDto.is_anonymous ? null : feedbackDto.contact_name,
        contact_phone: feedbackDto.is_anonymous ? null : feedbackDto.contact_phone,
        contact_email: feedbackDto.is_anonymous ? null : feedbackDto.contact_email,
        is_anonymous: feedbackDto.is_anonymous ?? true,
        status: 'submitted',
      })
      .select('id, feedback_type, category, status, created_at')
      .single();

    if (error) {
      this.logger.error('Failed to submit feedback', error);
      throw new BadRequestException('Failed to submit feedback');
    }

    return {
      ...data,
      message: 'Thank you for your feedback. It has been submitted for review.',
    };
  }

  async getPublishedReports(constituencyId?: string, reportType?: string) {
    // This would query a published_reports or documents table
    // For now, return empty array - to be implemented when reports are published
    return {
      data: [],
      message: 'Published reports feature coming soon',
    };
  }

  async verifyDocument(documentId: string) {
    // Use the public RPC function for document verification
    const { data, error } = await this.supabase
      .rpc('verify_document_public', { doc_id: documentId });

    if (error) {
      this.logger.error('Document verification failed', error);
      return {
        valid: false,
        message: 'Document verification failed. Please try again later.',
      };
    }

    if (!data || !data.valid) {
      return {
        valid: false,
        message: 'Document not found or invalid. This may indicate a fraudulent document.',
        verification_timestamp: new Date().toISOString(),
      };
    }

    return {
      valid: true,
      document_type: data.document_type,
      file_hash: data.file_hash,
      upload_timestamp: data.upload_timestamp,
      project_name: data.project_name,
      project_status: data.project_status,
      is_immutable: data.is_immutable,
      verification_timestamp: new Date().toISOString(),
      message: 'Document verified successfully. This is an authentic CDF document.',
    };
  }

  // ========== Helper Methods ==========

  private sanitizeProject(project: any) {
    // Remove any sensitive fields and return only public-safe data
    return {
      id: project.id,
      project_number: project.project_number,
      name: project.name,
      description: project.description,
      sector: project.sector,
      budget: project.budget,
      progress: project.progress,
      status: project.status,
      start_date: project.start_date,
      expected_end_date: project.expected_end_date,
      actual_end_date: project.actual_end_date,
      beneficiaries: project.beneficiaries,
      location: project.location_description,
      constituency: project.constituency?.name,
      constituency_code: project.constituency?.code,
      ward: project.ward?.name,
      // Explicitly exclude: contractor details, internal notes, AI risk scores, etc.
    };
  }
}
