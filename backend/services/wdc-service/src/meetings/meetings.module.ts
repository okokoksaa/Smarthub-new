import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { WdcMeeting } from './entities/meeting.entity';

/**
 * Meetings Module
 * Handles WDC meeting management
 */
@Module({
  imports: [TypeOrmModule.forFeature([WdcMeeting])],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsService],
})
export class MeetingsModule {}