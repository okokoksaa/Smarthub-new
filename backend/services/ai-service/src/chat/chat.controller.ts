import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';

// Simple auth guard that extracts user from token
// In production, this would use proper JWT validation
class SimpleAuthGuard {
  canActivate() { return true; }
}

// DTOs
class CreateSessionDto {
  title?: string;
  constituency_id?: string;
  context_type?: string;
  context_entity_id?: string;
}

class SendMessageDto {
  content: string;
}

class UpdateContextDto {
  context_type: string;
  context_entity_id?: string;
  context_data?: any;
}

@ApiTags('AI Chat')
@Controller('chat')
@UseGuards(SimpleAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ========== Session Management ==========

  @Post('sessions')
  @ApiOperation({ summary: 'Create new chat session' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  async createSession(
    @Body() dto: CreateSessionDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.chatService.createSession(userId, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List user chat sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getSessions(
    @Headers('x-user-id') userId: string,
    @Query('active_only') activeOnly: boolean = true,
  ) {
    return this.chatService.getSessions(userId, activeOnly);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session with messages' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  async getSession(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.chatService.getSession(id, userId);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete chat session' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  async deleteSession(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.chatService.deleteSession(id, userId);
  }

  // ========== Messaging ==========

  @Post('sessions/:id/messages')
  @ApiOperation({ summary: 'Send message to chat session' })
  @ApiResponse({ status: 200, description: 'Message sent and response received' })
  async sendMessage(
    @Param('id') sessionId: string,
    @Body() dto: SendMessageDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.chatService.sendMessage(sessionId, userId, dto.content);
  }

  @Get('sessions/:id/messages')
  @ApiOperation({ summary: 'Get messages for session' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getMessages(
    @Param('id') sessionId: string,
    @Headers('x-user-id') userId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.chatService.getMessages(sessionId, userId, limit, offset);
  }

  // ========== Context Management ==========

  @Post('sessions/:id/context')
  @ApiOperation({ summary: 'Update session context' })
  @ApiResponse({ status: 200, description: 'Context updated successfully' })
  async updateContext(
    @Param('id') sessionId: string,
    @Body() dto: UpdateContextDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.chatService.updateContext(sessionId, userId, dto);
  }

  // ========== Suggestions ==========

  @Get('suggestions')
  @ApiOperation({ summary: 'Get suggested queries based on context' })
  @ApiResponse({ status: 200, description: 'Suggestions retrieved successfully' })
  async getSuggestions(
    @Query('context_type') contextType?: string,
    @Query('context_entity_id') contextEntityId?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.chatService.getSuggestions(contextType, contextEntityId, userId);
  }
}
