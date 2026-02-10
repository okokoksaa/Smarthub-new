import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveDocumentDto {
  @ApiProperty({
    description: 'Whether the document is approved or rejected',
    example: true,
  })
  @IsBoolean()
  approved: boolean;

  @ApiProperty({
    description: 'Approval or rejection notes',
    example: 'Document verified and approved for official use',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
