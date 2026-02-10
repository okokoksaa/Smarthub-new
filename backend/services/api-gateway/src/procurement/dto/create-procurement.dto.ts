import { IsString, IsNumber, IsOptional, IsUUID, IsDateString, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProcurementMethod {
  OPEN_BIDDING = 'open_bidding',
  RESTRICTED_BIDDING = 'restricted_bidding',
  SINGLE_SOURCE = 'single_source',
  REQUEST_FOR_QUOTATION = 'request_for_quotation',
}

export class CreateProcurementDto {
  @ApiProperty({ description: 'Procurement title', example: 'Construction of Classroom Block' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Detailed description of the procurement' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Constituency ID' })
  @IsUUID()
  constituency_id: string;

  @ApiPropertyOptional({ description: 'Related Project ID' })
  @IsOptional()
  @IsUUID()
  project_id?: string;

  @ApiProperty({
    description: 'Procurement method',
    enum: ProcurementMethod,
    example: ProcurementMethod.OPEN_BIDDING
  })
  @IsEnum(ProcurementMethod)
  procurement_method: ProcurementMethod;

  @ApiProperty({ description: 'Estimated value in ZMW', example: 500000 })
  @IsNumber()
  @Min(1)
  estimated_value: number;

  @ApiPropertyOptional({ description: 'Tender publish date' })
  @IsOptional()
  @IsDateString()
  publish_date?: string;

  @ApiPropertyOptional({ description: 'Bid closing date' })
  @IsOptional()
  @IsDateString()
  closing_date?: string;

  @ApiPropertyOptional({ description: 'Bid opening date (sealed bids opened on this date)' })
  @IsOptional()
  @IsDateString()
  bid_opening_date?: string;

  @ApiPropertyOptional({ description: 'ZPPA reference number' })
  @IsOptional()
  @IsString()
  zppa_reference?: string;
}
