import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateSiteVisitDto, VisitOutcome } from './dto/create-site-visit.dto';
import { UpdateProjectGeofenceDto } from './dto/update-project-geofence.dto';
import { CreateIssueDto, IssueSeverity } from './dto/create-issue.dto';
import { ScopeContext } from '../common/scope/scope-context';
import { applyScopeToRows } from '../common/scope/scope.utils';

interface GeofenceValidation {
  is_valid: boolean;
  distance_meters: number;
  allowed_radius: number;
  message: string;
}

interface EvidenceScore {
  score: number;
  max_score: number;
  percentage: number;
  factors: Array<{ factor: string; points: number; max: number; reason?: string }>;
  rating: 'excellent' | 'good' | 'fair' | 'weak' | 'insufficient';
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private supabase: SupabaseClient;

  // Default geofence radius in meters
  private readonly DEFAULT_GEOFENCE_RADIUS = 500;

  // Earth radius in meters for Haversine formula
  private readonly EARTH_RADIUS = 6371000;

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

  // ========== Site Visits ==========

  async createSiteVisit(dto: CreateSiteVisitDto, user: any, scopeContext?: ScopeContext) {
    this.logger.log(`User ${user.id} creating site visit for project ${dto.project_id}`);
    await this.assertProjectInScope(dto.project_id, scopeContext);

    // 1. Get project with geofence data
    const { data: project, error: projectError } = await this.supabase
      .from('projects')
      .select('id, name, constituency_id, geofence_lat, geofence_lng, geofence_radius')
      .eq('id', dto.project_id)
      .single();

    if (projectError || !project) {
      throw new NotFoundException('Project not found');
    }

    // 2. Validate GPS against geofence
    const geofenceValidation = this.validateGeofence(
      dto.latitude,
      dto.longitude,
      project.geofence_lat,
      project.geofence_lng,
      project.geofence_radius || this.DEFAULT_GEOFENCE_RADIUS
    );

    if (!geofenceValidation.is_valid) {
      throw new BadRequestException(
        `GPS location outside project geofence. ${geofenceValidation.message}`
      );
    }

    // 3. Validate photo EXIF if photos provided
    let photoValidation = null;
    if (dto.photo_ids && dto.photo_ids.length > 0) {
      photoValidation = await this.validatePhotoExif(dto.photo_ids, dto.latitude, dto.longitude);
    }

    // 4. Calculate evidence score
    const evidenceScore = this.calculateEvidenceScore(dto, photoValidation);

    // 5. Create site visit record
    const { data: visit, error: visitError } = await this.supabase
      .from('site_visits')
      .insert({
        project_id: dto.project_id,
        constituency_id: project.constituency_id,
        visit_type: dto.visit_type,
        visitor_id: user.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
        gps_accuracy: dto.gps_accuracy,
        geofence_distance: geofenceValidation.distance_meters,
        geofence_valid: true,
        physical_progress: dto.physical_progress,
        outcome: dto.outcome,
        observations: dto.observations,
        issues_found: dto.issues_found,
        recommendations: dto.recommendations,
        photo_ids: dto.photo_ids,
        workers_present: dto.workers_present,
        materials_on_site: dto.materials_on_site,
        equipment_on_site: dto.equipment_on_site,
        safety_compliance: dto.safety_compliance,
        evidence_score: evidenceScore.score,
        evidence_max_score: evidenceScore.max_score,
        evidence_rating: evidenceScore.rating,
        evidence_factors: evidenceScore.factors,
        visited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (visitError) {
      this.logger.error('Failed to create site visit', visitError);
      throw new BadRequestException('Failed to create site visit');
    }

    // 6. Update project progress if this is a higher value
    if (dto.physical_progress > 0) {
      await this.updateProjectProgress(dto.project_id, dto.physical_progress);
    }

    // 7. Create issues if any were found
    if (dto.issues_found && dto.outcome !== VisitOutcome.SATISFACTORY) {
      await this.createAutoIssue(visit.id, project.id, dto);
    }

    // 8. Log audit event
    await this.logAudit({
      user_id: user.id,
      action: 'monitoring.site_visit_created',
      resource_type: 'site_visit',
      resource_id: visit.id,
      details: {
        project_id: dto.project_id,
        outcome: dto.outcome,
        evidence_score: evidenceScore.percentage,
        geofence_distance: geofenceValidation.distance_meters,
      },
    });

    return {
      ...visit,
      geofence_validation: geofenceValidation,
      evidence_score: evidenceScore,
    };
  }

  async getSiteVisits(projectId: string, filters?: any, scopeContext?: ScopeContext) {
    await this.assertProjectInScope(projectId, scopeContext);
    const { page = 1, limit = 20 } = filters || {};

    let query = this.supabase
      .from('site_visits')
      .select(`
        *,
        visitor:profiles!site_visits_visitor_id_fkey(id, first_name, last_name),
        project:projects(id, name, project_number)
      `, { count: 'exact' })
      .eq('project_id', projectId)
      .order('visited_at', { ascending: false });

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new BadRequestException('Failed to fetch site visits');
    }

    return {
      data,
      pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    };
  }

  async getSiteVisit(id: string, scopeContext?: ScopeContext) {
    const { data, error } = await this.supabase
      .from('site_visits')
      .select(`
        *,
        visitor:profiles!site_visits_visitor_id_fkey(id, first_name, last_name, email),
        project:projects(id, name, project_number, constituency_id)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Site visit not found');
    }

    if (scopeContext && applyScopeToRows([data], scopeContext).length === 0) {
      throw new NotFoundException('Site visit not found');
    }

    return data;
  }

  // ========== Geofence Management ==========

  async updateProjectGeofence(projectId: string, dto: UpdateProjectGeofenceDto, user: any, scopeContext?: ScopeContext) {
    this.logger.log(`User ${user.id} updating geofence for project ${projectId}`);
    await this.assertProjectInScope(projectId, scopeContext);

    const { data, error } = await this.supabase
      .from('projects')
      .update({
        geofence_lat: dto.latitude,
        geofence_lng: dto.longitude,
        geofence_radius: dto.radius_meters,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to update project geofence');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'monitoring.geofence_updated',
      resource_type: 'project',
      resource_id: projectId,
      details: { latitude: dto.latitude, longitude: dto.longitude, radius: dto.radius_meters },
    });

    return data;
  }

  async getProjectGeofence(projectId: string, scopeContext?: ScopeContext) {
    await this.assertProjectInScope(projectId, scopeContext);

    const { data, error } = await this.supabase
      .from('projects')
      .select('id, name, geofence_lat, geofence_lng, geofence_radius, location_description')
      .eq('id', projectId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Project not found');
    }

    return {
      project_id: data.id,
      project_name: data.name,
      location_description: data.location_description,
      geofence: {
        latitude: data.geofence_lat,
        longitude: data.geofence_lng,
        radius_meters: data.geofence_radius || this.DEFAULT_GEOFENCE_RADIUS,
        is_set: !!data.geofence_lat && !!data.geofence_lng,
      },
    };
  }

  // ========== Issues/Defects ==========

  async createIssue(dto: CreateIssueDto, user: any, scopeContext?: ScopeContext) {
    this.logger.log(`User ${user.id} creating issue for project ${dto.project_id}`);
    await this.assertProjectInScope(dto.project_id, scopeContext);

    // Get project constituency
    const { data: project } = await this.supabase
      .from('projects')
      .select('constituency_id')
      .eq('id', dto.project_id)
      .single();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const { data: issue, error } = await this.supabase
      .from('project_issues')
      .insert({
        project_id: dto.project_id,
        constituency_id: project.constituency_id,
        site_visit_id: dto.site_visit_id,
        category: dto.category,
        severity: dto.severity,
        title: dto.title,
        description: dto.description,
        corrective_action: dto.corrective_action,
        photo_ids: dto.photo_ids,
        status: 'open',
        reported_by: user.id,
        reported_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to create issue');
    }

    await this.logAudit({
      user_id: user.id,
      action: 'monitoring.issue_created',
      resource_type: 'project_issue',
      resource_id: issue.id,
      details: { project_id: dto.project_id, severity: dto.severity, category: dto.category },
    });

    return issue;
  }

  async getIssues(projectId: string, filters?: any, scopeContext?: ScopeContext) {
    await this.assertProjectInScope(projectId, scopeContext);
    const { status, severity, page = 1, limit = 20 } = filters || {};

    let query = this.supabase
      .from('project_issues')
      .select(`
        *,
        reporter:profiles!project_issues_reported_by_fkey(id, first_name, last_name),
        resolver:profiles!project_issues_resolved_by_fkey(id, first_name, last_name)
      `, { count: 'exact' })
      .eq('project_id', projectId)
      .order('reported_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (severity) query = query.eq('severity', severity);

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new BadRequestException('Failed to fetch issues');
    }

    return {
      data,
      pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    };
  }

  async resolveIssue(issueId: string, resolution: string, user: any, scopeContext?: ScopeContext) {
    await this.assertIssueInScope(issueId, scopeContext);

    const { data, error } = await this.supabase
      .from('project_issues')
      .update({
        status: 'resolved',
        resolution,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', issueId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to resolve issue');
    }

    return data;
  }

  // ========== KPI & Analytics ==========

  async getProjectKPIs(projectId: string, scopeContext?: ScopeContext) {
    await this.assertProjectInScope(projectId, scopeContext);

    // Get project details
    const { data: project } = await this.supabase
      .from('projects')
      .select('id, name, budget, progress, status, start_date, expected_end_date')
      .eq('id', projectId)
      .single();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get site visit stats
    const { data: visits } = await this.supabase
      .from('site_visits')
      .select('physical_progress, outcome, evidence_score, evidence_max_score, visited_at')
      .eq('project_id', projectId)
      .order('visited_at', { ascending: false });

    // Get issue stats
    const { data: issues } = await this.supabase
      .from('project_issues')
      .select('severity, status')
      .eq('project_id', projectId);

    // Get payment stats
    const { data: payments } = await this.supabase
      .from('payments')
      .select('amount, status')
      .eq('project_id', projectId);

    // Calculate KPIs
    const totalVisits = visits?.length || 0;
    const lastVisit = visits?.[0];
    const avgEvidenceScore = visits?.length
      ? visits.reduce((sum, v) => sum + ((v.evidence_score / v.evidence_max_score) * 100), 0) / visits.length
      : 0;

    const openIssues = issues?.filter(i => i.status === 'open').length || 0;
    const criticalIssues = issues?.filter(i => i.severity === 'critical' && i.status === 'open').length || 0;

    const totalSpent = payments
      ?.filter(p => p.status === 'disbursed')
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    const spendVsProgress = project.budget > 0 && project.progress > 0
      ? (totalSpent / project.budget) / (project.progress / 100)
      : 0;

    return {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
      },
      physical: {
        progress: project.progress || 0,
        last_verified_progress: lastVisit?.physical_progress,
        last_visit_date: lastVisit?.visited_at,
        total_visits: totalVisits,
      },
      financial: {
        budget: project.budget,
        spent: totalSpent,
        utilization: project.budget > 0 ? (totalSpent / project.budget) * 100 : 0,
        spend_vs_progress_ratio: spendVsProgress,
      },
      quality: {
        avg_evidence_score: Math.round(avgEvidenceScore),
        open_issues: openIssues,
        critical_issues: criticalIssues,
        total_issues: issues?.length || 0,
      },
      schedule: {
        start_date: project.start_date,
        expected_end_date: project.expected_end_date,
        days_remaining: project.expected_end_date
          ? Math.ceil((new Date(project.expected_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
      },
    };
  }

  async getConstituencyMEStats(constituencyId: string, scopeContext?: ScopeContext) {
    if (scopeContext && applyScopeToRows([{ constituency_id: constituencyId } as any], scopeContext).length === 0) {
      throw new NotFoundException('Constituency not found');
    }

    // Get all projects in constituency
    const { data: projects } = await this.supabase
      .from('projects')
      .select('id, name, progress, status, budget')
      .eq('constituency_id', constituencyId);

    // Get visit stats
    const { data: visits } = await this.supabase
      .from('site_visits')
      .select('project_id, outcome, evidence_rating')
      .eq('constituency_id', constituencyId);

    // Get issue stats
    const { data: issues } = await this.supabase
      .from('project_issues')
      .select('severity, status')
      .eq('constituency_id', constituencyId);

    const projectCount = projects?.length || 0;
    const avgProgress = projects?.reduce((sum, p) => sum + (p.progress || 0), 0) / (projectCount || 1);

    const visitsByOutcome: Record<string, number> = {};
    visits?.forEach(v => {
      visitsByOutcome[v.outcome] = (visitsByOutcome[v.outcome] || 0) + 1;
    });

    const issuesBySeverity: Record<string, number> = {};
    const openIssues = issues?.filter(i => i.status === 'open') || [];
    openIssues.forEach(i => {
      issuesBySeverity[i.severity] = (issuesBySeverity[i.severity] || 0) + 1;
    });

    return {
      constituency_id: constituencyId,
      projects: {
        total: projectCount,
        avg_progress: Math.round(avgProgress),
        by_status: this.groupBy(projects || [], 'status'),
      },
      site_visits: {
        total: visits?.length || 0,
        by_outcome: visitsByOutcome,
      },
      issues: {
        total: issues?.length || 0,
        open: openIssues.length,
        by_severity: issuesBySeverity,
      },
    };
  }

  // ========== Helper Methods ==========

  private validateGeofence(
    visitLat: number,
    visitLng: number,
    projectLat: number | null,
    projectLng: number | null,
    radiusMeters: number
  ): GeofenceValidation {
    // If no geofence set, warn but allow
    if (!projectLat || !projectLng) {
      return {
        is_valid: true,
        distance_meters: 0,
        allowed_radius: radiusMeters,
        message: 'Warning: Project geofence not set. Please configure geofence for future visits.',
      };
    }

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(visitLat, visitLng, projectLat, projectLng);

    const isValid = distance <= radiusMeters;

    return {
      is_valid: isValid,
      distance_meters: Math.round(distance),
      allowed_radius: radiusMeters,
      message: isValid
        ? `Location verified: ${Math.round(distance)}m from project center (within ${radiusMeters}m radius)`
        : `Location rejected: ${Math.round(distance)}m from project center (outside ${radiusMeters}m radius)`,
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.EARTH_RADIUS * c;
  }

  private async validatePhotoExif(photoIds: string[], visitLat: number, visitLng: number) {
    // Get photo metadata
    const { data: photos } = await this.supabase
      .from('documents')
      .select('id, metadata')
      .in('id', photoIds);

    const validations = photos?.map(photo => {
      const exif = photo.metadata?.exif;
      if (!exif?.latitude || !exif?.longitude) {
        return { photo_id: photo.id, valid: false, reason: 'No GPS data in photo' };
      }

      const distance = this.calculateDistance(visitLat, visitLng, exif.latitude, exif.longitude);
      const valid = distance <= 100; // Photos should be within 100m of reported location

      return {
        photo_id: photo.id,
        valid,
        distance_meters: Math.round(distance),
        reason: valid ? 'Photo location matches' : `Photo taken ${Math.round(distance)}m from reported location`,
      };
    }) || [];

    return {
      total: validations.length,
      valid: validations.filter(v => v.valid).length,
      validations,
    };
  }

  private calculateEvidenceScore(dto: CreateSiteVisitDto, photoValidation: any): EvidenceScore {
    const factors: Array<{ factor: string; points: number; max: number; reason?: string }> = [];
    let totalPoints = 0;
    const maxPoints = 100;

    // Factor 1: GPS accuracy (20 points)
    const gpsPoints = dto.gps_accuracy && dto.gps_accuracy <= 10 ? 20
      : dto.gps_accuracy && dto.gps_accuracy <= 50 ? 15
      : dto.gps_accuracy && dto.gps_accuracy <= 100 ? 10
      : 5;
    factors.push({ factor: 'GPS Accuracy', points: gpsPoints, max: 20, reason: `${dto.gps_accuracy || 'Unknown'}m accuracy` });
    totalPoints += gpsPoints;

    // Factor 2: Photos provided (25 points)
    const photoCount = dto.photo_ids?.length || 0;
    const photoPoints = photoCount >= 5 ? 25 : photoCount >= 3 ? 20 : photoCount >= 1 ? 10 : 0;
    factors.push({ factor: 'Photo Evidence', points: photoPoints, max: 25, reason: `${photoCount} photos` });
    totalPoints += photoPoints;

    // Factor 3: Photo EXIF validation (15 points)
    if (photoValidation) {
      const exifPoints = photoValidation.valid === photoValidation.total ? 15
        : photoValidation.valid > 0 ? 10 : 0;
      factors.push({ factor: 'Photo GPS Match', points: exifPoints, max: 15, reason: `${photoValidation.valid}/${photoValidation.total} verified` });
      totalPoints += exifPoints;
    } else {
      factors.push({ factor: 'Photo GPS Match', points: 0, max: 15, reason: 'No photos to verify' });
    }

    // Factor 4: Detailed observations (20 points)
    const obsLength = dto.observations?.length || 0;
    const obsPoints = obsLength >= 500 ? 20 : obsLength >= 200 ? 15 : obsLength >= 100 ? 10 : 5;
    factors.push({ factor: 'Observation Detail', points: obsPoints, max: 20, reason: `${obsLength} characters` });
    totalPoints += obsPoints;

    // Factor 5: Site details provided (20 points)
    let detailPoints = 0;
    if (dto.workers_present !== undefined) detailPoints += 5;
    if (dto.materials_on_site) detailPoints += 5;
    if (dto.equipment_on_site) detailPoints += 5;
    if (dto.safety_compliance) detailPoints += 5;
    factors.push({ factor: 'Site Details', points: detailPoints, max: 20, reason: `${detailPoints / 5}/4 fields completed` });
    totalPoints += detailPoints;

    const percentage = Math.round((totalPoints / maxPoints) * 100);
    const rating = percentage >= 80 ? 'excellent'
      : percentage >= 60 ? 'good'
      : percentage >= 40 ? 'fair'
      : percentage >= 20 ? 'weak'
      : 'insufficient';

    return {
      score: totalPoints,
      max_score: maxPoints,
      percentage,
      factors,
      rating,
    };
  }

  private async updateProjectProgress(projectId: string, newProgress: number) {
    const { data: project } = await this.supabase
      .from('projects')
      .select('progress')
      .eq('id', projectId)
      .single();

    if (project && newProgress > (project.progress || 0)) {
      await this.supabase
        .from('projects')
        .update({ progress: newProgress, updated_at: new Date().toISOString() })
        .eq('id', projectId);
    }
  }

  private async createAutoIssue(visitId: string, projectId: string, dto: CreateSiteVisitDto) {
    // Auto-create an issue based on visit findings
    const severity = dto.outcome === VisitOutcome.WORK_STOPPED ? IssueSeverity.CRITICAL
      : dto.outcome === VisitOutcome.UNSATISFACTORY ? IssueSeverity.HIGH
      : IssueSeverity.MEDIUM;

    await this.supabase.from('project_issues').insert({
      project_id: projectId,
      site_visit_id: visitId,
      category: 'quality',
      severity,
      title: `Issues found during ${dto.visit_type} visit`,
      description: dto.issues_found,
      corrective_action: dto.recommendations,
      status: 'open',
      reported_at: new Date().toISOString(),
    });
  }

  private groupBy(arr: any[], key: string): Record<string, number> {
    return arr.reduce((acc, item) => {
      const val = item[key] || 'unknown';
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
  }


  private async assertProjectInScope(projectId: string, scopeContext?: ScopeContext) {
    if (!scopeContext) return;
    const { data: project } = await this.supabase
      .from('projects')
      .select('id, constituency:constituencies(id, district:districts(province:provinces(name)))')
      .eq('id', projectId)
      .maybeSingle();
    if (!project || applyScopeToRows([project], scopeContext).length === 0) {
      throw new NotFoundException('Project not found');
    }
  }

  private async assertIssueInScope(issueId: string, scopeContext?: ScopeContext) {
    if (!scopeContext) return;
    const { data: issue } = await this.supabase
      .from('project_issues')
      .select('id, constituency_id')
      .eq('id', issueId)
      .maybeSingle();
    if (!issue || applyScopeToRows([issue], scopeContext).length === 0) {
      throw new NotFoundException('Issue not found');
    }
  }

  private async logAudit(auditData: any) {
    await this.supabase.from('audit_logs').insert(auditData);
  }
}
