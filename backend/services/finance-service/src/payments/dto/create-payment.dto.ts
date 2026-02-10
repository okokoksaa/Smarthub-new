import {
  IsString,
  IsEnum,
  IsUUID,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  Max,
  MaxLength,
  IsInt,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentType, PaymentMethod } from '@shared/database';

/**
 * Supporting Document DTO
 */
export class SupportingDocumentDto {
  @ApiProperty({ description: 'Document URL', example: 'https://storage.example.com/invoice123.pdf' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Document type', example: 'invoice' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Document name', example: 'Invoice #123' })
  @IsString()
  name: string;
}

/**
 * Create Payment Voucher DTO
 */
export class CreatePaymentDto {
  @ApiProperty({
    description: 'Payment type',
    enum: PaymentType,
    example: PaymentType.CONTRACTOR_PAYMENT,
  })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({
    description: 'Fiscal year',
    example: 2024,
  })
  @IsInt()
  @Min(2020)
  @Max(2100)
  fiscalYear: number;

  @ApiProperty({
    description: 'Project UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  projectId: string;

  @ApiProperty({
    description: 'Budget allocation UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  budgetAllocationId: string;

  @ApiProperty({
    description: 'Payee name',
    example: 'ABC Construction Ltd',
  })
  @IsString()
  @MaxLength(255)
  payeeName: string;

  @ApiPropertyOptional({
    description: 'Payee user UUID (if registered user)',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  payeeId?: string;

  @ApiProperty({
    description: 'Payee account number',
    example: '1234567890',
  })
  @IsString()
  @MaxLength(100)
  payeeAccountNumber: string;

  @ApiPropertyOptional({
    description: 'Payee bank name',
    example: 'Zanaco',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  payeeBankName?: string;

  @ApiPropertyOptional({
    description: 'Payee bank branch',
    example: 'Lusaka Main Branch',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  payeeBankBranch?: string;

  @ApiPropertyOptional({
    description: 'Payee phone number (for mobile money)',
    example: '+260977123456',
  })
  @IsOptional()
  @IsString()
  payeePhoneNumber?: string;

  @ApiProperty({
    description: 'Payment amount in ZMW',
    example: 50000,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({
    description: 'Retention percentage (0-100)',
    example: 10,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  retentionPercentage?: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Payment description',
    example: 'Payment for Phase 1 construction work',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Invoice number',
    example: 'INV-2024-001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Invoice date',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @ApiPropertyOptional({
    description: 'Supporting documents',
    type: [SupportingDocumentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupportingDocumentDto)
  supportingDocuments?: SupportingDocumentDto[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: {
      workCompletionPercentage: 50,
      milestoneReference: 'MS-001',
      contractReference: 'CONTRACT-2024-001',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    workCompletionPercentage?: number;
    milestoneReference?: string;
    contractReference?: string;
    previousPayments?: string[];
  };
}
