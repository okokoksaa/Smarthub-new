import { Module } from '@nestjs/common';
import { AiKnowledgeController } from './ai-knowledge.controller';
import { AiKnowledgeService } from './ai-knowledge.service';

@Module({
  controllers: [AiKnowledgeController],
  providers: [AiKnowledgeService],
  exports: [AiKnowledgeService],
})
export class AiKnowledgeModule {}
