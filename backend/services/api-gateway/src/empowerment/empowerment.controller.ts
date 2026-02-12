import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EmpowermentService } from './empowerment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateEmpowermentDto } from './dto/create-empowerment.dto';
import { UpdateEmpowermentDto } from './dto/update-empowerment.dto';
import { ApproveEmpowermentDto } from './dto/approve-empowerment.dto';
import { DisburseEmpowermentDto } from './dto/disburse-empowerment.dto';

@ApiTags('Empowerment Grants')
@Controller('empowerment')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EmpowermentController {
  constructor(private readonly empowermentService: EmpowermentService) {}

  @Get()
  @ApiOperation({ summary: 'List all empowerment grants with filters' })
  @ApiResponse({ status: 200, description: 'Grants retrieved successfully' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'constituency_id', required: false })
  @ApiQuery({ name: 'grant_type', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('status') status?: string,
    @Query('constituency_id') constituencyId?: string,
    @Query('grant_type') grantType?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @CurrentUser() user?: any,
    @Req() req?: any,
  ) {
    return this.empowermentService.findAll({
      status,
      constituencyId,
      grantType,
      page,
      limit,
      user,
      scopeContext: req?.scopeContext,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get empowerment grant details' })
  @ApiResponse({ status: 200, description: 'Grant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Grant not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.empowermentService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create new empowerment grant application' })
  @ApiResponse({ status: 201, description: 'Grant application created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid application data or eligibility not met' })
  @ApiResponse({ status: 403, description: 'User does not have permission' })
  @Roles('cdfc_chair', 'cdfc_member', 'wdc_member', 'citizen', 'super_admin')
  async create(@Body() createDto: CreateEmpowermentDto, @CurrentUser() user: any) {
    return this.empowermentService.create(createDto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update empowerment grant application' })
  @ApiResponse({ status: 200, description: 'Grant updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot update grant in current status' })
  @Roles('cdfc_chair', 'cdfc_member', 'wdc_member', 'super_admin')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEmpowermentDto,
    @CurrentUser() user: any,
  ) {
    return this.empowermentService.update(id, updateDto, user);
  }

  @Post(':id/shortlist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Shortlist empowerment grant for approval' })
  @ApiResponse({ status: 200, description: 'Grant shortlisted successfully' })
  @ApiResponse({ status: 400, description: 'Grant not in correct status' })
  @Roles('cdfc_chair', 'finance_officer', 'plgo', 'super_admin')
  async shortlist(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @CurrentUser() user: any,
  ) {
    return this.empowermentService.shortlist(id, user, comments);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject empowerment grant' })
  @ApiResponse({ status: 200, description: 'Decision processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status or missing required data' })
  @Roles('cdfc_chair', 'plgo', 'super_admin')
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveEmpowermentDto,
    @CurrentUser() user: any,
  ) {
    return this.empowermentService.approve(id, approveDto, user);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject empowerment grant application' })
  @ApiResponse({ status: 200, description: 'Grant rejected successfully' })
  @Roles('cdfc_chair', 'plgo', 'super_admin')
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.empowermentService.approve(id, {
      decision: 'reject' as any,
      rejection_reason: reason,
    }, user);
  }

  @Post(':id/disburse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disburse approved empowerment grant' })
  @ApiResponse({ status: 200, description: 'Grant disbursed successfully' })
  @ApiResponse({ status: 400, description: 'Grant not approved or insufficient budget' })
  @Roles('finance_officer', 'plgo', 'super_admin')
  async disburse(
    @Param('id') id: string,
    @Body() disburseDto: DisburseEmpowermentDto,
    @CurrentUser() user: any,
  ) {
    return this.empowermentService.disburse(id, disburseDto, user);
  }

  @Post(':id/completion-report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit completion report for disbursed grant' })
  @ApiResponse({ status: 200, description: 'Completion report submitted' })
  @ApiResponse({ status: 400, description: 'Grant not in disbursed status' })
  @Roles('cdfc_chair', 'cdfc_member', 'wdc_member', 'plgo', 'super_admin')
  async submitCompletionReport(
    @Param('id') id: string,
    @Body('report') report: string,
    @CurrentUser() user: any,
  ) {
    return this.empowermentService.submitCompletionReport(id, report, user);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get empowerment grant workflow status' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully' })
  async getStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return this.empowermentService.getStatus(id, user);
  }

  @Post('check-eligibility')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check eligibility for empowerment grant' })
  @ApiResponse({ status: 200, description: 'Eligibility check completed' })
  async checkEligibility(@Body() dto: CreateEmpowermentDto) {
    return this.empowermentService.checkEligibility(dto);
  }

  @Get('analytics/:constituencyId')
  @ApiOperation({ summary: 'Get empowerment grant analytics for constituency' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @Roles('cdfc_chair', 'finance_officer', 'plgo', 'ministry_official', 'auditor', 'super_admin')
  async getAnalytics(@Param('constituencyId') constituencyId: string) {
    return this.empowermentService.getAnalytics(constituencyId);
  }
}
