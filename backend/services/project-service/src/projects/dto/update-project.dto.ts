import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

/**
 * Update Project DTO
 * All fields from CreateProjectDto are optional
 */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
