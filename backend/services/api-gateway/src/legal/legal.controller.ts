import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { LegalService } from './legal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Legal & Compliance')
@Controller('legal')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  /**
   * Get legal dashboard summary
   * GET /api/v1/legal/dashboard
   */
  @Get('dashboard')
  @Roles('auditor', 'plgo', 'ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Get legal and compliance dashboard summary' })
  async getDashboardSummary() {
    const summary = await this.legalService.getDashboardSummary();
    return {
      success: true,
      data: summary,
    };
  }

  // ========== CONTRACTS ==========

  /**
   * Get contracts
   * GET /api/v1/legal/contracts
   */
  @Get('contracts')
  @Roles('finance_officer', 'auditor', 'plgo', 'ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Get contracts with filtering' })
  @ApiQuery({ name: 'constituency_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'contract_type', required: false })
  async getContracts(
    @Query('constituency_id') constituencyId?: string,
    @Query('status') status?: string,
    @Query('contract_type') contractType?: string,
  ) {
    const contracts = await this.legalService.getContracts(constituencyId, status, contractType);
    return {
      success: true,
      data: contracts,
      total: contracts.length,
    };
  }

  /**
   * Get contract by ID
   * GET /api/v1/legal/contracts/:id
   */
  @Get('contracts/:id')
  @ApiOperation({ summary: 'Get contract by ID' })
  async getContract(@Param('id', ParseUUIDPipe) id: string) {
    const contract = await this.legalService.getContract(id);
    return {
      success: true,
      data: contract,
    };
  }

  /**
   * Create contract
   * POST /api/v1/legal/contracts
   */
  @Post('contracts')
  @Roles('finance_officer', 'plgo', 'ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Create a new contract' })
  async createContract(
    @Body() body: any,
    @CurrentUser() user: { id: string },
  ) {
    const contract = await this.legalService.createContract(body, user.id);
    return {
      success: true,
      data: contract,
    };
  }

  /**
   * Update contract status
   * PATCH /api/v1/legal/contracts/:id/status
   */
  @Patch('contracts/:id/status')
  @Roles('finance_officer', 'plgo', 'ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Update contract status' })
  async updateContractStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string },
    @CurrentUser() user: { id: string },
  ) {
    const contract = await this.legalService.updateContractStatus(id, body.status, user.id);
    return {
      success: true,
      data: contract,
    };
  }

  // ========== LEGAL CASES ==========

  /**
   * Get legal cases
   * GET /api/v1/legal/cases
   */
  @Get('cases')
  @Roles('auditor', 'plgo', 'ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Get legal cases' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'case_type', required: false })
  @ApiQuery({ name: 'priority', required: false })
  async getLegalCases(
    @Query('status') status?: string,
    @Query('case_type') caseType?: string,
    @Query('priority') priority?: string,
  ) {
    const cases = await this.legalService.getLegalCases(status, caseType, priority);
    return {
      success: true,
      data: cases,
      total: cases.length,
    };
  }

  /**
   * Get legal case by ID
   * GET /api/v1/legal/cases/:id
   */
  @Get('cases/:id')
  @Roles('auditor', 'plgo', 'ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Get legal case by ID' })
  async getLegalCase(@Param('id', ParseUUIDPipe) id: string) {
    const legalCase = await this.legalService.getLegalCase(id);
    return {
      success: true,
      data: legalCase,
    };
  }

  /**
   * Create legal case
   * POST /api/v1/legal/cases
   */
  @Post('cases')
  @Roles('auditor', 'plgo', 'ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Create a new legal case' })
  async createLegalCase(
    @Body() body: any,
    @CurrentUser() user: { id: string },
  ) {
    const legalCase = await this.legalService.createLegalCase(body, user.id);
    return {
      success: true,
      data: legalCase,
    };
  }

  /**
   * Update legal case
   * PATCH /api/v1/legal/cases/:id
   */
  @Patch('cases/:id')
  @Roles('auditor', 'plgo', 'ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Update legal case' })
  async updateLegalCase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentUser() user: { id: string },
  ) {
    const legalCase = await this.legalService.updateLegalCase(id, body, user.id);
    return {
      success: true,
      data: legalCase,
    };
  }

  // ========== COMPLIANCE ==========

  /**
   * Get compliance items
   * GET /api/v1/legal/compliance
   */
  @Get('compliance')
  @Roles('auditor', 'plgo', 'ministry_official', 'cdfc_chair', 'super_admin')
  @ApiOperation({ summary: 'Get compliance items' })
  @ApiQuery({ name: 'constituency_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getComplianceItems(
    @Query('constituency_id') constituencyId?: string,
    @Query('status') status?: string,
  ) {
    const items = await this.legalService.getComplianceItems(constituencyId, status);
    return {
      success: true,
      data: items,
      total: items.length,
    };
  }

  /**
   * Update compliance status
   * PATCH /api/v1/legal/compliance/:id
   */
  @Patch('compliance/:id')
  @Roles('auditor', 'plgo', 'ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Update compliance status' })
  async updateComplianceStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; notes?: string },
    @CurrentUser() user: { id: string },
  ) {
    const item = await this.legalService.updateComplianceStatus(
      id,
      body.status,
      user.id,
      body.notes,
    );
    return {
      success: true,
      data: item,
    };
  }

  // ========== LEGAL OPINIONS ==========

  /**
   * Get legal opinions
   * GET /api/v1/legal/opinions
   */
  @Get('opinions')
  @ApiOperation({ summary: 'Get legal opinions' })
  @ApiQuery({ name: 'opinion_type', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getLegalOpinions(
    @Query('opinion_type') opinionType?: string,
    @Query('search') search?: string,
  ) {
    const opinions = await this.legalService.getLegalOpinions(opinionType, search);
    return {
      success: true,
      data: opinions,
      total: opinions.length,
    };
  }

  /**
   * Create legal opinion
   * POST /api/v1/legal/opinions
   */
  @Post('opinions')
  @Roles('ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Create a legal opinion' })
  async createLegalOpinion(
    @Body() body: any,
    @CurrentUser() user: { id: string },
  ) {
    const opinion = await this.legalService.createLegalOpinion(body, user.id);
    return {
      success: true,
      data: opinion,
    };
  }
}
