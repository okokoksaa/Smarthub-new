import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_MONEY = 'mobile_money',
  CHEQUE = 'cheque',
}

export class DisburseEmpowermentDto {
  @ApiProperty({ description: 'Payment reference number' })
  @IsString()
  payment_reference: string;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiPropertyOptional({ description: 'Bank account number (for bank transfers)' })
  @IsString()
  @IsOptional()
  bank_account?: string;

  @ApiPropertyOptional({ description: 'Mobile money number (for mobile money)' })
  @IsString()
  @IsOptional()
  mobile_number?: string;

  @ApiPropertyOptional({ description: 'Payment notes' })
  @IsString()
  @IsOptional()
  payment_notes?: string;
}
