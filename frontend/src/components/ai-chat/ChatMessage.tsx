import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Bot, User, AlertTriangle, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage as ChatMessageType } from '@/hooks/useAIChat';

interface ChatMessageProps {
  message: ChatMessageType;
  showDisclaimer?: boolean;
}

export function ChatMessage({ message, showDisclaimer = true }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <Badge variant="outline" className="text-xs text-muted-foreground">
          {message.content}
        </Badge>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3 mb-4',
        isAssistant ? 'flex-row' : 'flex-row-reverse'
      )}
    >
      <Avatar className={cn('h-8 w-8', isAssistant ? 'bg-primary' : 'bg-secondary')}>
        <AvatarFallback className={isAssistant ? 'bg-primary text-primary-foreground' : ''}>
          {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex flex-col max-w-[80%]', isAssistant ? 'items-start' : 'items-end')}>
        <Card
          className={cn(
            'px-4 py-3',
            isAssistant
              ? 'bg-muted/50 border-muted'
              : 'bg-primary text-primary-foreground border-primary'
          )}
        >
          {isAssistant ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                  h1: ({ children }) => <h3 className="font-bold text-lg mb-2">{children}</h3>,
                  h2: ({ children }) => <h4 className="font-bold mb-2">{children}</h4>,
                  h3: ({ children }) => <h5 className="font-semibold mb-1">{children}</h5>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm">{message.content}</p>
          )}
        </Card>

        {/* Advisory disclaimer for assistant messages */}
        {isAssistant && message.is_advisory && showDisclaimer && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            <span>Advisory only - Requires human review</span>
          </div>
        )}

        {/* Intent badge */}
        {isAssistant && message.intent_detected && message.intent_detected !== 'general' && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {message.intent_detected.replace('_', ' ')}
            </Badge>
          </div>
        )}

        {/* Citations/Sources */}
        {isAssistant && message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.citations.map((citation: any, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs gap-1">
                <ExternalLink className="h-3 w-3" />
                {citation.type}: {citation.name || citation.id}
              </Badge>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground mt-1">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
