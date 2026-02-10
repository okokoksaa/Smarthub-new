import { IsString, IsUUID, IsNumber, IsBoolean, IsOptional, IsArray, IsEnum, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CommitteeType {
  CDFC = 'cdfc',
  TAC = 'tac',
  WDC = 'wdc',
  PROCUREMENT = 'procurement',
}

export class CreateCommitteeDto {
  @ApiProperty({ description: 'Committee name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: CommitteeType, description: 'Type of committee' })
  @IsEnum(CommitteeType)
  committee_type: CommitteeType;

  @ApiPropertyOptional({ description: 'Constituency ID (for CDFC/WDC)' })
  @IsUUID()
  @IsOptional()
  constituency_id?: string;

  @ApiPropertyOptional({ description: 'Province ID (for TAC)' })
  @IsUUID()
  @IsOptional()
  province_id?: string;

  @ApiPropertyOptional({ description: 'Chair user ID' })
  @IsUUID()
  @IsOptional()
  chair_id?: string;

  @ApiPropertyOptional({ description: 'Secretary user ID' })
  @IsUUID()
  @IsOptional()
  secretary_id?: string;

  @ApiProperty({ description: 'Quorum required for valid decisions', default: 6 })
  @IsNumber()
  @Min(1)
  quorum_required: number;
}

export class AddMemberDto {
  @ApiProperty({ description: 'User ID to add' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'Member role in committee', default: 'member' })
  @IsString()
  role: string;
}

export class CreateMeetingDto {
  @ApiProperty({ description: 'Committee ID' })
  @IsUUID()
  committee_id: string;

  @ApiProperty({ description: 'Meeting title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Meeting description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Meeting date (YYYY-MM-DD)' })
  @IsDateString()
  meeting_date: string;

  @ApiPropertyOptional({ description: 'Start time (HH:MM)' })
  @IsString()
  @IsOptional()
  start_time?: string;

  @ApiPropertyOptional({ description: 'End time (HH:MM)' })
  @IsString()
  @IsOptional()
  end_time?: string;

  @ApiPropertyOptional({ description: 'Venue' })
  @IsString()
  @IsOptional()
  venue?: string;

  @ApiPropertyOptional({ description: 'Agenda items' })
  @IsArray()
  @IsOptional()
  agenda?: { item: string; presenter?: string }[];
}

export class RecordAttendanceDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'Did the user attend?' })
  @IsBoolean()
  attended: boolean;

  @ApiPropertyOptional({ description: 'Attendance time' })
  @IsString()
  @IsOptional()
  attendance_time?: string;

  @ApiPropertyOptional({ description: 'Digital signature' })
  @IsString()
  @IsOptional()
  signature?: string;
}

export class ConflictOfInterestDto {
  @ApiProperty({ description: 'User ID declaring conflict' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'Agenda item with conflict' })
  @IsString()
  agenda_item: string;

  @ApiProperty({ description: 'Nature of the conflict' })
  @IsString()
  conflict_description: string;

  @ApiProperty({ description: 'Will recuse from voting on this item' })
  @IsBoolean()
  will_recuse: boolean;
}

export class RecordVoteDto {
  @ApiProperty({ description: 'Agenda item being voted on' })
  @IsString()
  agenda_item: string;

  @ApiProperty({ description: 'Project or entity ID being voted on' })
  @IsUUID()
  @IsOptional()
  entity_id?: string;

  @ApiProperty({ description: 'User ID of voter' })
  @IsUUID()
  voter_id: string;

  @ApiProperty({ description: 'Vote decision' })
  @IsEnum(['approve', 'reject', 'abstain'])
  vote: 'approve' | 'reject' | 'abstain';

  @ApiPropertyOptional({ description: 'Vote comments' })
  @IsString()
  @IsOptional()
  comments?: string;
}

export class UploadMinutesDto {
  @ApiProperty({ description: 'Minutes text content' })
  @IsString()
  minutes: string;

  @ApiPropertyOptional({ description: 'Attached document URL' })
  @IsString()
  @IsOptional()
  document_url?: string;
}

export class ApproveMinutesDto {
  @ApiPropertyOptional({ description: 'Approval comments' })
  @IsString()
  @IsOptional()
  comments?: string;
}
