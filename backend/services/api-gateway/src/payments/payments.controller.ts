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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApprovePanelDto } from './dto/approve-panel.dto';
import { DisbursePaymentDto } from './dto/disburse-payment.dto';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all payments with filters' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async findAll(
    @Query('status') status?: string,
    @Query('project_id') projectId?: string,
    @Query('constituency_id') constituencyId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @CurrentUser() user?: any,
    @Req() req?: any,
  ) {
    return this.paymentsService.findAll({
      status,
      projectId,
      constituencyId,
      page,
      limit,
      user,
      scopeContext: req?.scopeContext,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create payment request' })
  @ApiResponse({ status: 201, description: 'Payment request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  @ApiResponse({ status: 403, description: 'User does not have permission to create payment' })
  @Roles('mp', 'cdfc_chair', 'finance_officer', 'project_manager')
  async create(@Body() createPaymentDto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.create(createPaymentDto, user);
  }

  @Post(':id/panel-a/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Panel A approval (MP, CDFC Chair, or Finance Officer)' })
  @ApiResponse({ status: 200, description: 'Panel A approval recorded' })
  @ApiResponse({ status: 400, description: 'Invalid approval' })
  @ApiResponse({ status: 403, description: 'User does not have Panel A authority' })
  @Roles('mp', 'cdfc_chair', 'finance_officer')
  async approvePanelA(
    @Param('id') id: string,
    @Body() approvePanelDto: ApprovePanelDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.approvePanelA(id, user, approvePanelDto);
  }

  @Post(':id/panel-b/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Panel B approval (PLGO or Ministry Official)' })
  @ApiResponse({ status: 200, description: 'Panel B approval recorded' })
  @ApiResponse({ status: 400, description: 'Panel A must approve first' })
  @ApiResponse({ status: 403, description: 'User does not have Panel B authority' })
  @Roles('plgo', 'ministry_official')
  async approvePanelB(
    @Param('id') id: string,
    @Body() approvePanelDto: ApprovePanelDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.approvePanelB(id, user, approvePanelDto);
  }

  @Post(':id/disburse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disburse payment (after both panels approve)' })
  @ApiResponse({ status: 200, description: 'Payment disbursed successfully' })
  @ApiResponse({ status: 400, description: 'Payment not fully approved' })
  @ApiResponse({ status: 403, description: 'User does not have disbursement authority' })
  @Roles('super_admin', 'finance_officer')
  async disburse(
    @Param('id') id: string,
    @Body() disbursePaymentDto: DisbursePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.disburse(id, user, disbursePaymentDto);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get payment approval status and workflow state' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  async getStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.getStatus(id, user);
  }
}
