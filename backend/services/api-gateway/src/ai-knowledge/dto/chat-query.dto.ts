import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChatQueryDto {
  @ApiProperty({
    description: 'User question about CDF policy documents',
    example: 'What is the quorum for a CDFC meeting?',
    minLength: 3,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  query!: string;
}
