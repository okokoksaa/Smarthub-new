import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:3002/api/v1';

export interface ChatSession {
  id: string;
  title: string;
  context_type: string;
  context_entity_id?: string;
  context_data?: any;
  is_active: boolean;
  message_count: number;
  created_at: string;
  last_message_at?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent_detected?: string;
  entities_referenced?: any[];
  citations?: any[];
  suggestions?: string[];
  is_advisory: boolean;
  created_at: string;
}

export interface CreateSessionDto {
  title?: string;
  constituency_id?: string;
  context_type?: 'general' | 'project' | 'payment' | 'budget' | 'compliance';
  context_entity_id?: string;
}

export interface UpdateContextDto {
  context_type: string;
  context_entity_id?: string;
  context_data?: any;
}

export interface ChatSuggestion {
  context_type: string;
  suggestions: string[];
}

// Use AI service directly for chat operations
const aiApi = {
  get: async (url: string) => {
    const response = await fetch(`${AI_SERVICE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '',
      },
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  },
  post: async (url: string, data?: any) => {
    const response = await fetch(`${AI_SERVICE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  },
  delete: async (url: string) => {
    const response = await fetch(`${AI_SERVICE_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '',
      },
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  },
};

export function useChatSessions(activeOnly: boolean = true) {
  return useQuery({
    queryKey: ['chat-sessions', activeOnly],
    queryFn: async () => {
      const data = await aiApi.get(`/chat/sessions?active_only=${activeOnly}`);
      return data as ChatSession[];
    },
  });
}

export function useChatSession(sessionId: string) {
  return useQuery({
    queryKey: ['chat-session', sessionId],
    queryFn: async () => {
      const data = await aiApi.get(`/chat/sessions/${sessionId}`);
      return data as ChatSession & { messages: ChatMessage[] };
    },
    enabled: !!sessionId,
  });
}

export function useChatMessages(sessionId: string, limit: number = 50, offset: number = 0) {
  return useQuery({
    queryKey: ['chat-messages', sessionId, limit, offset],
    queryFn: async () => {
      const data = await aiApi.get(`/chat/sessions/${sessionId}/messages?limit=${limit}&offset=${offset}`);
      return data as {
        messages: ChatMessage[];
        total: number;
        limit: number;
        offset: number;
      };
    },
    enabled: !!sessionId,
  });
}

export function useChatSuggestions(contextType?: string, contextEntityId?: string) {
  return useQuery({
    queryKey: ['chat-suggestions', contextType, contextEntityId],
    queryFn: async () => {
      let url = '/chat/suggestions';
      const params = new URLSearchParams();
      if (contextType) params.append('context_type', contextType);
      if (contextEntityId) params.append('context_entity_id', contextEntityId);
      if (params.toString()) url += `?${params.toString()}`;

      const data = await aiApi.get(url);
      return data as ChatSuggestion;
    },
  });
}

export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateSessionDto) => {
      const data = await aiApi.post('/chat/sessions', dto);
      return data as ChatSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onError: (error: any) => {
      toast.error('Failed to create chat session');
    },
  });
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await aiApi.delete(`/chat/sessions/${sessionId}`);
      return sessionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      toast.success('Chat session deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete chat session');
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, content }: { sessionId: string; content: string }) => {
      const data = await aiApi.post(`/chat/sessions/${sessionId}/messages`, { content });
      return data as {
        message: ChatMessage;
        disclaimer: string;
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-session', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onError: (error: any) => {
      toast.error('Failed to send message');
    },
  });
}

export function useUpdateChatContext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: UpdateContextDto }) => {
      const result = await aiApi.post(`/chat/sessions/${sessionId}/context`, data);
      return result as ChatSession;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-session', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-suggestions'] });
      toast.success('Context updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update context');
    },
  });
}
