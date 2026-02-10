import { IsString, IsNumber, IsOptional, IsUUID, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AwardContractDto {
  @ApiProperty({ description: 'Winning bid ID' })
  @IsUUID()
  winning_bid_id: string;

  @ApiProperty({ description: 'Final contract value in ZMW', example: 480000 })
  @IsNumber()
  @Min(1)
  contract_value: number;

  @ApiPropertyOptional({ description: 'Award date' })
  @IsOptional()
  @IsDateString()
  award_date?: string;

  @ApiPropertyOptional({ description: 'Award justification/reason' })
  @IsOptional()
  @IsString()
  award_justification?: string;

  @ApiPropertyOptional({ description: 'Contract start date' })
  @IsOptional()
  @IsDateString()
  contract_start_date?: string;

  @ApiPropertyOptional({ description: 'Contract end date' })
  @IsOptional()
  @IsDateString()
  contract_end_date?: string;

  @ApiPropertyOptional({ description: 'Additional contract terms' })
  @IsOptional()
  @IsString()
  contract_terms?: string;
}
