import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateBudgetDto } from './create-budget.dto';

/**
 * Update Budget Allocation DTO
 */
export class UpdateBudgetDto extends PartialType(
  OmitType(CreateBudgetDto, ['constituencyId', 'fiscalYear'] as const),
) {}
