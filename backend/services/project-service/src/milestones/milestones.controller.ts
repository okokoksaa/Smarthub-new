import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { CompleteMilestoneDto, VerifyMilestoneDto } from './dto/complete-milestone.dto';

/**
 * Milestones Controller
 * Handles all milestone management endpoints
 */
@ApiTags('Milestones')
@Controller('milestones')
@ApiBearerAuth()
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  // ==================== Milestone CRUD ====================

  @Post()
  @ApiOperation({ summary: 'Create a new milestone' })
  @ApiResponse({ status: 201, description: 'Milestone created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or percentage weight exceeds 100%' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  create(@Body() createMilestoneDto: CreateMilestoneDto, @Request() req: any) {
    return this.milestonesService.create(createMilestoneDto, req.user.id);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all milestones for a project' })
  @ApiResponse({ status: 200, description: 'Milestones retrieved successfully' })
  findByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.milestonesService.findByProject(projectId);
  }

  @Get('project/:projectId/stats')
  @ApiOperation({ summary: 'Get milestone statistics for a project' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getProjectStats(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.milestonesService.getProjectStats(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get milestone by ID' })
  @ApiResponse({ status: 200, description: 'Milestone retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.milestonesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update milestone' })
  @ApiResponse({ status: 200, description: 'Milestone updated successfully' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  @ApiResponse({ status: 400, description: 'Cannot update completed milestones' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
    @Request() req: any,
  ) {
    return this.milestonesService.update(id, updateMilestoneDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete milestone' })
  @ApiResponse({ status: 204, description: 'Milestone deleted successfully' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete completed milestones' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.milestonesService.remove(id);
  }

  // ==================== Milestone Lifecycle ====================

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start milestone execution' })
  @ApiResponse({ status: 200, description: 'Milestone started successfully' })
  @ApiResponse({ status: 400, description: 'Only pending milestones can be started' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  start(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.milestonesService.start(id, req.user.id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark milestone as completed' })
  @ApiResponse({ status: 200, description: 'Milestone completed successfully' })
  @ApiResponse({ status: 400, description: 'Milestone already completed' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() completeDto: CompleteMilestoneDto,
    @Request() req: any,
  ) {
    return this.milestonesService.complete(id, completeDto, req.user.id);
  }

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify completed milestone' })
  @ApiResponse({ status: 200, description: 'Milestone verified successfully' })
  @ApiResponse({ status: 400, description: 'Only completed milestones can be verified' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() verifyDto: VerifyMilestoneDto,
    @Request() req: any,
  ) {
    return this.milestonesService.verify(id, verifyDto, req.user.id);
  }
}
