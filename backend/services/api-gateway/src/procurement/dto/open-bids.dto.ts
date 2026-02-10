import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenBidsDto {
  @ApiPropertyOptional({ description: 'Witnesses present at bid opening' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  witnesses?: string[];

  @ApiPropertyOptional({ description: 'Opening ceremony notes' })
  @IsOptional()
  @IsString()
  opening_notes?: string;

  @ApiPropertyOptional({ description: 'Meeting ID for bid opening ceremony' })
  @IsOptional()
  @IsUUID()
  meeting_id?: string;
}
