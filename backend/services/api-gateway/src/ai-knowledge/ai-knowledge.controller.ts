import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiKnowledgeService } from './ai-knowledge.service';
import { ChatQueryDto } from './dto/chat-query.dto';

@ApiTags('AI Knowledge Center')
@Controller('ai-knowledge')
@ApiBearerAuth()
export class AiKnowledgeController {
  constructor(private readonly aiKnowledgeService: AiKnowledgeService) {}

  @Post('chat')
  @ApiOperation({
    summary: 'Ask a CDF policy question and get a citation-backed response',
  })
  async chat(@Body() dto: ChatQueryDto) {
    const result = await this.aiKnowledgeService.askKnowledge(dto.query);

    return {
      success: true,
      data: result,
    };
  }

  @Get('sources')
  @ApiOperation({ summary: 'List active CDF Act / Guidelines / Circular sources' })
  async sources() {
    const sources = await this.aiKnowledgeService.listSources();
    return {
      success: true,
      data: sources,
      total: sources.length,
    };
  }
}
