import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditsService } from './audits.service';

@ApiTags('Audits')
@Controller('audits')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AuditsController {
  constructor(private readonly svc: AuditsService) {}

  @Get('red-flags')
  @ApiOperation({ summary: 'Run red-flag analytics across payments and approvals' })
  @ApiQuery({ name: 'start_date', required: false, type: String })
  @ApiQuery({ name: 'end_date', required: false, type: String })
  @ApiQuery({ name: 'constituency_id', required: false, type: String })
  @ApiQuery({ name: 'min_large_amount', required: false, type: Number, description: 'Threshold for large payment flag (default 1000000)' })
  @Roles('auditor', 'super_admin', 'plgo', 'ministry_official', 'finance_officer')
  async getRedFlags(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('constituency_id') constituencyId?: string,
    @Query('min_large_amount') minLargeAmount?: string,
    @Req() req?: any,
  ) {
    return this.svc.getRedFlags({
      startDate,
      endDate,
      constituencyId,
      minLargeAmount: minLargeAmount ? Number(minLargeAmount) : undefined,
      scopeContext: req?.scopeContext,
    });
  }
}

