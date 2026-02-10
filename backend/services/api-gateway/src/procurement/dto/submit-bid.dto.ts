import { IsString, IsNumber, IsOptional, IsUUID, Min, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitBidDto {
  @ApiProperty({ description: 'Bid amount in ZMW', example: 450000 })
  @IsNumber()
  @Min(1)
  bid_amount: number;

  @ApiProperty({ description: 'SHA-256 hash of the bid document' })
  @IsString()
  bid_document_hash: string;

  @ApiPropertyOptional({ description: 'Bid document ID (from documents table)' })
  @IsOptional()
  @IsUUID()
  bid_document_id?: string;

  @ApiPropertyOptional({ description: 'Technical proposal summary' })
  @IsOptional()
  @IsString()
  technical_proposal_summary?: string;

  @ApiPropertyOptional({ description: 'Delivery timeline in days', example: 90 })
  @IsOptional()
  @IsInt()
  @Min(1)
  delivery_timeline_days?: number;

  @ApiPropertyOptional({ description: 'Warranty period in months', example: 12 })
  @IsOptional()
  @IsInt()
  @Min(0)
  warranty_period_months?: number;
}
