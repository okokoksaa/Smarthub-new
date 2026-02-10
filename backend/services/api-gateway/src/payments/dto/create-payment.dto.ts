import { IsString, IsNumber, IsOptional, IsUUID, Min, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Project ID' })
  @IsUUID()
  project_id: string;

  @ApiPropertyOptional({ description: 'Milestone ID (if milestone payment)' })
  @IsOptional()
  @IsUUID()
  milestone_id?: string;

  @ApiProperty({ description: 'Payment amount in ZMW', example: 150000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Payment type', enum: ['milestone', 'advance', 'final', 'other'] })
  @IsString()
  payment_type: string;

  @ApiProperty({ description: 'Recipient name', example: 'ABC Construction Ltd' })
  @IsString()
  recipient_name: string;

  @ApiProperty({ description: 'Recipient bank account', example: '1234567890' })
  @IsString()
  recipient_account: string;

  @ApiProperty({ description: 'Recipient bank', example: 'Zanaco' })
  @IsString()
  recipient_bank: string;

  @ApiProperty({ description: 'Payment description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Array of document URLs', type: [String] })
  @IsOptional()
  @IsArray()
  supporting_documents?: string[];
}
