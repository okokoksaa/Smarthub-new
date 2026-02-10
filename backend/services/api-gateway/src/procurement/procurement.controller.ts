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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProcurementService } from './procurement.service';
import { SealedBidsService } from './sealed-bids.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateProcurementDto } from './dto/create-procurement.dto';
import { SubmitBidDto } from './dto/submit-bid.dto';
import { OpenBidsDto } from './dto/open-bids.dto';
import { EvaluateBidDto } from './dto/evaluate-bid.dto';
import { AwardContractDto } from './dto/award-contract.dto';

@ApiTags('Procurements')
@Controller('procurements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProcurementController {
  constructor(
    private readonly procurementService: ProcurementService,
    private readonly sealedBidsService: SealedBidsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all procurements with filters' })
  @ApiResponse({ status: 200, description: 'Procurements retrieved successfully' })
  async findAll(
    @Query('status') status?: string,
    @Query('constituency_id') constituencyId?: string,
    @Query('procurement_method') procurementMethod?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @CurrentUser() user?: any,
  ) {
    return this.procurementService.findAll({
      status,
      constituencyId,
      procurementMethod,
      page,
      limit,
      user,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get procurement details' })
  @ApiResponse({ status: 200, description: 'Procurement retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Procurement not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.procurementService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create new procurement/tender' })
  @ApiResponse({ status: 201, description: 'Procurement created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid procurement data' })
  @ApiResponse({ status: 403, description: 'User does not have permission' })
  @Roles('finance_officer', 'cdfc_chair', 'plgo', 'super_admin')
  async create(@Body() createProcurementDto: CreateProcurementDto, @CurrentUser() user: any) {
    return this.procurementService.create(createProcurementDto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update procurement details' })
  @ApiResponse({ status: 200, description: 'Procurement updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot update published procurement' })
  @Roles('finance_officer', 'cdfc_chair', 'plgo', 'super_admin')
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateProcurementDto>,
    @CurrentUser() user: any,
  ) {
    return this.procurementService.update(id, updateDto, user);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish tender for bidding' })
  @ApiResponse({ status: 200, description: 'Tender published successfully' })
  @ApiResponse({ status: 400, description: 'Invalid tender state for publishing' })
  @Roles('cdfc_chair', 'plgo', 'super_admin')
  async publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.procurementService.publish(id, user);
  }

  // ========== Sealed Bids Endpoints ==========

  @Post(':id/bids')
  @ApiOperation({ summary: 'Submit sealed bid (contractor only)' })
  @ApiResponse({ status: 201, description: 'Bid submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bidding period closed or invalid' })
  @ApiResponse({ status: 403, description: 'Only contractors can submit bids' })
  @Roles('contractor')
  async submitBid(
    @Param('id') id: string,
    @Body() submitBidDto: SubmitBidDto,
    @CurrentUser() user: any,
  ) {
    return this.sealedBidsService.submitBid(id, submitBidDto, user);
  }

  @Get(':id/bids')
  @ApiOperation({ summary: 'Get bids for procurement (only after opening)' })
  @ApiResponse({ status: 200, description: 'Bids retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bids not yet opened' })
  @Roles('cdfc_chair', 'finance_officer', 'tac_chair', 'tac_member', 'plgo', 'super_admin', 'auditor')
  async getBids(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sealedBidsService.getBids(id, user);
  }

  @Post(':id/open-bids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Open sealed bids (only on/after bid_opening_date)' })
  @ApiResponse({ status: 200, description: 'Bids opened successfully' })
  @ApiResponse({ status: 400, description: 'Cannot open bids before opening date' })
  @ApiResponse({ status: 403, description: 'User does not have authority to open bids' })
  @Roles('cdfc_chair', 'finance_officer', 'super_admin')
  async openBids(
    @Param('id') id: string,
    @Body() openBidsDto: OpenBidsDto,
    @CurrentUser() user: any,
  ) {
    return this.sealedBidsService.openBids(id, openBidsDto, user);
  }

  // ========== Evaluation Endpoints ==========

  @Post(':id/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit bid evaluation (TAC members only)' })
  @ApiResponse({ status: 200, description: 'Evaluation submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bids not opened or already evaluated' })
  @ApiResponse({ status: 403, description: 'Only TAC members can evaluate' })
  @Roles('tac_chair', 'tac_member', 'super_admin')
  async evaluateBid(
    @Param('id') id: string,
    @Body() evaluateBidDto: EvaluateBidDto,
    @CurrentUser() user: any,
  ) {
    return this.procurementService.evaluateBid(id, evaluateBidDto, user);
  }

  @Get(':id/evaluations')
  @ApiOperation({ summary: 'Get all evaluations for procurement' })
  @ApiResponse({ status: 200, description: 'Evaluations retrieved successfully' })
  @Roles('tac_chair', 'tac_member', 'cdfc_chair', 'plgo', 'super_admin', 'auditor')
  async getEvaluations(@Param('id') id: string, @CurrentUser() user: any) {
    return this.procurementService.getEvaluations(id, user);
  }

  // ========== Award Endpoints ==========

  @Post(':id/award')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Award contract to winning bidder' })
  @ApiResponse({ status: 200, description: 'Contract awarded successfully' })
  @ApiResponse({ status: 400, description: 'Prerequisites not met for award' })
  @ApiResponse({ status: 403, description: 'User does not have award authority' })
  @Roles('cdfc_chair', 'plgo', 'super_admin')
  async awardContract(
    @Param('id') id: string,
    @Body() awardContractDto: AwardContractDto,
    @CurrentUser() user: any,
  ) {
    return this.procurementService.awardContract(id, awardContractDto, user);
  }

  // ========== Audit Trail Endpoint ==========

  @Get(':id/audit-trail')
  @ApiOperation({ summary: 'Get audit trail for procurement' })
  @ApiResponse({ status: 200, description: 'Audit trail retrieved successfully' })
  @Roles('auditor', 'super_admin', 'ministry_official')
  async getAuditTrail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.procurementService.getAuditTrail(id, user);
  }

  // ========== Status Endpoint ==========

  @Get(':id/status')
  @ApiOperation({ summary: 'Get procurement workflow status' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully' })
  async getStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return this.procurementService.getStatus(id, user);
  }
}
