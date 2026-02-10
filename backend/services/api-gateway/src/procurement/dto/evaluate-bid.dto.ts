import { IsString, IsNumber, IsOptional, IsUUID, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EvaluationRecommendation {
  AWARD = 'award',
  REJECT = 'reject',
  CONDITIONAL = 'conditional',
}

export class EvaluateBidDto {
  @ApiProperty({ description: 'Bid ID to evaluate' })
  @IsUUID()
  bid_id: string;

  @ApiProperty({ description: 'Technical score (0-100)', example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  technical_score: number;

  @ApiProperty({ description: 'Financial score (0-100)', example: 90 })
  @IsNumber()
  @Min(0)
  @Max(100)
  financial_score: number;

  @ApiPropertyOptional({ description: 'Experience score (0-100)', example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  experience_score?: number;

  @ApiPropertyOptional({ description: 'Compliance score (0-100)', example: 95 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  compliance_score?: number;

  @ApiPropertyOptional({ description: 'Technical evaluation comments' })
  @IsOptional()
  @IsString()
  technical_comments?: string;

  @ApiPropertyOptional({ description: 'Financial evaluation comments' })
  @IsOptional()
  @IsString()
  financial_comments?: string;

  @ApiProperty({
    description: 'Recommendation',
    enum: EvaluationRecommendation,
    example: EvaluationRecommendation.AWARD
  })
  @IsEnum(EvaluationRecommendation)
  recommendation: EvaluationRecommendation;

  @ApiPropertyOptional({ description: 'Reason for recommendation' })
  @IsOptional()
  @IsString()
  recommendation_reason?: string;
}
