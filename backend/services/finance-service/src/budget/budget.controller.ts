import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetStatus } from '@shared/database';

@ApiTags('Budgets')
@Controller('budgets')
@ApiBearerAuth()
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @ApiOperation({ summary: 'Create budget allocation' })
  @ApiResponse({ status: 201, description: 'Budget created successfully' })
  create(@Body() createBudgetDto: CreateBudgetDto, @Request() req: any) {
    return this.budgetService.create(createBudgetDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List budget allocations' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'constituency_id', required: false })
  @ApiQuery({ name: 'project_id', required: false })
  @ApiQuery({ name: 'fiscal_year', required: false })
  @ApiQuery({ name: 'status', required: false, enum: BudgetStatus })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('constituency_id') constituencyId?: string,
    @Query('project_id') projectId?: string,
    @Query('fiscal_year') fiscalYear?: number,
    @Query('status') status?: BudgetStatus,
  ) {
    return this.budgetService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      constituencyId,
      projectId,
      fiscalYear: fiscalYear ? Number(fiscalYear) : undefined,
      status,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get budget statistics' })
  @ApiQuery({ name: 'constituency_id', required: false })
  @ApiQuery({ name: 'fiscal_year', required: false })
  getStatistics(
    @Query('constituency_id') constituencyId?: string,
    @Query('fiscal_year') fiscalYear?: number,
  ) {
    return this.budgetService.getStatistics(
      constituencyId,
      fiscalYear ? Number(fiscalYear) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.budgetService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update budget allocation' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @Request() req: any,
  ) {
    return this.budgetService.update(id, updateBudgetDto, req.user.id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve budget allocation' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes: string,
    @Request() req: any,
  ) {
    return this.budgetService.approve(id, notes, req.user.id);
  }

  @Post(':id/allocate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Allocate budget (make active)' })
  allocate(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.budgetService.allocate(id, req.user.id);
  }

  // Additional routes aligned with API Gateway

  @Get('constituency/:constituencyId/:fiscalYear')
  @ApiOperation({ summary: 'Get budget for a specific constituency and fiscal year' })
  async findBudgetByConstituency(
    @Param('constituencyId', ParseUUIDPipe) constituencyId: string,
    @Param('fiscalYear') fiscalYear: number,
  ) {
    return this.budgetService.findByConstituencyAndYear(constituencyId, Number(fiscalYear));
  }

  @Get('constituency/:constituencyId/:fiscalYear/utilization')
  @ApiOperation({ summary: 'Get budget utilization analytics' })
  async getBudgetUtilization(
    @Param('constituencyId', ParseUUIDPipe) constituencyId: string,
    @Param('fiscalYear') fiscalYear: number,
  ) {
    return this.budgetService.getUtilization(constituencyId, Number(fiscalYear));
  }
}
