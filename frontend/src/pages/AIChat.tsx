import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bot,
  MessageSquare,
  FolderKanban,
  Wallet,
  Shield,
  CreditCard,
  Sparkles,
  History,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { AIChatPanel } from '@/components/ai-chat';
import { useChatSessions } from '@/hooks/useAIChat';

export default function AIChat() {
  const [selectedContext, setSelectedContext] = useState<string>('general');
  const { data: sessions } = useChatSessions();

  const contextOptions = [
    { value: 'general', label: 'General Queries', icon: MessageSquare, description: 'Ask anything about CDF' },
    { value: 'project', label: 'Project Focus', icon: FolderKanban, description: 'Project status & tracking' },
    { value: 'budget', label: 'Budget Analysis', icon: Wallet, description: 'Budget & allocations' },
    { value: 'payment', label: 'Payment Tracking', icon: CreditCard, description: 'Payment & disbursements' },
    { value: 'compliance', label: 'Compliance Check', icon: Shield, description: 'Documents & deadlines' },
  ];

  const recentSessions = sessions?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground">
            Ask questions about projects, budgets, payments, and compliance
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          AI-Powered
        </Badge>
      </div>

      {/* Advisory Notice */}
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Advisory Only</p>
            <p className="text-sm text-muted-foreground">
              AI responses are for informational purposes only. All financial decisions,
              approvals, and official actions require human review and proper authorization
              through the appropriate workflow.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chat Panel */}
        <div className="lg:col-span-2">
          <AIChatPanel contextType={selectedContext} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Context Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Focus Area</CardTitle>
              <CardDescription className="text-xs">
                Select a context to get more relevant responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {contextOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedContext === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedContext(option.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:bg-muted'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-md ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent conversations
                </p>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                    >
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {session.context_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {session.message_count} messages
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Be specific with your questions for better responses
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Select a focus area to get context-aware answers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Use suggested questions for common queries
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Always verify AI responses with official records
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
