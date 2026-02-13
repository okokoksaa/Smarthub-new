import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  ApproveBudgetDto,
  CreateExpenditureReturnDto,
  ReviewReturnDto,
} from './dto/budget.dto';

@ApiTags('Budgets')
@Controller('budgets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  // ==================== BUDGETS ====================

  @Get()
  @ApiOperation({ summary: 'List all budgets' })
  @ApiQuery({ name: 'fiscal_year', required: false, type: Number })
  @ApiQuery({ name: 'constituency_id', required: false })
  async findAllBudgets(
    @Query('fiscal_year') fiscalYear?: number,
    @Query('constituency_id') constituencyId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    const pageNum = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 20;

    return this.budgetsService.findAllBudgets({
      fiscalYear: fiscalYear ? Number(fiscalYear) : undefined,
      constituencyId,
      page: pageNum,
      limit: limitNum,
      scopeContext: req?.scopeContext,
    });
  }

  @Get('constituency/:constituencyId/:fiscalYear')
  @ApiOperation({ summary: 'Get budget for a specific constituency and fiscal year' })
  async findBudgetByConstituency(
    @Param('constituencyId') constituencyId: string,
    @Param('fiscalYear') fiscalYear: number,
    @Request() req?: any,
  ) {
    return this.budgetsService.findBudgetByConstituency(constituencyId, Number(fiscalYear), req?.scopeContext);
  }

  @Get('constituency/:constituencyId/:fiscalYear/utilization')
  @ApiOperation({ summary: 'Get budget utilization analytics' })
  async getBudgetUtilization(
    @Param('constituencyId') constituencyId: string,
    @Param('fiscalYear') fiscalYear: number,
    @Request() req?: any,
  ) {
    return this.budgetsService.getBudgetUtilization(constituencyId, Number(fiscalYear), req?.scopeContext);
  }

  @Post()
  @ApiOperation({ summary: 'Create budget allocation' })
  @Roles('ministry_official', 'super_admin')
  async createBudget(@Body() dto: CreateBudgetDto, @CurrentUser() user: any) {
    return this.budgetsService.createBudget(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update budget allocation' })
  @Roles('ministry_official', 'super_admin')
  async updateBudget(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
    @CurrentUser() user: any,
  ) {
    return this.budgetsService.updateBudget(id, dto, user);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve budget' })
  @Roles('ministry_official', 'super_admin')
  async approveBudget(
    @Param('id') id: string,
    @Body() dto: ApproveBudgetDto,
    @CurrentUser() user: any,
  ) {
    return this.budgetsService.approveBudget(id, dto, user);
  }

  // ==================== EXPENDITURE RETURNS ====================

  @Get('returns')
  @ApiOperation({ summary: 'List all expenditure returns' })
  @ApiQuery({ name: 'fiscal_year', required: false, type: Number })
  @ApiQuery({ name: 'quarter', required: false, type: Number })
  @ApiQuery({ name: 'constituency_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAllReturns(
    @Query('fiscal_year') fiscalYear?: number,
    @Query('quarter') quarter?: number,
    @Query('constituency_id') constituencyId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    const pageNum = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 20;

    return this.budgetsService.findAllReturns({
      fiscalYear: fiscalYear ? Number(fiscalYear) : undefined,
      quarter: quarter ? Number(quarter) : undefined,
      constituencyId,
      status,
      page: pageNum,
      limit: limitNum,
      scopeContext: req?.scopeContext,
    });
  }

  @Post('returns')
  @ApiOperation({ summary: 'Create expenditure return' })
  @Roles('finance_officer', 'cdfc_chair', 'super_admin')
  async createReturn(@Body() dto: CreateExpenditureReturnDto, @CurrentUser() user: any) {
    return this.budgetsService.createReturn(dto, user);
  }

  @Post('returns/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit expenditure return for review' })
  @Roles('finance_officer', 'cdfc_chair', 'super_admin')
  async submitReturn(@Param('id') id: string, @CurrentUser() user: any) {
    return this.budgetsService.submitReturn(id, user);
  }

  @Post('returns/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review expenditure return (approve/reject)' })
  @Roles('plgo', 'ministry_official', 'super_admin')
  async reviewReturn(
    @Param('id') id: string,
    @Body() dto: ReviewReturnDto,
    @CurrentUser() user: any,
  ) {
    return this.budgetsService.reviewReturn(id, dto, user);
  }
}
