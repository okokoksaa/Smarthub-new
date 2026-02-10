import { IsString, IsOptional, IsUUID, IsEnum, IsNumber, IsObject } from 'class-validator';

export enum DocumentType {
  APPLICATION = 'application',
  INVOICE = 'invoice',
  MEETING_MINUTES = 'meeting_minutes',
  APPROVAL_LETTER = 'approval_letter',
  SITE_PHOTO = 'site_photo',
  WDC_SIGNOFF = 'wdc_signoff',
  PROCUREMENT_BID = 'procurement_bid',
  CONTRACT = 'contract',
  COMPLETION_CERTIFICATE = 'completion_certificate',
  OTHER = 'other',
}

export class CreateDocumentDto {
  @IsOptional()
  @IsUUID()
  project_id?: string;

  @IsString()
  file_url: string;

  @IsString()
  file_name: string;

  @IsOptional()
  @IsNumber()
  file_size?: number;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsString()
  file_hash: string;

  @IsEnum(DocumentType)
  document_type: DocumentType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  constituency_id: string;

  @IsOptional()
  @IsUUID()
  ward_id?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
