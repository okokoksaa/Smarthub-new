import { Module } from '@nestjs/common';
import { BursaryService } from './bursary.service';
import { BursaryController } from './bursary.controller';

@Module({
  controllers: [BursaryController],
  providers: [BursaryService],
})
export class BursaryModule {}
