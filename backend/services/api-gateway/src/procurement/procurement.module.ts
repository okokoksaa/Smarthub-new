import { Module } from '@nestjs/common';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';
import { SealedBidsService } from './sealed-bids.service';

@Module({
  controllers: [ProcurementController],
  providers: [ProcurementService, SealedBidsService],
  exports: [ProcurementService, SealedBidsService],
})
export class ProcurementModule {}
