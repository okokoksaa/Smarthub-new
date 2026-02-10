import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { ProjectStatus } from '../state-machines/project.state-machine';
import { PaymentStatus } from '../state-machines/payment.state-machine';

interface TransitionDto {
  targetStatus: string;
  userId: string;
  userRoles: string[];
  comments?: string;
}

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  /**
   * Execute a project workflow transition
   * POST /workflow/projects/:id/transition
   */
  @Post('projects/:id/transition')
  async transitionProject(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() dto: TransitionDto,
  ) {
    const result = await this.workflowService.executeProjectTransition(
      projectId,
      dto.targetStatus as ProjectStatus,
      dto.userId,
      dto.userRoles,
      dto.comments,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get available project transitions
   * GET /workflow/projects/:id/transitions
   */
  @Get('projects/:id/transitions')
  async getProjectTransitions(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Query('currentStatus') currentStatus: ProjectStatus,
    @Query('userRoles') userRoles: string,
  ) {
    const roles = userRoles.split(',');
    const transitions = this.workflowService.getProjectTransitions(currentStatus, roles);

    return {
      success: true,
      data: transitions,
    };
  }

  /**
   * Get project workflow history
   * GET /workflow/projects/:id/history
   */
  @Get('projects/:id/history')
  async getProjectHistory(@Param('id', ParseUUIDPipe) projectId: string) {
    const history = await this.workflowService.getWorkflowHistory('project', projectId);

    return {
      success: true,
      data: history,
    };
  }

  /**
   * Execute a payment workflow transition
   * POST /workflow/payments/:id/transition
   */
  @Post('payments/:id/transition')
  async transitionPayment(
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Body() dto: TransitionDto,
  ) {
    const result = await this.workflowService.executePaymentTransition(
      paymentId,
      dto.targetStatus as PaymentStatus,
      dto.userId,
      dto.userRoles,
      dto.comments,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get available payment transitions
   * GET /workflow/payments/:id/transitions
   */
  @Get('payments/:id/transitions')
  async getPaymentTransitions(
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Query('currentStatus') currentStatus: PaymentStatus,
    @Query('userRoles') userRoles: string,
  ) {
    const roles = userRoles.split(',');
    const transitions = this.workflowService.getPaymentTransitions(currentStatus, roles);

    return {
      success: true,
      data: transitions,
    };
  }

  /**
   * Get payment workflow history
   * GET /workflow/payments/:id/history
   */
  @Get('payments/:id/history')
  async getPaymentHistory(@Param('id', ParseUUIDPipe) paymentId: string) {
    const history = await this.workflowService.getWorkflowHistory('payment', paymentId);

    return {
      success: true,
      data: history,
    };
  }
}
