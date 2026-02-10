import { Module } from '@nestjs/common';
import { BursariesController } from './bursaries.controller';
import { BursariesService } from './bursaries.service';
import { TermsService } from './terms.service';
import { EligibilityService } from './eligibility.service';

@Module({
  controllers: [BursariesController],
  providers: [BursariesService, TermsService, EligibilityService],
  exports: [BursariesService, TermsService, EligibilityService],
})
export class BursariesModule {}
