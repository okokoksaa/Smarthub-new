import { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; section: string; url: string }[];
  timestamp: string;
}

interface Document {
  id: string;
  title: string;
  type: 'guideline' | 'circular' | 'template' | 'act';
  version: string;
  effectiveDate: string;
  status: 'active' | 'superseded' | 'draft';
}

const mockDocuments: Document[] = [
  { id: '1', title: 'CDF Act 2018', type: 'act', version: '1.0', effectiveDate: '2018-08-01', status: 'active' },
  { id: '2', title: 'CDF Guidelines 2023', type: 'guideline', version: '3.2', effectiveDate: '2023-01-15', status: 'active' },
  { id: '3', title: 'Procurement Procedures Manual', type: 'guideline', version: '2.1', effectiveDate: '2022-06-01', status: 'active' },
  { id: '4', title: 'Circular 001/2024: Budget Ceilings', type: 'circular', version: '1.0', effectiveDate: '2024-01-02', status: 'active' },
  { id: '5', title: 'Project Proposal Template', type: 'template', version: '1.5', effectiveDate: '2023-03-01', status: 'active' },
  { id: '6', title: 'Payment Request Form', type: 'template', version: '2.0', effectiveDate: '2023-06-01', status: 'active' },
];

const mockChatHistory: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'What is the minimum quorum for a CDFC meeting?',
    timestamp: '10:30 AM',
  },
  {
    id: '2',
    role: 'assistant',
    content: 'According to Section 12(4) of the CDF Act 2018, the minimum quorum for a CDFC meeting is **six (6) members**, which must include:\n\n1. The Chairperson or Vice-Chairperson\n2. At least two (2) elected WDC representatives\n3. The Finance Officer\n\nNo decisions can be made without achieving quorum, and any resolutions passed without quorum are void.',
    sources: [
      { title: 'CDF Act 2018', section: 'Section 12(4)', url: '#' },
      { title: 'CDF Guidelines 2023', section: 'Chapter 3.2.1', url: '#' },
    ],
    timestamp: '10:30 AM',
  },
];

const fieldHelpExamples = [
  { field: 'Project Budget', clause: 'Section 18(2): Maximum K5M for single projects without Minister approval' },
  { field: 'Contractor Selection', clause: 'Section 22(1): ZPPA registration mandatory for contracts above K500,000' },
  { field: 'WDC Composition', clause: 'Section 8(3): Minimum 10 members including youth and women representatives' },
];

export default function AIKnowledgeCenter() {
  const [activeTab, setActiveTab] = useState('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatHistory);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, newMessage]);
    setChatInput('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m processing your question. In a production system, this would connect to the AI Knowledge Base to provide accurate, citation-backed answers from the CDF Act, Guidelines, and Circulars.',
        sources: [{ title: 'CDF Guidelines 2023', section: 'Relevant Section', url: '#' }],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'act': return 'destructive';
      case 'guideline': return 'default';
      case 'circular': return 'warning';
      case 'template': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
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
        <Button>
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
                  Ask questions about CDF policies, procedures, and get answers with source citations
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
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.sources && (
                            <div className="mt-3 pt-2 border-t border-border/50 space-y-1">
                              <p className="text-xs font-medium opacity-70">Sources:</p>
                              {message.sources.map((source, idx) => (
                                <a
                                  key={idx}
                                  href={source.url}
                                  className="text-xs flex items-center gap-1 hover:underline opacity-80"
                                >
                                  <FileText className="h-3 w-3" />
                                  {source.title} — {source.section}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
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
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    className="min-h-[60px]"
                  />
                  <Button onClick={handleSendMessage} className="shrink-0">
                    <Send className="h-4 w-4" />
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
                  <CardTitle className="text-lg">Recent Searches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {['quorum requirements', 'budget ceiling', 'bursary eligibility'].map((term, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {term}
                    </div>
                  ))}
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
                  <CardDescription>Versioned guidelines, circulars, and templates</CardDescription>
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
                {mockDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{doc.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Version {doc.version} • Effective: {doc.effectiveDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getTypeColor(doc.type)}>{doc.type}</Badge>
                      <Badge variant={doc.status === 'active' ? 'success' : 'secondary'}>{doc.status}</Badge>
                      <Button variant="ghost" size="sm">
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
