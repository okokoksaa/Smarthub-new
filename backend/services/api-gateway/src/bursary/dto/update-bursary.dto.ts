import { PartialType } from '@nestjs/swagger';
import { CreateBursaryDto } from './create-bursary.dto';

export class UpdateBursaryDto extends PartialType(CreateBursaryDto) {}
