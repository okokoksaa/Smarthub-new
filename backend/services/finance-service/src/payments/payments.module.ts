import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentVoucher, BudgetAllocation, Project } from '@shared/database';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentVoucher, BudgetAllocation, Project]),
    BudgetModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
