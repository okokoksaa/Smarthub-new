import { useEffect, useMemo, useState } from 'react';
import {
  Brain,
  Search,
  MessageSquare,
  FileText,
  BookOpen,
  Send,
  Upload,
  Clock,
  ExternalLink,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; section: string; url: string | null; excerpt?: string }[];
  timestamp: string;
}

interface Document {
  id: string;
  title: string;
  source_type: 'guideline' | 'circular' | 'act';
  version_label?: string | null;
  effective_date?: string | null;
  document_url?: string | null;
  is_active: boolean;
}

const fieldHelpExamples = [
  { field: 'Project Budget', clause: 'Section 18(2): Maximum K5M for single projects without Minister approval' },
  { field: 'Contractor Selection', clause: 'Section 22(1): ZPPA registration mandatory for contracts above K500,000' },
  { field: 'WDC Composition', clause: 'Section 8(3): Minimum 10 members including youth and women representatives' },
];

export default function AIKnowledgeCenter() {
  const [activeTab, setActiveTab] = useState('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Ask about CDF Act, Guidelines, or Circulars. I will return a policy-grounded answer with citations when matches are found.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  useEffect(() => {
    const loadSources = async () => {
      try {
        const response = await api.get<{ success: boolean; data: Document[] }>('/ai-knowledge/sources');
        setDocuments(response.data.data || []);
      } catch (error) {
        toast.error('Failed to load document sources');
      }
    };

    loadSources();
  }, []);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || loading) return;

    const question = chatInput.trim();
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setLoading(true);

    try {
      const response = await api.post<{
        success: boolean;
        data: {
          answer: string;
          sources: { title: string; section: string; url: string | null; excerpt: string }[];
        };
      }>('/ai-knowledge/chat', { query: question });

      const payload = response.data.data;
      const aiMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: payload.answer,
        sources: payload.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast.error('Failed to get AI knowledge response');
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content:
            'I could not process your request right now. Please try again. If this persists, check that AI Knowledge sources are loaded.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) return documents;

    return documents.filter((doc) => {
      return (
        doc.title.toLowerCase().includes(search) ||
        (doc.version_label || '').toLowerCase().includes(search) ||
        doc.source_type.toLowerCase().includes(search)
      );
    });
  }, [documents, searchQuery]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'act': return 'destructive';
      case 'guideline': return 'default';
      case 'circular': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Knowledge Center</h1>
            <p className="text-muted-foreground">
              Ask policy questions, search guidelines, and get clause-backed answers
            </p>
          </div>
        </div>
        <Button disabled>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat & Clause Finder
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Document Library
          </TabsTrigger>
          <TabsTrigger value="field-help" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Explain This Field
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI Policy Assistant
                </CardTitle>
                <CardDescription>
                  Ask questions about CDF policies and get answers with source citations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4 mb-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-border/50 space-y-2">
                              <p className="text-xs font-medium opacity-70">Sources:</p>
                              {message.sources.map((source, idx) => (
                                <div key={idx} className="text-xs opacity-90">
                                  <a
                                    href={source.url || '#'}
                                    target={source.url ? '_blank' : undefined}
                                    rel={source.url ? 'noreferrer' : undefined}
                                    className="flex items-center gap-1 hover:underline"
                                  >
                                    <FileText className="h-3 w-3" />
                                    {source.title} — {source.section}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                  {source.excerpt && <p className="mt-1 opacity-75">“{source.excerpt}”</p>}
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-[10px] opacity-50 mt-2">{message.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask a policy question..."
                    value={chatInput}
                    disabled={loading}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    className="min-h-[60px]"
                  />
                  <Button onClick={handleSendMessage} className="shrink-0" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Popular Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    'What are the project funding limits?',
                    'How to handle contractor disputes?',
                    'CDFC meeting procedures?',
                    'Payment approval workflow?',
                  ].map((question, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      className="w-full justify-start text-sm h-auto py-2"
                      onClick={() => setChatInput(question)}
                    >
                      <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                      {question}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Scope</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> CDF Act</div>
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> CDF Guidelines</div>
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> Circulars</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Document Library</CardTitle>
                  <CardDescription>Active CDF Act, Guidelines, and Circulars</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[300px]"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredDocuments.length === 0 && (
                  <div className="text-sm text-muted-foreground py-4">
                    No active knowledge documents found.
                  </div>
                )}
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{doc.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {doc.version_label ? `Version ${doc.version_label} • ` : ''}
                          Effective: {doc.effective_date || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getTypeColor(doc.source_type)}>{doc.source_type}</Badge>
                      <Badge variant={doc.is_active ? 'success' : 'secondary'}>{doc.is_active ? 'active' : 'inactive'}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => doc.document_url && window.open(doc.document_url, '_blank', 'noopener,noreferrer')}
                        disabled={!doc.document_url}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="field-help" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-info" />
                  Field Explanations
                </CardTitle>
                <CardDescription>
                  In-form help with citations — click any field to understand its requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fieldHelpExamples.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-medium mb-2">{item.field}</h4>
                    <p className="text-sm text-muted-foreground">{item.clause}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enforcement Rules</CardTitle>
                <CardDescription>
                  Form fields can require explanations to match clauses before enabling Submit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-sm">
                    <strong>Example:</strong> When submitting a project exceeding K5M, the system requires
                    acknowledgment of Section 18(2) which mandates Minister approval for large projects.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
