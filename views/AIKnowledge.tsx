import React, { useState } from 'react';
import { Send, Bot, FileText, Search, Sparkles, BookOpen, HelpCircle } from 'lucide-react';
import { ChatMessage } from '../types';

const AIKnowledge: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am your CDF Policy Assistant. I can help you find clauses in the 2024 Guidelines, verify procurement thresholds, or draft meeting minutes. How can I help?',
      timestamp: new Date(),
    }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate AI Response with specific domain knowledge
    setTimeout(() => {
      let responseText = "I'm searching the CDF Guidelines...";
      let citations: string[] = [];

      if (input.toLowerCase().includes('quorum')) {
        responseText = "According to the CDF Act, a Ward Development Committee (WDC) meeting requires a quorum of at least 50% of members to make binding decisions. For voting on project priorities, specific Conflict of Interest declarations must be signed prior to the vote.";
        citations = ["CDF Act 2018, Section 14(2)", "Guidelines Pg. 45"];
      } else if (input.toLowerCase().includes('bursary')) {
        responseText = "Bursary allocations are capped at the approved percentage of the total constituency allocation. Applicants must prove residency (min 6 months) and provide an admission letter from a recognized institution.";
        citations = ["Circular No. 4 of 2024", "Education Support Policy"];
      } else {
         responseText = "I've noted your query. To provide an accurate answer, please specify if this relates to Procurement, Empowerment Grants, or Infrastructure Projects.";
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText,
        timestamp: new Date(),
        citations
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Chat Interface */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Policy AI Agent</h3>
              <p className="text-xs text-slate-500">Trained on Acts, Guidelines & Circulars</p>
            </div>
          </div>
          <button className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-50">
            Clear Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                      <BookOpen size={12} /> Sources Verified:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((cite, idx) => (
                        <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                          {cite}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about guidelines, thresholds, or templates..."
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 top-1.5 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar for Docs */}
      <div className="w-80 hidden xl:flex flex-col gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
             <FileText size={18} /> Recent Circulars
           </h3>
           <ul className="space-y-3">
             {[
               'Circular 4/2024: Procurement Thresholds',
               'Memo: Updates to Bursary Form B',
               'Guideline: 2025 Budget Preparation'
             ].map((doc, i) => (
               <li key={i} className="text-sm text-blue-600 hover:underline cursor-pointer flex items-start gap-2">
                 <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                 {doc}
               </li>
             ))}
           </ul>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-5 rounded-xl shadow-md text-white">
          <HelpCircle className="mb-3 opacity-80" size={24} />
          <h4 className="font-bold mb-1">Need Specific Help?</h4>
          <p className="text-xs text-indigo-100 mb-3">The Clause Finder can locate exact paragraphs in the PDF corpus.</p>
          <button className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm transition-colors">
             Launch Clause Finder
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIKnowledge;