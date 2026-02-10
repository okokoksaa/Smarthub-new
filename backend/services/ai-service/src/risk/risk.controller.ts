import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { RiskService, PaymentRiskInput, ProjectRiskInput } from './risk.service';

@Controller('risk')
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  /**
   * Assess payment risk
   * GET /risk/payments/:id
   */
  @Get('payments/:id')
  async assessPaymentRisk(@Param('id', ParseUUIDPipe) paymentId: string) {
    const riskScore = await this.riskService.assessPaymentRisk(paymentId);

    return {
      success: true,
      data: riskScore,
    };
  }

  /**
   * Calculate payment risk with custom input
   * POST /risk/payments/calculate
   */
  @Post('payments/calculate')
  async calculatePaymentRisk(@Body() input: PaymentRiskInput) {
    const riskScore = await this.riskService.calculatePaymentRisk(input);

    return {
      success: true,
      data: riskScore,
    };
  }

  /**
   * Calculate project risk
   * POST /risk/projects/calculate
   */
  @Post('projects/calculate')
  async calculateProjectRisk(@Body() input: ProjectRiskInput) {
    const riskScore = await this.riskService.calculateProjectRisk(input);

    return {
      success: true,
      data: riskScore,
    };
  }
}
