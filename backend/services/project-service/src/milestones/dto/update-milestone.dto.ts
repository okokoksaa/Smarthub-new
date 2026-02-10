import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMilestoneDto } from './create-milestone.dto';

/**
 * Update Milestone DTO
 */
export class UpdateMilestoneDto extends PartialType(
  OmitType(CreateMilestoneDto, ['projectId'] as const),
) {}
