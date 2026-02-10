import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApprovePaymentDto, ExecutePaymentDto } from './dto/approve-payment.dto';
import { PaymentStatus } from '@shared/database';

@ApiTags('Payments')
@Controller('payments')
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create payment voucher' })
  @ApiResponse({ status: 201, description: 'Payment voucher created' })
  create(@Body() createPaymentDto: CreatePaymentDto, @Request() req: any) {
    return this.paymentsService.create(createPaymentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List payment vouchers' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'fiscalYear', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('projectId') projectId?: string,
    @Query('status') status?: PaymentStatus,
    @Query('fiscalYear') fiscalYear?: number,
  ) {
    return this.paymentsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      projectId,
      status,
      fiscalYear: fiscalYear ? Number(fiscalYear) : undefined,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'fiscalYear', required: false })
  getStatistics(
    @Query('projectId') projectId?: string,
    @Query('fiscalYear') fiscalYear?: number,
  ) {
    return this.paymentsService.getStatistics(
      projectId,
      fiscalYear ? Number(fiscalYear) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit payment for approval (commits budget)' })
  submit(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.paymentsService.submit(id, req.user.id);
  }

  @Post(':id/panel-a-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Panel A (CDFC) approval - First approval' })
  panelAApprove(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approvalDto: ApprovePaymentDto,
    @Request() req: any,
  ) {
    return this.paymentsService.panelAApprove(id, approvalDto, req.user.id);
  }

  // Aligned routes with API Gateway
  @Post(':id/panel-a/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Panel A approval (MP, CDFC Chair, or Finance Officer)' })
  panelAApproveAligned(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approvalDto: ApprovePaymentDto,
    @Request() req: any,
  ) {
    return this.paymentsService.panelAApprove(id, approvalDto, req.user.id);
  }

  @Post(':id/panel-b-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Panel B (Local Authority) approval - Second approval' })
  panelBApprove(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approvalDto: ApprovePaymentDto,
    @Request() req: any,
  ) {
    return this.paymentsService.panelBApprove(id, approvalDto, req.user.id);
  }

  @Post(':id/panel-b/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Panel B approval (PLGO or Ministry Official)' })
  panelBApproveAligned(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approvalDto: ApprovePaymentDto,
    @Request() req: any,
  ) {
    return this.paymentsService.panelBApprove(id, approvalDto, req.user.id);
  }

  @Post(':id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute payment (requires both Panel A + Panel B approval, utilizes budget)',
  })
  executePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() executeDto: ExecutePaymentDto,
    @Request() req: any,
  ) {
    return this.paymentsService.executePayment(id, executeDto, req.user.id);
  }

  @Post(':id/disburse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disburse payment (after both panels approve)' })
  disburse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() executeDto: ExecutePaymentDto,
    @Request() req: any,
  ) {
    return this.paymentsService.executePayment(id, executeDto, req.user.id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get payment approval status and workflow state' })
  getStatus(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel payment voucher (releases budget commitment)' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    return this.paymentsService.cancel(id, reason, req.user.id);
  }
}
