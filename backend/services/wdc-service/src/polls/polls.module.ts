import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { CommunityPoll, PollResponse } from './entities/poll.entity';

/**
 * Polls Module
 * Handles community polling system
 */
@Module({
  imports: [TypeOrmModule.forFeature([CommunityPoll, PollResponse])],
  controllers: [PollsController],
  providers: [PollsService],
  exports: [PollsService],
})
export class PollsModule {}