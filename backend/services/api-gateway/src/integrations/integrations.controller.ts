import {
  Controller,
  Post,
  Get,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { IntegrationsService } from './integrations.service';

@ApiTags('Integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class IntegrationsController {
  constructor(private readonly svc: IntegrationsService) {}

  @Post('banks/import-csv')
  @ApiOperation({ summary: 'Import bank statement CSV and persist transactions' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bank_name: { type: 'string' },
        account_number: { type: 'string' },
        statement_period_start: { type: 'string', format: 'date' },
        statement_period_end: { type: 'string', format: 'date' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['bank_name', 'account_number', 'file'],
    },
  })
  @Roles('finance_officer', 'cdfc_chair', 'super_admin')
  async importBankCsv(
    @UploadedFile() file: any,
    @Body('bank_name') bankName: string,
    @Body('account_number') accountNumber: string,
    @Body('statement_period_start') start?: string,
    @Body('statement_period_end') end?: string,
    @CurrentUser() user?: any,
  ) {
    return this.svc.importBankCsv({ file, bankName, accountNumber, start, end, user });
  }

  @Get('banks/imports')
  @ApiOperation({ summary: 'List bank imports' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listBankImports(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.svc.listBankImports(Number(page), Number(limit));
  }
}
