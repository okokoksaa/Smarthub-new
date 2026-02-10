import {
  Controller,
  Get,
  Put,
  Param,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ComplianceService, ComplianceRule } from './compliance.service';

@ApiTags('compliance')
@ApiBearerAuth()
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('assessment')
  @ApiOperation({ summary: 'Run comprehensive compliance assessment' })
  @ApiResponse({
    status: 200,
    description: 'Compliance assessment completed successfully',
    schema: {
      type: 'object',
      properties: {
        score: { type: 'object' },
        violations: { type: 'array' },
        summary: { type: 'object' },
      },
    },
  })
  async runAssessment(): Promise<any> {
    return this.complianceService.runComplianceAssessment();
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get all compliance rules' })
  @ApiResponse({
    status: 200,
    description: 'Compliance rules retrieved successfully',
    type: [Object],
  })
  async getComplianceRules(): Promise<ComplianceRule[]> {
    return this.complianceService.getComplianceRules();
  }

  @Put('rules/:ruleId')
  @ApiOperation({ summary: 'Update compliance rule' })
  @ApiResponse({
    status: 200,
    description: 'Compliance rule updated successfully',
    type: Object,
  })
  async updateRule(
    @Param('ruleId') ruleId: string,
    @Body() updates: Partial<ComplianceRule>,
  ): Promise<ComplianceRule> {
    return this.complianceService.updateComplianceRule(ruleId, updates);
  }

  @Get('rules/:ruleId/check')
  @ApiOperation({ summary: 'Check specific compliance rule' })
  @ApiResponse({
    status: 200,
    description: 'Compliance rule check completed',
    type: [Object],
  })
  async checkRule(@Param('ruleId') ruleId: string): Promise<any> {
    const rules = await this.complianceService.getComplianceRules();
    const rule = rules.find(r => r.id === ruleId);
    
    if (!rule) {
      throw new Error(`Compliance rule ${ruleId} not found`);
    }

    const violations = await this.complianceService.checkComplianceRule(rule);
    
    return {
      rule,
      violations,
      violationCount: violations.length,
      status: violations.length === 0 ? 'compliant' : 'non-compliant',
    };
  }
}