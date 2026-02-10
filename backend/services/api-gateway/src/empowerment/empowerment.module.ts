import { Module } from '@nestjs/common';
import { EmpowermentService } from './empowerment.service';
import { EmpowermentController } from './empowerment.controller';

@Module({
  controllers: [EmpowermentController],
  providers: [EmpowermentService],
})
export class EmpowermentModule {}
