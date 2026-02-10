import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

/**
 * Meeting Types enum
 */
export enum MeetingType {
  REGULAR = 'REGULAR',
  EMERGENCY = 'EMERGENCY',
  SPECIAL = 'SPECIAL',
}

/**
 * Meeting Status enum
 */
export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED',
}

/**
 * WDC Meeting Entity
 */
@Entity('wdc_meetings')
export class WdcMeeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Meeting identification
  @Column({ name: 'meeting_number', unique: true })
  meetingNumber: string;

  // Geographic scope
  @Column({ name: 'ward_id', type: 'uuid' })
  wardId: string;

  @Column({ name: 'constituency_id', type: 'uuid' })
  constituencyId: string;

  @Column({ name: 'district_id', type: 'uuid' })
  districtId: string;

  @Column({ name: 'province_id', type: 'uuid' })
  provinceId: string;

  // Meeting details
  @Column({
    name: 'meeting_type',
    type: 'enum',
    enum: MeetingType,
  })
  meetingType: MeetingType;

  @Column({ name: 'meeting_date', type: 'timestamptz' })
  meetingDate: Date;

  @Column({ length: 200 })
  location: string;

  @Column('text')
  agenda: string;

  // Attendance tracking
  @Column({ name: 'expected_attendees' })
  expectedAttendees: number;

  @Column({ name: 'actual_attendees', default: 0 })
  actualAttendees: number;

  @Column({ name: 'attendees_present', type: 'text', array: true, default: '{}' })
  attendeesPresent: string[];

  // Quorum and status
  @Column({ name: 'quorum_required' })
  quorumRequired: number;

  @Column({ name: 'quorum_met', default: false })
  quorumMet: boolean;

  @Column({
    type: 'enum',
    enum: MeetingStatus,
    default: MeetingStatus.SCHEDULED,
  })
  status: MeetingStatus;

  // Meeting outcomes
  @Column({ name: 'decisions_made', type: 'text', nullable: true })
  decisionsMade?: string;

  @Column({ name: 'actions_assigned', type: 'text', nullable: true })
  actionsAssigned?: string;

  @Column({ name: 'next_meeting_date', type: 'timestamptz', nullable: true })
  nextMeetingDate?: Date;

  // Audit trail
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  @Column({ name: 'completed_by', type: 'uuid', nullable: true })
  completedBy?: string;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  // Note: Minutes relation loaded separately to avoid circular dependency

  // Computed properties
  get hasQuorum(): boolean {
    return this.actualAttendees >= this.quorumRequired;
  }

  get canComplete(): boolean {
    return (
      this.status === MeetingStatus.SCHEDULED ||
      this.status === MeetingStatus.IN_PROGRESS
    ) && this.hasQuorum;
  }
}

