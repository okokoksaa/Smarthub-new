import { IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisbursePaymentDto {
  @ApiProperty({ description: 'Bank transaction reference', example: 'TXN123456789' })
  @IsString()
  transaction_reference: string;

  @ApiProperty({ description: 'Disbursement date', example: '2026-01-20' })
  @IsDateString()
  disbursement_date: string;
}
