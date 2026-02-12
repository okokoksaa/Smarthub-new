import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  SubmitProjectDto,
  WdcSignoffDto,
  CdfcApprovalDto,
  TacAppraisalDto,
  PlgoApprovalDto,
  MinistryApprovalDto,
  UpdateProgressDto,
  CompleteProjectDto,
  RejectProjectDto,
  ApprovalDecision,
} from './dto/workflow.dto';
import { CreateMonitoringEvaluationDto } from './dto/monitoring-evaluation.dto';
import { applyScopeToRows } from '../common/scope/scope.utils';

// Project status state machine
const PROJECT_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['submitted'],
  submitted: ['cdfc_review', 'rejected'],
  cdfc_review: ['tac_appraisal', 'rejected', 'draft'],
  tac_appraisal: ['plgo_review', 'rejected', 'cdfc_review'],
  plgo_review: ['approved', 'rejected', 'tac_appraisal'],
  approved: ['implementation', 'cancelled'],
  implementation: ['completed', 'cancelled'],
  completed: [],
  rejected: ['draft'],
  cancelled: [],
};

// SLA working days configuration
const SLA_WORKING_DAYS = {
  cdfc_review: 7,
  tac_appraisal: 10,
  plgo_review: 14,
  ministry_review: 30,
};

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
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

  // ==================== CRUD OPERATIONS ====================

  async findAll(filters: any) {
    const { status, constituencyId, wardId, sector, page = 1, limit = 20, scopeContext } = filters;

    let query = this.supabase
      .from('projects')
      .select(`
        *,
        constituency:constituencies(id, name, code, district:districts(id, name, province:provinces(id, name))),
        ward:wards(id, name, code),
        contractor:contractors(id, company_name),
        wdc_signoff:wdc_signoffs(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (constituencyId) query = query.eq('constituency_id', constituencyId);
    if (wardId) query = query.eq('ward_id', wardId);
    if (sector) query = query.eq('sector', sector);

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      this.logger.error('Failed to fetch projects', error);
      throw new BadRequestException('Failed to fetch projects');
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

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        constituency:constituencies(id, name, code, district:districts(id, name, province:provinces(id, name))),
        ward:wards(id, name, code),
        contractor:contractors(id, company_name, registration_number, zppa_registration),
        wdc_signoff:wdc_signoffs(*),
        documents(*),
        payments(id, payment_number, amount, status, created_at)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return data;
  }

  async create(createProjectDto: CreateProjectDto, user: any) {
    this.logger.log(`Creating project in constituency ${createProjectDto.constituency_id} by user ${user.id}`);

    // Validate user has access to this constituency
    const hasAccess = await this.validateUserConstituencyAccess(user.id, createProjectDto.constituency_id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to create projects in this constituency');
    }

    // Generate project number
    const projectNumber = await this.generateProjectNumber(createProjectDto.constituency_id);

    // Create project
    const { data: project, error } = await this.supabase
      .from('projects')
      .insert({
        project_number: projectNumber,
        name: createProjectDto.name,
        description: createProjectDto.description,
        sector: createProjectDto.sector,
        constituency_id: createProjectDto.constituency_id,
        ward_id: createProjectDto.ward_id,
        budget: createProjectDto.budget,
        beneficiaries: createProjectDto.beneficiaries,
        location_description: createProjectDto.location_description,
        gps_latitude: createProjectDto.gps_latitude,
        gps_longitude: createProjectDto.gps_longitude,
        start_date: createProjectDto.start_date,
        expected_end_date: createProjectDto.expected_end_date,
        contractor_id: createProjectDto.contractor_id,
        status: 'draft',
        progress: 0,
        submitted_by: user.id,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create project', error);
      throw new BadRequestException('Failed to create project');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'project.created',
      resource_type: 'project',
      resource_id: project.id,
      details: { name: project.name, budget: project.budget },
    });

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, user: any) {
    const project = await this.findOne(id);

    // Can only update draft or returned projects
    if (!['draft', 'submitted'].includes(project.status)) {
      throw new BadRequestException('Can only update projects in draft or submitted status');
    }

    // Validate user access
    const hasAccess = await this.validateUserConstituencyAccess(user.id, project.constituency_id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to update this project');
    }

    const { data: updatedProject, error } = await this.supabase
      .from('projects')
      .update({
        ...updateProjectDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update project', error);
      throw new BadRequestException('Failed to update project');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'project.updated',
      resource_type: 'project',
      resource_id: id,
      details: { changes: updateProjectDto },
    });

    return updatedProject;
  }

  // ==================== WORKFLOW OPERATIONS ====================

  async submit(id: string, dto: SubmitProjectDto, user: any) {
    const project = await this.findOne(id);

    this.validateStatusTransition(project.status, 'submitted');

    // Check for WDC sign-off if ward-level project
    if (project.ward_id) {
      const hasWdcSignoff = project.wdc_signoff && project.wdc_signoff.length > 0;
      if (!hasWdcSignoff) {
        throw new BadRequestException(
          'ENFORCEMENT: WDC sign-off is required before submitting ward-level projects. ' +
          'Please complete the WDC meeting minutes and chair sign-off first. (Ref: CDF Act Section 14(2))'
        );
      }

      const signoff = project.wdc_signoff[0];
      if (!signoff.quorum_met) {
        throw new BadRequestException(
          'ENFORCEMENT: WDC meeting did not meet quorum requirements. ' +
          'Minimum attendance required. (Ref: CDF Regulations 2018)'
        );
      }

      if (!signoff.residency_verified || !signoff.residency_threshold_met) {
        throw new BadRequestException(
          'ENFORCEMENT: Residency verification not completed or threshold not met. ' +
          'Ensure majority of attendees are verified ward residents. (Ref: CDF Act Section 15)'
        );
      }
    }

    const { data: updatedProject, error } = await this.supabase
      .from('projects')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to submit project');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'project.submitted',
      resource_type: 'project',
      resource_id: id,
      details: { notes: dto.notes },
    });

    return updatedProject;
  }

  async addWdcSignoff(projectId: string, dto: WdcSignoffDto, user: any) {
    const project = await this.findOne(projectId);

    if (project.status !== 'draft') {
      throw new BadRequestException('WDC sign-off can only be added to draft projects');
    }

    // Check user has WDC authority
    const userRoles = await this.getUserRoles(user.id);
    if (!userRoles.some(r => ['wdc_member', 'cdfc_chair', 'cdfc_member', 'super_admin'].includes(r))) {
      throw new ForbiddenException('Only WDC or CDFC members can add WDC sign-offs');
    }

    const residencyThresholdMet = dto.residents_count
      ? dto.residents_count >= Math.ceil(dto.attendees_count * 0.6)
      : false;

    const { data: signoff, error } = await this.supabase
      .from('wdc_signoffs')
      .upsert({
        project_id: projectId,
        ward_id: project.ward_id,
        meeting_id: dto.meeting_id,
        meeting_date: dto.meeting_date,
        meeting_minutes_url: dto.meeting_minutes_url,
        chair_name: dto.chair_name,
        chair_nrc: dto.chair_nrc,
        chair_signed: true,
        chair_signed_at: new Date().toISOString(),
        attendees_count: dto.attendees_count,
        quorum_met: dto.quorum_met,
        residency_verified: dto.residency_verified,
        residents_count: dto.residents_count,
        residency_threshold_met: residencyThresholdMet,
        notes: dto.notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to add WDC sign-off', error);
      throw new BadRequestException('Failed to add WDC sign-off');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'project.wdc_signoff',
      resource_type: 'project',
      resource_id: projectId,
      details: { signoff_id: signoff.id, quorum_met: dto.quorum_met },
    });

    return signoff;
  }

  async cdfcApprove(id: string, dto: CdfcApprovalDto, user: any) {
    const project = await this.findOne(id);

    // Must be in submitted or cdfc_review status
    if (!['submitted', 'cdfc_review'].includes(project.status)) {
      throw new BadRequestException('Project is not awaiting CDFC review');
    }

    // Validate user has CDFC authority
    const userRoles = await this.getUserRoles(user.id);
    if (!userRoles.some(r => ['cdfc_chair', 'super_admin'].includes(r))) {
      throw new ForbiddenException('Only CDFC Chair can approve at CDFC level');
    }

    // ENFORCEMENT: Quorum check (minimum 6 members required)
    if (dto.quorum_count < 6) {
      throw new BadRequestException(
        'ENFORCEMENT: CDFC quorum not met. Minimum 6 members required for valid decision. ' +
        '(Ref: CDF Act Section 12(4))'
      );
    }

    let newStatus: string;
    switch (dto.decision) {
      case ApprovalDecision.APPROVE:
      case ApprovalDecision.APPROVE_WITH_CONDITIONS:
        newStatus = 'tac_appraisal';
        break;
      case ApprovalDecision.REJECT:
        newStatus = 'rejected';
        break;
      case ApprovalDecision.RETURN:
        newStatus = 'draft';
        break;
      default:
        newStatus = 'cdfc_review';
    }

    const { data: updatedProject, error } = await this.supabase
      .from('projects')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to process CDFC decision');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'project.cdfc_decision',
      resource_type: 'project',
      resource_id: id,
      details: {
        decision: dto.decision,
        quorum_count: dto.quorum_count,
        priority_rank: dto.priority_rank,
        conditions: dto.conditions,
      },
    });

    return updatedProject;
  }

  async tacAppraise(id: string, dto: TacAppraisalDto, user: any) {
    const project = await this.findOne(id);

    if (project.status !== 'tac_appraisal') {
      throw new BadRequestException('Project is not awaiting TAC appraisal');
    }

    // Validate user has TAC authority
    const userRoles = await this.getUserRoles(user.id);
    if (!userRoles.some(r => ['tac_chair', 'tac_member', 'super_admin'].includes(r))) {
      throw new ForbiddenException('Only TAC members can appraise projects');
    }

    // ENFORCEMENT: Two-reviewer rule
    if (!dto.second_review_completed) {
      throw new BadRequestException(
        'ENFORCEMENT: Two-reviewer rule not satisfied. A second TAC member must complete appraisal. ' +
        '(Ref: CDF Regulations 2018, Schedule 2)'
      );
    }

    // ENFORCEMENT: Check for required technical artefacts
    const hasRequiredDocs = await this.checkRequiredDocuments(id, ['SoR', 'BOQ', 'design']);
    if (!hasRequiredDocs && dto.decision === ApprovalDecision.APPROVE) {
      throw new BadRequestException(
        'ENFORCEMENT: Required technical artefacts missing. SoR, BOQ, and design documents required. ' +
        '(Ref: ZPPA Act Section 32)'
      );
    }

    let newStatus: string;
    switch (dto.decision) {
      case ApprovalDecision.APPROVE:
      case ApprovalDecision.APPROVE_WITH_CONDITIONS:
        newStatus = 'plgo_review';
        break;
      case ApprovalDecision.REJECT:
        newStatus = 'rejected';
        break;
      case ApprovalDecision.RETURN:
      case ApprovalDecision.REVISE:
        newStatus = 'cdfc_review';
        break;
      default:
        newStatus = 'tac_appraisal';
    }

    const { data: updatedProject, error } = await this.supabase
      .from('projects')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to process TAC appraisal');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'project.tac_appraisal',
      resource_type: 'project',
      resource_id: id,
      details: {
        decision: dto.decision,
        second_reviewer_id: dto.second_reviewer_id,
        viability_notes: dto.viability_notes,
      },
    });

    return updatedProject;
  }

  async plgoApprove(id: string, dto: PlgoApprovalDto, user: any) {
    const project = await this.findOne(id);

    if (project.status !== 'plgo_review') {
      throw new BadRequestException('Project is not awaiting PLGO review');
    }

    // Validate user has PLGO authority
    const userRoles = await this.getUserRoles(user.id);
    if (!userRoles.some(r => ['plgo', 'ministry_official', 'super_admin'].includes(r))) {
      throw new ForbiddenException('Only PLGO can approve at provincial level');
    }

    // Check SLA (14 working days)
    // In production, this would compute working days excluding holidays

    let newStatus: string;
    switch (dto.decision) {
      case ApprovalDecision.APPROVE:
      case ApprovalDecision.APPROVE_WITH_CONDITIONS:
        newStatus = 'approved';
        break;
      case ApprovalDecision.REJECT:
        newStatus = 'rejected';
        break;
      case ApprovalDecision.RETURN:
        newStatus = 'tac_appraisal';
        break;
      default:
        newStatus = 'plgo_review';
    }

    const { data: updatedProject, error } = await this.supabase
      .from('projects')
      .update({
        status: newStatus,
        approved_by: newStatus === 'approved' ? user.id : null,
        approved_at: newStatus === 'approved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to process PLGO decision');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'project.plgo_decision',
      resource_type: 'project',
      resource_id: id,
      details: {
        decision: dto.decision,
        publication_url: dto.publication_url,
      },
    });

    return updatedProject;
  }

  async ministryApprove(id: string, dto: MinistryApprovalDto, user: any) {
    const project = await this.findOne(id);

    // Validate user has Ministry authority
    const userRoles = await this.getUserRoles(user.id);
    if (!userRoles.some(r => ['ministry_official', 'super_admin'].includes(r))) {
      throw new ForbiddenException('Only Ministry officials can provide ministry approval');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'project.ministry_decision',
      resource_type: 'project',
      resource_id: id,
      details: {
        decision: dto.decision,
        gazette_reference: dto.gazette_reference,
      },
    });

    return project;
  }

  async updateProgress(id: string, dto: UpdateProgressDto, user: any) {
    const project = await this.findOne(id);

    if (!['approved', 'implementation'].includes(project.status)) {
      throw new BadRequestException('Can only update progress for approved or in-implementation projects');
    }

    // Auto-transition to implementation if progress > 0
    let newStatus = project.status;
    if (project.status === 'approved' && dto.progress > 0) {
      newStatus = 'implementation';
    }

    const { data: updatedProject, error } = await this.supabase
      .from('projects')
      .update({
        progress: dto.progress,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to update progress');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'project.progress_updated',
      resource_type: 'project',
      resource_id: id,
      details: {
        progress: dto.progress,
        milestone_completed: dto.milestone_completed,
      },
    });

    return updatedProject;
  }

  async complete(id: string, dto: CompleteProjectDto, user: any) {
    const project = await this.findOne(id);

    if (project.status !== 'implementation') {
      throw new BadRequestException('Only projects in implementation can be marked complete');
    }

    // ENFORCEMENT: Completion certificate required
    if (!dto.completion_certificate_uploaded) {
      throw new BadRequestException(
        'ENFORCEMENT: Practical completion certificate is required to mark project complete. ' +
        '(Ref: CDF Regulations 2018, Section 28)'
      );
    }

    const { data: updatedProject, error } = await this.supabase
      .from('projects')
      .update({
        status: 'completed',
        progress: 100,
        actual_end_date: dto.actual_end_date || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to complete project');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'project.completed',
      resource_type: 'project',
      resource_id: id,
      details: { actual_end_date: dto.actual_end_date },
    });

    return updatedProject;
  }

  async reject(id: string, dto: RejectProjectDto, user: any) {
    const project = await this.findOne(id);

    // Can only reject from review stages
    if (!['submitted', 'cdfc_review', 'tac_appraisal', 'plgo_review'].includes(project.status)) {
      throw new BadRequestException('Cannot reject project at this stage');
    }

    const { data: updatedProject, error } = await this.supabase
      .from('projects')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to reject project');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'project.rejected',
      resource_type: 'project',
      resource_id: id,
      details: { reason: dto.reason, notes: dto.notes },
    });

    return updatedProject;
  }

  // ==================== MONITORING & EVALUATION ====================

  async recordMonitoringEvaluation(projectId: string, dto: CreateMonitoringEvaluationDto, user: any) {
    const project = await this.findOne(projectId);

    // Validate user roles for M&E submission
    const userRoles = await this.getUserRoles(user.id);
    if (!userRoles.some(r => ['cdfc_chair', 'plgo', 'super_admin', 'auditor'].includes(r))) {
      throw new ForbiddenException('You are not authorized to submit M&E reports for this project.');
    }

    // Compute distance from declared project GPS if available
    const radiusM = 200; // acceptance radius in meters
    let distanceToProjectM: number | null = null;
    let withinRadius: boolean | null = null;

    if (project.gps_latitude && project.gps_longitude) {
      distanceToProjectM = this.haversineDistanceMeters(
        Number(project.gps_latitude),
        Number(project.gps_longitude),
        Number(dto.gps_latitude),
        Number(dto.gps_longitude),
      );
      withinRadius = distanceToProjectM <= radiusM;
    }

    const { data: siteVisit, error } = await this.supabase
      .from('site_visits')
      .insert({
        project_id: projectId,
        verifier_id: user.id,
        gps_latitude: dto.gps_latitude,
        gps_longitude: dto.gps_longitude,
        verification_date: dto.verification_date,
        notes: dto.notes,
        photo_url: dto.photo_url,
        distance_to_project_m: distanceToProjectM,
        within_radius: withinRadius,
        radius_m: radiusM,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to record M&E report', error);
      throw new BadRequestException('Failed to record M&E report');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'project.m_e_report_recorded',
      resource_type: 'project',
      resource_id: projectId,
      details: {
        gps_latitude: dto.gps_latitude,
        gps_longitude: dto.gps_longitude,
        verification_date: dto.verification_date,
        notes: dto.notes,
      },
    });

    return { message: 'M&E report recorded successfully', data: siteVisit };
  }

  async listSiteVisits(projectId: string, page = 1, limit = 20) {
    const { data, error, count } = await this.supabase
      .from('site_visits')
      .select('*', { count: 'exact' })
      .eq('project_id', projectId)
      .order('verification_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      this.logger.error('Failed to fetch site visits', error);
      throw new BadRequestException('Failed to fetch site visits');
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

  private haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round((R * c) * 100) / 100; // round to cm precision
  }

  // ==================== ANALYTICS ====================

  async getWorkflowStatus(id: string) {
    const project = await this.findOne(id);

    // Calculate SLA status for each stage
    const createdAt = new Date(project.created_at);
    const now = new Date();

    return {
      id: project.id,
      project_number: project.project_number,
      name: project.name,
      current_status: project.status,
      workflow_stages: [
        {
          stage: 'draft',
          completed: project.status !== 'draft',
          completed_at: project.submitted_at,
        },
        {
          stage: 'submitted',
          completed: !['draft', 'submitted'].includes(project.status),
          sla_days: 7,
        },
        {
          stage: 'cdfc_review',
          completed: !['draft', 'submitted', 'cdfc_review'].includes(project.status),
          sla_days: 7,
        },
        {
          stage: 'tac_appraisal',
          completed: !['draft', 'submitted', 'cdfc_review', 'tac_appraisal'].includes(project.status),
          sla_days: 10,
        },
        {
          stage: 'plgo_review',
          completed: !['draft', 'submitted', 'cdfc_review', 'tac_appraisal', 'plgo_review'].includes(project.status),
          sla_days: 14,
        },
        {
          stage: 'approved',
          completed: ['implementation', 'completed'].includes(project.status),
          completed_at: project.approved_at,
        },
        {
          stage: 'implementation',
          completed: project.status === 'completed',
          progress: project.progress,
        },
        {
          stage: 'completed',
          completed: project.status === 'completed',
          completed_at: project.actual_end_date,
        },
      ],
      wdc_signoff: project.wdc_signoff?.[0] || null,
      submitted_by: project.submitted_by,
      submitted_at: project.submitted_at,
      approved_by: project.approved_by,
      approved_at: project.approved_at,
    };
  }

  async getConstituencyStats(constituencyId: string) {
    const { data: projects, error } = await this.supabase
      .from('projects')
      .select('status, budget, spent')
      .eq('constituency_id', constituencyId);

    if (error) {
      throw new BadRequestException('Failed to fetch constituency stats');
    }

    const stats = {
      total_projects: projects.length,
      by_status: {} as Record<string, number>,
      total_budget: 0,
      total_spent: 0,
      ongoing_projects: 0,
      completed_projects: 0,
    };

    for (const project of projects) {
      stats.by_status[project.status] = (stats.by_status[project.status] || 0) + 1;
      stats.total_budget += Number(project.budget) || 0;
      stats.total_spent += Number(project.spent) || 0;

      if (['approved', 'implementation'].includes(project.status)) {
        stats.ongoing_projects++;
      }
      if (project.status === 'completed') {
        stats.completed_projects++;
      }
    }

    return stats;
  }

  // ==================== HELPER METHODS ====================

  private validateStatusTransition(currentStatus: string, targetStatus: string): void {
    const allowedTransitions = PROJECT_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${currentStatus}' to '${targetStatus}'. ` +
        `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`
      );
    }
  }

  private async getUserRoles(userId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    return data?.map(r => r.role) || [];
  }

  private async validateUserConstituencyAccess(userId: string, constituencyId: string): Promise<boolean> {
    // Check if super_admin or ministry_official (national access)
    const roles = await this.getUserRoles(userId);
    if (roles.some(r => ['super_admin', 'ministry_official', 'auditor'].includes(r))) {
      return true;
    }

    // Check direct constituency assignment
    const { data: assignment } = await this.supabase
      .from('user_assignments')
      .select('constituency_id, province_id')
      .eq('user_id', userId)
      .single();

    if (!assignment) return false;
    if (assignment.constituency_id === constituencyId) return true;

    // Check provincial access
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

  private async generateProjectNumber(constituencyId: string): Promise<string> {
    const { data: constituency } = await this.supabase
      .from('constituencies')
      .select('code')
      .eq('id', constituencyId)
      .single();

    const year = new Date().getFullYear();
    const { count } = await this.supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('constituency_id', constituencyId)
      .gte('created_at', `${year}-01-01`);

    const sequence = String((count || 0) + 1).padStart(4, '0');
    return `${constituency?.code || 'XXX'}-${year}-${sequence}`;
  }

  private async checkRequiredDocuments(projectId: string, requiredTypes: string[]): Promise<boolean> {
    const { data: documents } = await this.supabase
      .from('documents')
      .select('document_type')
      .eq('project_id', projectId);

    if (!documents) return false;

    const uploadedTypes = documents.map(d => d.document_type);
    return requiredTypes.every(type =>
      uploadedTypes.some(uploaded => uploaded.toLowerCase().includes(type.toLowerCase()))
    );
  }

  private async logAudit(auditData: any) {
    await this.supabase.from('audit_logs').insert({
      event_type: auditData.action.split('.')[0],
      entity_type: auditData.resource_type,
      entity_id: auditData.resource_id,
      actor_id: auditData.user_id,
      action: auditData.action,
      metadata: auditData.details,
      created_at: new Date().toISOString(),
    });
  }
}
