import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QueryProcessorService } from './query-processor.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private supabase: SupabaseClient;

  // AI Disclaimer - CRITICAL
  private readonly AI_DISCLAIMER = 'AI analysis is advisory only. All decisions require human review and approval.';

  constructor(
    private configService: ConfigService,
    private queryProcessor: QueryProcessorService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async createSession(userId: string, dto: any) {
    const { data, error } = await this.supabase
      .from('ai_chat_sessions')
      .insert({
        user_id: userId,
        title: dto.title || 'New Chat',
        constituency_id: dto.constituency_id,
        context_type: dto.context_type || 'general',
        context_entity_id: dto.context_entity_id,
        context_data: {},
        is_active: true,
        message_count: 0,
        total_tokens_used: 0,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create session', error);
      throw new Error('Failed to create chat session');
    }

    return data;
  }

  async getSessions(userId: string, activeOnly: boolean = true) {
    let query = this.supabase
      .from('ai_chat_sessions')
      .select('id, title, context_type, is_active, message_count, created_at, last_message_at')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to fetch sessions', error);
      throw new Error('Failed to fetch sessions');
    }

    return data;
  }

  async getSession(sessionId: string, userId: string) {
    const { data: session, error } = await this.supabase
      .from('ai_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      throw new NotFoundException('Session not found');
    }

    if (session.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Get recent messages
    const { data: messages } = await this.supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(50);

    return {
      ...session,
      messages: messages || [],
    };
  }

  async deleteSession(sessionId: string, userId: string) {
    // Verify ownership
    const { data: session } = await this.supabase
      .from('ai_chat_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (!session || session.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Soft delete - mark as inactive
    await this.supabase
      .from('ai_chat_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    return { success: true, message: 'Session deleted' };
  }

  async sendMessage(sessionId: string, userId: string, content: string) {
    this.logger.log(`Processing message in session ${sessionId}`);

    // Verify session ownership
    const { data: session, error: sessionError } = await this.supabase
      .from('ai_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new NotFoundException('Session not found');
    }

    if (session.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Store user message
    await this.supabase.from('ai_chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: content,
      is_advisory: false,
    });

    // Process query and generate response
    const response = await this.generateResponse(content, session);

    // Store assistant response
    const { data: assistantMessage } = await this.supabase
      .from('ai_chat_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: response.content,
        intent_detected: response.intent,
        entities_referenced: response.entities,
        citations: response.citations,
        suggestions: response.suggestions,
        is_advisory: true,
      })
      .select()
      .single();

    // Update session
    await this.supabase
      .from('ai_chat_sessions')
      .update({
        last_message_at: new Date().toISOString(),
        message_count: (session.message_count || 0) + 2,
      })
      .eq('id', sessionId);

    return {
      message: assistantMessage,
      disclaimer: this.AI_DISCLAIMER,
    };
  }

  async getMessages(sessionId: string, userId: string, limit: number, offset: number) {
    // Verify ownership
    const { data: session } = await this.supabase
      .from('ai_chat_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (!session || session.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const { data, error, count } = await this.supabase
      .from('ai_chat_messages')
      .select('*', { count: 'exact' })
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error('Failed to fetch messages');
    }

    return {
      messages: data,
      total: count,
      limit,
      offset,
    };
  }

  async updateContext(sessionId: string, userId: string, dto: any) {
    // Verify ownership
    const { data: session } = await this.supabase
      .from('ai_chat_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (!session || session.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const { data, error } = await this.supabase
      .from('ai_chat_sessions')
      .update({
        context_type: dto.context_type,
        context_entity_id: dto.context_entity_id,
        context_data: dto.context_data || {},
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update context');
    }

    return data;
  }

  async getSuggestions(contextType?: string, contextEntityId?: string, userId?: string) {
    // Default suggestions by context type
    const suggestions: Record<string, string[]> = {
      general: [
        'What is the budget utilization for my constituency?',
        'How many projects are currently active?',
        'Are there any overdue payments?',
        'Show me the project completion rate',
      ],
      project: [
        'What is the current status of this project?',
        'Are there any pending approvals?',
        'What payments have been made?',
        'What are the risk factors?',
      ],
      payment: [
        'What approvals are needed for this payment?',
        'Has Panel A approved yet?',
        'What is the payment history for this project?',
        'Are there any compliance issues?',
      ],
      budget: [
        'How much budget remains for this year?',
        'What is the spending breakdown by sector?',
        'Are any wards over budget?',
        'Show me the disbursement timeline',
      ],
      compliance: [
        'Are there any overdue submissions?',
        'What documents are missing?',
        'Show me audit findings',
        'Are there any flagged transactions?',
      ],
    };

    return {
      context_type: contextType || 'general',
      suggestions: suggestions[contextType || 'general'] || suggestions.general,
    };
  }

  // ========== Private Methods ==========

  private async generateResponse(query: string, session: any) {
    // Process the query to detect intent
    const intent = this.queryProcessor.classifyIntent(query);

    // Fetch relevant data based on intent and context
    const contextData = await this.fetchContextualData(intent, session);

    // Generate response content
    const responseContent = this.queryProcessor.generateResponse(intent, query, contextData);

    // Extract entities mentioned
    const entities = this.extractEntities(contextData);

    // Generate follow-up suggestions
    const suggestions = this.generateSuggestions(intent, contextData);

    return {
      content: responseContent,
      intent,
      entities,
      citations: contextData.sources || [],
      suggestions,
    };
  }

  private async fetchContextualData(intent: string, session: any) {
    const data: any = { sources: [] };

    try {
      // Fetch data based on intent
      switch (intent) {
        case 'project_status':
          if (session.context_entity_id) {
            const { data: project } = await this.supabase
              .from('projects')
              .select('id, name, status, progress, budget, spent')
              .eq('id', session.context_entity_id)
              .single();
            data.project = project;
            data.sources.push({ type: 'project', id: project?.id, name: project?.name });
          }
          break;

        case 'budget_query':
          if (session.constituency_id) {
            const { data: budget } = await this.supabase
              .from('budgets')
              .select('*')
              .eq('constituency_id', session.constituency_id)
              .eq('fiscal_year', new Date().getFullYear())
              .single();
            data.budget = budget;
            data.sources.push({ type: 'budget', year: new Date().getFullYear() });
          }
          break;

        case 'payment_history':
          if (session.context_entity_id) {
            const { data: payments } = await this.supabase
              .from('payments')
              .select('id, amount, status, created_at')
              .eq('project_id', session.context_entity_id)
              .order('created_at', { ascending: false })
              .limit(10);
            data.payments = payments;
            data.sources.push({ type: 'payments', count: payments?.length });
          }
          break;

        case 'compliance_check':
          // Fetch overdue items, missing documents, etc.
          data.compliance = { status: 'ok', issues: [] };
          break;

        default:
          // General query - fetch summary data
          if (session.constituency_id) {
            const { count: projectCount } = await this.supabase
              .from('projects')
              .select('*', { count: 'exact', head: true })
              .eq('constituency_id', session.constituency_id);
            data.summary = { project_count: projectCount };
          }
      }
    } catch (error) {
      this.logger.error('Error fetching contextual data', error);
    }

    return data;
  }

  private extractEntities(contextData: any): any[] {
    const entities: any[] = [];

    if (contextData.project) {
      entities.push({
        type: 'project',
        id: contextData.project.id,
        name: contextData.project.name,
      });
    }

    if (contextData.payments?.length) {
      entities.push({
        type: 'payments',
        count: contextData.payments.length,
      });
    }

    return entities;
  }

  private generateSuggestions(intent: string, contextData: any): string[] {
    const suggestions: string[] = [];

    switch (intent) {
      case 'project_status':
        suggestions.push('What payments have been made?');
        suggestions.push('Show me the project timeline');
        suggestions.push('Are there any risk flags?');
        break;
      case 'budget_query':
        suggestions.push('Show me spending by sector');
        suggestions.push('Which wards have remaining budget?');
        suggestions.push('What is the disbursement rate?');
        break;
      default:
        suggestions.push('Tell me about active projects');
        suggestions.push('Show me recent payments');
    }

    return suggestions;
  }
}
