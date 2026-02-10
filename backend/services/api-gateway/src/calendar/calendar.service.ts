import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateHolidayDto, UpdateHolidayDto, SLAPeriod } from './dto/create-holiday.dto';

export interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  year: number;
  is_recurring: boolean;
  created_at: string;
}

export interface WorkingDaysResult {
  start_date: string;
  end_date: string;
  calendar_days: number;
  working_days: number;
  weekends: number;
  holidays: number;
  holiday_list: PublicHoliday[];
}

export interface DeadlineResult {
  start_date: string;
  working_days_required: number;
  deadline_date: string;
  calendar_days: number;
  holidays_skipped: PublicHoliday[];
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  // ==================== HOLIDAYS CRUD ====================

  async findAllHolidays(year?: number): Promise<PublicHoliday[]> {
    let query = this.supabase
      .from('public_holidays')
      .select('*')
      .order('date', { ascending: true });

    if (year) {
      // Get holidays for specific year (including recurring ones)
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;
      query = query.gte('date', startOfYear).lte('date', endOfYear);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to fetch holidays', error);
      throw new BadRequestException('Failed to fetch holidays');
    }

    return data || [];
  }

  async findHolidayById(id: string): Promise<PublicHoliday> {
    const { data, error } = await this.supabase
      .from('public_holidays')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Holiday not found: ${id}`);
    }

    return data;
  }

  async createHoliday(dto: CreateHolidayDto, user: any): Promise<PublicHoliday> {
    // Check for duplicate date
    const { data: existing } = await this.supabase
      .from('public_holidays')
      .select('id')
      .eq('date', dto.date)
      .single();

    if (existing) {
      throw new BadRequestException(`A holiday already exists on ${dto.date}`);
    }

    const { data, error } = await this.supabase
      .from('public_holidays')
      .insert({
        name: dto.name,
        date: dto.date,
        is_recurring: dto.is_recurring ?? false,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create holiday', error);
      throw new BadRequestException('Failed to create holiday');
    }

    await this.logAudit(user.id, 'holiday.created', 'public_holiday', data.id, dto);
    return data;
  }

  async updateHoliday(id: string, dto: UpdateHolidayDto, user: any): Promise<PublicHoliday> {
    const { data, error } = await this.supabase
      .from('public_holidays')
      .update({
        ...dto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update holiday', error);
      throw new BadRequestException('Failed to update holiday');
    }

    await this.logAudit(user.id, 'holiday.updated', 'public_holiday', id, dto);
    return data;
  }

  async deleteHoliday(id: string, user: any): Promise<void> {
    const { error } = await this.supabase
      .from('public_holidays')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Failed to delete holiday', error);
      throw new BadRequestException('Failed to delete holiday');
    }

    await this.logAudit(user.id, 'holiday.deleted', 'public_holiday', id, {});
  }

  // ==================== WORKING DAYS CALCULATION ====================

  /**
   * Calculate the number of working days between two dates.
   * Excludes weekends (Saturday, Sunday) and public holidays.
   */
  async calculateWorkingDays(startDate: string, endDate: string): Promise<WorkingDaysResult> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    // Get holidays in range
    const { data: holidays } = await this.supabase
      .from('public_holidays')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    const holidayDates = new Set((holidays || []).map((h) => h.date));

    let workingDays = 0;
    let weekends = 0;
    let holidayCount = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Weekend (Sunday = 0, Saturday = 6)
        weekends++;
      } else if (holidayDates.has(dateStr)) {
        // Public holiday
        holidayCount++;
      } else {
        // Working day
        workingDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    const calendarDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      start_date: startDate,
      end_date: endDate,
      calendar_days: calendarDays,
      working_days: workingDays,
      weekends,
      holidays: holidayCount,
      holiday_list: holidays || [],
    };
  }

  /**
   * Calculate the deadline date given a start date and number of working days.
   * Used for SLA calculations.
   */
  async calculateDeadline(startDate: string, workingDays: number): Promise<DeadlineResult> {
    if (workingDays < 0) {
      throw new BadRequestException('Working days must be non-negative');
    }

    const start = new Date(startDate);

    // Get holidays for the next 90 days (should be enough for any SLA)
    const endSearchDate = new Date(start);
    endSearchDate.setDate(endSearchDate.getDate() + 90);

    const { data: holidays } = await this.supabase
      .from('public_holidays')
      .select('*')
      .gte('date', startDate)
      .lte('date', endSearchDate.toISOString().split('T')[0]);

    const holidayDates = new Set((holidays || []).map((h) => h.date));
    const holidaysSkipped: PublicHoliday[] = [];

    const current = new Date(start);
    let daysAdded = 0;

    // Move to the next working day if start is not a working day
    while (true) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];

      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
        break;
      }
      current.setDate(current.getDate() + 1);
    }

    // Add working days
    while (daysAdded < workingDays) {
      current.setDate(current.getDate() + 1);
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue; // Skip weekend
      }

      if (holidayDates.has(dateStr)) {
        const holiday = (holidays || []).find((h) => h.date === dateStr);
        if (holiday) holidaysSkipped.push(holiday);
        continue; // Skip holiday
      }

      daysAdded++;
    }

    const deadlineDate = current.toISOString().split('T')[0];
    const calendarDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return {
      start_date: startDate,
      working_days_required: workingDays,
      deadline_date: deadlineDate,
      calendar_days: calendarDays,
      holidays_skipped: holidaysSkipped,
    };
  }

  /**
   * Calculate SLA deadline for a specific workflow stage.
   */
  async calculateSLADeadline(
    startDate: string,
    slaPeriod: SLAPeriod,
  ): Promise<DeadlineResult & { sla_type: string }> {
    const result = await this.calculateDeadline(startDate, slaPeriod);
    return {
      ...result,
      sla_type: this.getSlaName(slaPeriod),
    };
  }

  private getSlaName(slaPeriod: SLAPeriod): string {
    switch (slaPeriod) {
      case SLAPeriod.WDC_ENDORSEMENT:
        return 'WDC Endorsement';
      case SLAPeriod.CDFC_REVIEW:
        return 'CDFC Review';
      case SLAPeriod.TAC_APPRAISAL:
        return 'TAC Appraisal';
      case SLAPeriod.PLGO_APPROVAL:
        return 'PLGO Approval';
      case SLAPeriod.MINISTRY_REVIEW:
        return 'Ministry Review';
      default:
        return 'Unknown SLA';
    }
  }

  /**
   * Check if a deadline has been breached.
   */
  async isDeadlineBreached(
    startDate: string,
    workingDays: number,
    currentDate?: string,
  ): Promise<{ breached: boolean; days_overdue: number; deadline_date: string }> {
    const deadline = await this.calculateDeadline(startDate, workingDays);
    const current = new Date(currentDate || new Date().toISOString().split('T')[0]);
    const deadlineDate = new Date(deadline.deadline_date);

    const breached = current > deadlineDate;
    let daysOverdue = 0;

    if (breached) {
      // Calculate working days overdue
      const overdueResult = await this.calculateWorkingDays(
        deadline.deadline_date,
        current.toISOString().split('T')[0],
      );
      daysOverdue = overdueResult.working_days;
    }

    return {
      breached,
      days_overdue: daysOverdue,
      deadline_date: deadline.deadline_date,
    };
  }

  // ==================== SEED DATA ====================

  /**
   * Seed Zambian public holidays for a given year.
   * Call this once per year or when setting up the system.
   */
  async seedZambianHolidays(year: number, user: any): Promise<PublicHoliday[]> {
    // Fixed date holidays
    const fixedHolidays = [
      { name: "New Year's Day", month: 1, day: 1 },
      { name: 'Youth Day', month: 3, day: 12 },
      { name: 'Labour Day', month: 5, day: 1 },
      { name: 'Africa Day', month: 5, day: 25 },
      { name: "Heroes' Day", month: 7, day: 6 },
      { name: 'Unity Day', month: 7, day: 7 },
      { name: "Farmers' Day", month: 8, day: 3 },
      { name: 'National Prayer Day', month: 10, day: 18 },
      { name: 'Independence Day', month: 10, day: 24 },
      { name: 'Christmas Day', month: 12, day: 25 },
    ];

    const holidays: CreateHolidayDto[] = fixedHolidays.map((h) => ({
      name: h.name,
      date: `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`,
      is_recurring: true,
    }));

    // Easter dates vary by year - would need calculation
    // For now, we'll skip Easter or require manual entry

    const created: PublicHoliday[] = [];
    for (const holiday of holidays) {
      try {
        const h = await this.createHoliday(holiday, user);
        created.push(h);
      } catch (e) {
        // Skip if already exists
        this.logger.warn(`Holiday ${holiday.name} may already exist for ${year}`);
      }
    }

    return created;
  }

  // ==================== HELPERS ====================

  private async logAudit(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    details: any,
  ) {
    await this.supabase.from('audit_logs').insert({
      event_type: action.split('.')[0],
      entity_type: entityType,
      entity_id: entityId,
      actor_id: userId,
      action,
      metadata: details,
      created_at: new Date().toISOString(),
    });
  }
}
