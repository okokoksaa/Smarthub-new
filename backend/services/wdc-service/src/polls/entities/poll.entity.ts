import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Community Poll Status Enum
 */
export enum PollStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

/**
 * Poll Type Enum
 */
export enum PollType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  YES_NO = 'YES_NO',
  RANKING = 'RANKING',
  OPEN_TEXT = 'OPEN_TEXT',
}

/**
 * Community Poll Entity
 * Represents a ward-scoped community poll for gathering feedback
 */
@Entity('community_polls')
@Index(['wardId', 'status'])
@Index(['startDate', 'endDate'])
export class CommunityPoll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: PollType, default: PollType.MULTIPLE_CHOICE })
  type: PollType;

  @Column({ type: 'enum', enum: PollStatus, default: PollStatus.DRAFT })
  status: PollStatus;

  // Geographic hierarchy
  @Column({ name: 'ward_id', type: 'varchar', length: 100 })
  wardId: string;

  @Column({ name: 'constituency_id', type: 'varchar', length: 100 })
  constituencyId: string;

  @Column({ name: 'district_id', type: 'varchar', length: 100 })
  districtId: string;

  @Column({ name: 'province_id', type: 'varchar', length: 100 })
  provinceId: string;

  // Poll configuration
  @Column({ type: 'json', nullable: true })
  options: string[] | null;

  @Column({ name: 'allow_multiple_responses', type: 'boolean', default: false })
  allowMultipleResponses: boolean;

  @Column({ name: 'require_authentication', type: 'boolean', default: true })
  requireAuthentication: boolean;

  @Column({ name: 'anonymous_responses', type: 'boolean', default: false })
  anonymousResponses: boolean;

  // Timing
  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  // Participation tracking
  @Column({ name: 'max_responses_per_user', type: 'int', default: 1 })
  maxResponsesPerUser: number;

  @Column({ name: 'total_responses', type: 'int', default: 0 })
  totalResponses: number;

  @Column({ name: 'unique_participants', type: 'int', default: 0 })
  uniqueParticipants: number;

  // Results
  @Column({ type: 'json', nullable: true })
  results: Record<string, any> | null;

  @Column({ name: 'results_visible', type: 'boolean', default: false })
  resultsVisible: boolean;

  // Metadata
  @Column({ name: 'created_by', type: 'varchar', length: 100 })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updatedBy?: string;

  @Column({ name: 'published_by', type: 'varchar', length: 100, nullable: true })
  publishedBy?: string;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @Column({ name: 'closed_by', type: 'varchar', length: 100, nullable: true })
  closedBy?: string;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt?: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed properties
  get isOpen(): boolean {
    const now = new Date();
    return (
      this.status === PollStatus.ACTIVE &&
      this.startDate <= now &&
      this.endDate > now
    );
  }

  get isPending(): boolean {
    const now = new Date();
    return this.status === PollStatus.ACTIVE && this.startDate > now;
  }

  get isExpired(): boolean {
    const now = new Date();
    return this.status === PollStatus.ACTIVE && this.endDate <= now;
  }

  get participationRate(): number {
    // This would need actual ward population data to calculate properly
    // For now, return a placeholder
    return this.uniqueParticipants;
  }

  get durationDays(): number {
    const diffTime = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

/**
 * Poll Response Entity
 * Individual responses to community polls
 */
@Entity('community_poll_responses')
@Index(['pollId', 'userId'])
@Index(['pollId', 'createdAt'])
export class PollResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'poll_id', type: 'varchar', length: 100 })
  pollId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 100, nullable: true })
  userId?: string; // Null for anonymous responses

  @Column({ name: 'session_id', type: 'varchar', length: 100, nullable: true })
  sessionId?: string; // For tracking anonymous users

  // Response data
  @Column({ type: 'json' })
  response: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  comments?: string;

  // Metadata
  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'response_time_seconds', type: 'int', nullable: true })
  responseTimeSeconds?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}