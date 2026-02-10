import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
} from '@shared/database';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Notification type(s) - can send multiple types at once',
    enum: NotificationType,
    example: NotificationType.EMAIL,
    oneOf: [
      { type: 'string', enum: Object.values(NotificationType) },
      { type: 'array', items: { enum: Object.values(NotificationType) } },
    ],
  })
  @IsEnum(NotificationType, { each: true })
  type: NotificationType | NotificationType[];

  @ApiProperty({
    description: 'Notification category',
    enum: NotificationCategory,
    example: NotificationCategory.PROJECT_APPROVED,
  })
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @ApiProperty({
    description: 'Notification priority',
    enum: NotificationPriority,
    example: NotificationPriority.NORMAL,
    required: false,
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiProperty({
    description: 'Recipient user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  recipientId: string;

  @ApiProperty({
    description: 'Recipient email (required for email notifications)',
    example: 'user@example.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  recipientEmail?: string;

  @ApiProperty({
    description: 'Recipient phone (required for SMS notifications)',
    example: '+260977123456',
    required: false,
  })
  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @ApiProperty({
    description: 'Device token (required for push notifications)',
    example: 'firebase-device-token',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceToken?: string;

  @ApiProperty({
    description: 'Notification subject/title',
    example: 'Project Approved',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Notification body',
    example: 'Your project has been approved by the committee.',
  })
  @IsString()
  body: string;

  @ApiProperty({
    description: 'HTML body (for email)',
    example: '<p>Your project has been <strong>approved</strong>.</p>',
    required: false,
  })
  @IsString()
  @IsOptional()
  htmlBody?: string;

  @ApiProperty({
    description: 'Additional data',
    example: { projectId: 'uuid', action: 'approved' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @ApiProperty({
    description: 'Template name to use',
    example: 'project-approved',
    required: false,
  })
  @IsString()
  @IsOptional()
  templateName?: string;

  @ApiProperty({
    description: 'Template data for rendering',
    example: { projectName: 'Health Clinic', approverName: 'John Doe' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  templateData?: Record<string, any>;

  @ApiProperty({
    description: 'Related project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiProperty({
    description: 'Related payment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  paymentId?: string;

  @ApiProperty({
    description: 'Related document ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  documentId?: string;

  @ApiProperty({
    description: 'Schedule notification for future sending',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  scheduledFor?: Date;

  @ApiProperty({
    description: 'Notification expiration time',
    example: '2025-01-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: Date;
}
