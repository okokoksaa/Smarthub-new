import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { QueryProcessorService } from './query-processor.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, QueryProcessorService],
  exports: [ChatService],
})
export class ChatModule {}
