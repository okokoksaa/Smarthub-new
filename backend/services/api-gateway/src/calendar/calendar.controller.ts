import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateHolidayDto, UpdateHolidayDto, SLAPeriod } from './dto/create-holiday.dto';

@ApiTags('Calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // ==================== HOLIDAYS CRUD ====================

  @Get('holidays')
  @ApiOperation({ summary: 'List all public holidays' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Filter by year' })
  async findAllHolidays(@Query('year') year?: string) {
    const data = await this.calendarService.findAllHolidays(year ? parseInt(year) : undefined);
    return { data };
  }

  @Get('holidays/:id')
  @ApiOperation({ summary: 'Get holiday by ID' })
  @ApiParam({ name: 'id', description: 'Holiday UUID' })
  async findHolidayById(@Param('id') id: string) {
    const data = await this.calendarService.findHolidayById(id);
    return { data };
  }

  @Post('holidays')
  @ApiOperation({ summary: 'Create a new public holiday' })
  @Roles('super_admin', 'ministry_official')
  async createHoliday(@Body() dto: CreateHolidayDto, @CurrentUser() user: any) {
    const data = await this.calendarService.createHoliday(dto, user);
    return { data, message: 'Holiday created successfully' };
  }

  @Patch('holidays/:id')
  @ApiOperation({ summary: 'Update a public holiday' })
  @Roles('super_admin', 'ministry_official')
  async updateHoliday(
    @Param('id') id: string,
    @Body() dto: UpdateHolidayDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.calendarService.updateHoliday(id, dto, user);
    return { data, message: 'Holiday updated successfully' };
  }

  @Delete('holidays/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a public holiday' })
  @Roles('super_admin')
  async deleteHoliday(@Param('id') id: string, @CurrentUser() user: any) {
    await this.calendarService.deleteHoliday(id, user);
    return { message: 'Holiday deleted successfully' };
  }

  // ==================== WORKING DAYS CALCULATION ====================

  @Get('working-days')
  @ApiOperation({ summary: 'Calculate working days between two dates' })
  @ApiQuery({ name: 'start_date', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end_date', required: true, description: 'End date (YYYY-MM-DD)' })
  async calculateWorkingDays(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    const data = await this.calendarService.calculateWorkingDays(startDate, endDate);
    return { data };
  }

  @Get('deadline')
  @ApiOperation({ summary: 'Calculate deadline date from start date and working days' })
  @ApiQuery({ name: 'start_date', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'working_days', required: true, type: Number, description: 'Number of working days' })
  async calculateDeadline(
    @Query('start_date') startDate: string,
    @Query('working_days') workingDays: string,
  ) {
    const data = await this.calendarService.calculateDeadline(startDate, parseInt(workingDays));
    return { data };
  }

  // ==================== SLA CALCULATIONS ====================

  @Get('sla/wdc-endorsement')
  @ApiOperation({ summary: 'Calculate WDC endorsement deadline (7 working days)' })
  @ApiQuery({ name: 'start_date', required: true, description: 'Start date (YYYY-MM-DD)' })
  async calculateWdcDeadline(@Query('start_date') startDate: string) {
    const data = await this.calendarService.calculateSLADeadline(startDate, SLAPeriod.WDC_ENDORSEMENT);
    return { data };
  }

  @Get('sla/cdfc-review')
  @ApiOperation({ summary: 'Calculate CDFC review deadline (10 working days)' })
  @ApiQuery({ name: 'start_date', required: true, description: 'Start date (YYYY-MM-DD)' })
  async calculateCdfcDeadline(@Query('start_date') startDate: string) {
    const data = await this.calendarService.calculateSLADeadline(startDate, SLAPeriod.CDFC_REVIEW);
    return { data };
  }

  @Get('sla/tac-appraisal')
  @ApiOperation({ summary: 'Calculate TAC appraisal deadline (14 working days)' })
  @ApiQuery({ name: 'start_date', required: true, description: 'Start date (YYYY-MM-DD)' })
  async calculateTacDeadline(@Query('start_date') startDate: string) {
    const data = await this.calendarService.calculateSLADeadline(startDate, SLAPeriod.TAC_APPRAISAL);
    return { data };
  }

  @Get('sla/plgo-approval')
  @ApiOperation({ summary: 'Calculate PLGO approval deadline (14 working days)' })
  @ApiQuery({ name: 'start_date', required: true, description: 'Start date (YYYY-MM-DD)' })
  async calculatePlgoDeadline(@Query('start_date') startDate: string) {
    const data = await this.calendarService.calculateSLADeadline(startDate, SLAPeriod.PLGO_APPROVAL);
    return { data };
  }

  @Get('sla/ministry-review')
  @ApiOperation({ summary: 'Calculate Ministry review deadline (30 working days)' })
  @ApiQuery({ name: 'start_date', required: true, description: 'Start date (YYYY-MM-DD)' })
  async calculateMinistryDeadline(@Query('start_date') startDate: string) {
    const data = await this.calendarService.calculateSLADeadline(startDate, SLAPeriod.MINISTRY_REVIEW);
    return { data };
  }

  @Get('sla/check-breach')
  @ApiOperation({ summary: 'Check if an SLA deadline has been breached' })
  @ApiQuery({ name: 'start_date', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'working_days', required: true, type: Number, description: 'SLA working days' })
  @ApiQuery({ name: 'current_date', required: false, description: 'Current date to check against (defaults to today)' })
  async checkDeadlineBreach(
    @Query('start_date') startDate: string,
    @Query('working_days') workingDays: string,
    @Query('current_date') currentDate?: string,
  ) {
    const data = await this.calendarService.isDeadlineBreached(
      startDate,
      parseInt(workingDays),
      currentDate,
    );
    return { data };
  }

  // ==================== SEED DATA ====================

  @Post('seed/:year')
  @ApiOperation({ summary: 'Seed Zambian public holidays for a year' })
  @ApiParam({ name: 'year', description: 'Year to seed holidays for' })
  @Roles('super_admin')
  async seedHolidays(@Param('year') year: string, @CurrentUser() user: any) {
    const data = await this.calendarService.seedZambianHolidays(parseInt(year), user);
    return { data, message: `Seeded ${data.length} holidays for ${year}` };
  }
}
