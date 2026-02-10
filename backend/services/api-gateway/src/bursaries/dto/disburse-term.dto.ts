import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
  INSTITUTION_DIRECT = 'institution_direct',
}

export class DisburseTermDto {
  @ApiProperty({ description: 'Transaction reference from bank/payment provider' })
  @IsString()
  transaction_reference: string;

  @ApiProperty({ description: 'Payment method used', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiPropertyOptional({ description: 'Disbursement date (defaults to now)' })
  @IsOptional()
  @IsDateString()
  disbursement_date?: string;

  @ApiPropertyOptional({ description: 'Institution account name (if paying institution directly)' })
  @IsOptional()
  @IsString()
  institution_account_name?: string;

  @ApiPropertyOptional({ description: 'Institution account number' })
  @IsOptional()
  @IsString()
  institution_account_number?: string;

  @ApiPropertyOptional({ description: 'Institution bank name' })
  @IsOptional()
  @IsString()
  institution_bank_name?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
