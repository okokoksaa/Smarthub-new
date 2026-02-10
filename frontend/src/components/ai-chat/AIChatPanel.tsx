import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Bot,
  Plus,
  History,
  Settings,
  Trash2,
  AlertTriangle,
  MoreVertical,
} from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatSuggestions } from './ChatSuggestions';
import { ChatContextBadge } from './ChatContextBadge';
import {
  useChatSession,
  useChatSessions,
  useChatSuggestions,
  useCreateChatSession,
  useDeleteChatSession,
  useSendMessage,
  useUpdateChatContext,
  type ChatMessage as ChatMessageType,
} from '@/hooks/useAIChat';

interface AIChatPanelProps {
  initialSessionId?: string;
  constituencyId?: string;
  contextType?: string;
  contextEntityId?: string;
  contextEntityName?: string;
}

export function AIChatPanel({
  initialSessionId,
  constituencyId,
  contextType = 'general',
  contextEntityId,
  contextEntityName,
}: AIChatPanelProps) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialSessionId || null);
  const [showHistory, setShowHistory] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const { data: sessionData, isLoading: sessionLoading } = useChatSession(activeSessionId || '');
  const { data: suggestionsData } = useChatSuggestions(
    sessionData?.context_type || contextType,
    sessionData?.context_entity_id || contextEntityId
  );

  // Mutations
  const createSession = useCreateChatSession();
  const deleteSession = useDeleteChatSession();
  const sendMessage = useSendMessage();
  const updateContext = useUpdateChatContext();

  const messages = sessionData?.messages || [];
  const suggestions = suggestionsData?.suggestions || [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Create new session if none exists
  const handleNewSession = async () => {
    const newSession = await createSession.mutateAsync({
      title: contextEntityName ? `Chat about ${contextEntityName}` : 'New Chat',
      constituency_id: constituencyId,
      context_type: contextType as any,
      context_entity_id: contextEntityId,
    });
    setActiveSessionId(newSession.id);
    setShowHistory(false);
  };

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!activeSessionId) {
      // Create session first if none exists
      const newSession = await createSession.mutateAsync({
        constituency_id: constituencyId,
        context_type: contextType as any,
        context_entity_id: contextEntityId,
      });
      setActiveSessionId(newSession.id);
      // Then send message
      await sendMessage.mutateAsync({
        sessionId: newSession.id,
        content,
      });
    } else {
      await sendMessage.mutateAsync({
        sessionId: activeSessionId,
        content,
      });
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Handle context change
  const handleContextChange = async (newContextType: string) => {
    if (activeSessionId) {
      await updateContext.mutateAsync({
        sessionId: activeSessionId,
        data: {
          context_type: newContextType,
          context_entity_id: contextEntityId,
        },
      });
    }
  };

  // Handle session deletion
  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession.mutateAsync(sessionId);
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
    setDeleteConfirmId(null);
  };

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Assistant</CardTitle>
          {sessionData && (
            <ChatContextBadge
              contextType={sessionData.context_type}
              entityName={contextEntityName}
            />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewSession}
            title="New Chat"
            disabled={createSession.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            title="Chat History"
          >
            <History className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                Context Type
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleContextChange('general')}>
                General
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleContextChange('project')}>
                Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleContextChange('budget')}>
                Budget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleContextChange('compliance')}>
                Compliance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* History Sidebar (conditional) */}
      {showHistory && (
        <div className="border-b p-3 bg-muted/30">
          <p className="text-sm font-medium mb-2">Recent Chats</p>
          {sessionsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-1 max-h-[150px] overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted ${
                    activeSessionId === session.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    setShowHistory(false);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.message_count} messages
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(session.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No chat history</p>
          )}
        </div>
      )}

      {/* Advisory Banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 border-b text-xs text-warning-foreground shrink-0">
        <AlertTriangle className="h-3 w-3 text-warning" />
        <span>AI responses are advisory only. All decisions require human review.</span>
      </div>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4">
            {sessionLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">How can I help you today?</h3>
                <p className="text-sm text-muted-foreground max-w-[300px]">
                  Ask me about project status, budget information, payments, or compliance issues.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Suggestions */}
      {messages.length < 3 && suggestions.length > 0 && (
        <ChatSuggestions
          suggestions={suggestions}
          onSelect={handleSuggestionClick}
          disabled={sendMessage.isPending}
        />
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        isLoading={sendMessage.isPending || createSession.isPending}
        disabled={false}
        placeholder="Ask about projects, budgets, payments..."
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The chat session and all messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteSession(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
