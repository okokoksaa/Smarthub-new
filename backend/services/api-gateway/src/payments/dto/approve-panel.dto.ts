import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApprovePanelDto {
  @ApiProperty({ description: 'Approval decision', enum: ['approved', 'rejected'] })
  @IsString()
  @IsIn(['approved', 'rejected'])
  decision: string;

  @ApiProperty({ description: 'Approval comments', example: 'Payment approved for milestone completion' })
  @IsString()
  comments: string;
}
