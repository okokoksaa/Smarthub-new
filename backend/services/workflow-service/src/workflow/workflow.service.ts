import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ProjectStateMachine,
  ProjectStatus,
  ProjectTransition,
} from '../state-machines/project.state-machine';
import {
  PaymentStateMachine,
  PaymentStatus,
  PaymentTransition,
} from '../state-machines/payment.state-machine';

export interface WorkflowTransitionResult {
  success: boolean;
  entityId: string;
  entityType: 'project' | 'payment';
  previousStatus: string;
  newStatus: string;
  transition: ProjectTransition | PaymentTransition;
  timestamp: string;
}

export interface WorkflowEvent {
  id: string;
  entityType: 'project' | 'payment';
  entityId: string;
  eventType: string;
  previousStatus: string;
  newStatus: string;
  actorId: string;
  actorRoles: string[];
  comments?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

@Injectable()
export class WorkflowService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Execute a project workflow transition
   */
  async executeProjectTransition(
    projectId: string,
    targetStatus: ProjectStatus,
    userId: string,
    userRoles: string[],
    comments?: string,
  ): Promise<WorkflowTransitionResult> {
    // Get current project
    const { data: project, error } = await this.supabase
      .from('projects')
      .select('id, status, name, constituency_id')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      throw new BadRequestException(`Project ${projectId} not found`);
    }

    const currentStatus = project.status as ProjectStatus;
    const transition = ProjectStateMachine.getTransition(currentStatus, targetStatus);

    if (!transition) {
      throw new BadRequestException(
        `Invalid transition from ${currentStatus} to ${targetStatus}`,
      );
    }

    // Check user authorization
    if (!ProjectStateMachine.canUserTransition(currentStatus, targetStatus, userRoles)) {
      throw new ForbiddenException(
        `User does not have permission to transition from ${currentStatus} to ${targetStatus}`,
      );
    }

    // Check if comment is required
    if (transition.requiresComment && !comments) {
      throw new BadRequestException('Comments are required for this transition');
    }

    // Execute transition
    const updateData: Record<string, unknown> = {
      status: targetStatus,
      updated_at: new Date().toISOString(),
    };

    // Set specific fields based on transition
    if (targetStatus === 'submitted') {
      updateData.submitted_at = new Date().toISOString();
      updateData.submitted_by = userId;
    }
    if (targetStatus === 'approved') {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = userId;
    }
    if (targetStatus === 'completed') {
      updateData.actual_end_date = new Date().toISOString().split('T')[0];
    }

    const { error: updateError } = await this.supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (updateError) {
      throw new BadRequestException(`Failed to update project: ${updateError.message}`);
    }

    // Log workflow event
    await this.logWorkflowEvent({
      entityType: 'project',
      entityId: projectId,
      eventType: transition.notificationEvent,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      actorId: userId,
      actorRoles: userRoles,
      comments,
    });

    return {
      success: true,
      entityId: projectId,
      entityType: 'project',
      previousStatus: currentStatus,
      newStatus: targetStatus,
      transition,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute a payment workflow transition
   */
  async executePaymentTransition(
    paymentId: string,
    targetStatus: PaymentStatus,
    userId: string,
    userRoles: string[],
    comments?: string,
  ): Promise<WorkflowTransitionResult> {
    // Get current payment
    const { data: payment, error } = await this.supabase
      .from('payments')
      .select('id, status, panel_a_approved_by, panel_b_approved_by, amount')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      throw new BadRequestException(`Payment ${paymentId} not found`);
    }

    const currentStatus = payment.status as PaymentStatus;
    const transition = PaymentStateMachine.getTransition(currentStatus, targetStatus);

    if (!transition) {
      throw new BadRequestException(
        `Invalid transition from ${currentStatus} to ${targetStatus}`,
      );
    }

    // Check user authorization
    if (!PaymentStateMachine.canUserTransition(currentStatus, targetStatus, userRoles)) {
      throw new ForbiddenException(
        `User does not have permission to transition from ${currentStatus} to ${targetStatus}`,
      );
    }

    // Validate Two-Panel Authorization
    if (transition.panel === 'B') {
      const validation = PaymentStateMachine.validateTwoPanelAuth(
        payment.panel_a_approved_by,
        userId,
      );
      if (!validation.valid) {
        throw new ForbiddenException(validation.error);
      }
    }

    // Check if comment is required
    if (transition.requiresComment && !comments) {
      throw new BadRequestException('Comments are required for this transition');
    }

    // Execute transition
    const updateData: Record<string, unknown> = {
      status: targetStatus,
      updated_at: new Date().toISOString(),
    };

    // Set panel-specific fields
    if (transition.panel === 'A') {
      if (targetStatus === 'panel_a_approved') {
        updateData.panel_a_approved_by = userId;
        updateData.panel_a_approved_at = new Date().toISOString();
        updateData.panel_a_decision = 'approved';
      } else if (targetStatus === 'panel_a_rejected') {
        updateData.panel_a_approved_by = userId;
        updateData.panel_a_approved_at = new Date().toISOString();
        updateData.panel_a_decision = 'rejected';
        updateData.panel_a_comments = comments;
      }
    }

    if (transition.panel === 'B') {
      if (targetStatus === 'approved') {
        updateData.panel_b_approved_by = userId;
        updateData.panel_b_approved_at = new Date().toISOString();
        updateData.panel_b_decision = 'approved';
      } else if (targetStatus === 'rejected') {
        updateData.panel_b_approved_by = userId;
        updateData.panel_b_approved_at = new Date().toISOString();
        updateData.panel_b_decision = 'rejected';
        updateData.panel_b_comments = comments;
      }
    }

    if (targetStatus === 'disbursed') {
      updateData.disbursed_at = new Date().toISOString();
      updateData.disbursed_by = userId;
    }

    const { error: updateError } = await this.supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId);

    if (updateError) {
      throw new BadRequestException(`Failed to update payment: ${updateError.message}`);
    }

    // Log workflow event
    await this.logWorkflowEvent({
      entityType: 'payment',
      entityId: paymentId,
      eventType: transition.notificationEvent,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      actorId: userId,
      actorRoles: userRoles,
      comments,
    });

    return {
      success: true,
      entityId: paymentId,
      entityType: 'payment',
      previousStatus: currentStatus,
      newStatus: targetStatus,
      transition,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get available transitions for a project
   */
  getProjectTransitions(currentStatus: ProjectStatus, userRoles: string[]): ProjectTransition[] {
    return ProjectStateMachine.getAvailableTransitions(currentStatus, userRoles);
  }

  /**
   * Get available transitions for a payment
   */
  getPaymentTransitions(currentStatus: PaymentStatus, userRoles: string[]): PaymentTransition[] {
    return PaymentStateMachine.getAvailableTransitions(currentStatus, userRoles);
  }

  /**
   * Get workflow history for an entity
   */
  async getWorkflowHistory(
    entityType: 'project' | 'payment',
    entityId: string,
  ): Promise<WorkflowEvent[]> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_type', entityType)
      .eq('resource_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Failed to fetch workflow history: ${error.message}`);
    }

    return (data || []).map(log => ({
      id: log.id,
      entityType,
      entityId: log.resource_id,
      eventType: log.action,
      previousStatus: log.details?.previous_status || '',
      newStatus: log.details?.new_status || '',
      actorId: log.user_id,
      actorRoles: log.details?.actor_roles || [],
      comments: log.details?.comments,
      metadata: log.details,
      timestamp: log.created_at,
    }));
  }

  /**
   * Log a workflow event to audit logs
   */
  private async logWorkflowEvent(event: Omit<WorkflowEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      await this.supabase.from('audit_logs').insert({
        user_id: event.actorId,
        action: event.eventType,
        resource_type: event.entityType,
        resource_id: event.entityId,
        details: {
          previous_status: event.previousStatus,
          new_status: event.newStatus,
          actor_roles: event.actorRoles,
          comments: event.comments,
          ...event.metadata,
        },
      });
    } catch (error) {
      console.error('Failed to log workflow event:', error);
    }
  }
}
