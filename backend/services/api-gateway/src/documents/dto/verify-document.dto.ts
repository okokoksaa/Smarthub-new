import { IsString } from 'class-validator';

export class VerifyDocumentDto {
  @IsString()
  file_hash: string;
}
