import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Approve Payment DTO (Panel A or Panel B)
 */
export class ApprovePaymentDto {
  @ApiProperty({
    description: 'Approval decision',
    example: true,
  })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({
    description: 'Approval notes or rejection reason',
    example: 'Payment verified against project milestones',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Execute Payment DTO
 */
export class ExecutePaymentDto {
  @ApiProperty({
    description: 'Payment reference/transaction ID',
    example: 'TXN-2024-001234',
  })
  @IsString()
  paymentReference: string;

  @ApiPropertyOptional({
    description: 'Payment receipt URL',
    example: 'https://storage.example.com/receipts/receipt123.pdf',
  })
  @IsOptional()
  @IsString()
  paymentReceiptUrl?: string;
}
