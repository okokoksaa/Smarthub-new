
import React, { useState } from 'react';
import { 
  FileSearch, 
  AlertOctagon, 
  ShieldCheck, 
  Filter, 
  Download,
  Eye,
  Lock,
  EyeOff,
  Key,
  ArrowRight
} from 'lucide-react';

const Audit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'whistleblower'>('logs');

  const logs = [
    { id: 'AUD-9921', time: '2024-10-25 14:32:11', user: 'jane.doe@cdf.gov.zm', action: 'APPROVE_PAYMENT', entity: 'TRX-8831', ip: '197.24.1.22' },
    { id: 'AUD-9920', time: '2024-10-25 14:15:05', user: 'john.smith@council.gov.zm', action: 'UPDATE_PROJECT_STATUS', entity: 'PRJ-001', ip: '41.77.2.15' },
    { id: 'AUD-9919', time: '2024-10-25 13:45:00', user: 'system', action: 'AUTO_SLA_ESCALATION', entity: 'SUB-2024-089', ip: 'Internal' },
    { id: 'AUD-9918', time: '2024-10-25 11:20:33', user: 'mary.banda@wdc.org', action: 'UPLOAD_DOCUMENT', entity: 'DOC-MIN-24', ip: '102.23.4.1' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck size={28} className="text-blue-600" /> Audit & Investigations
         </h1>
         <div className="flex gap-3">
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'logs' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
               System Logs
            </button>
            <button 
              onClick={() => setActiveTab('whistleblower')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'whistleblower' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
               <EyeOff size={16} /> Whistleblower Inbox
            </button>
         </div>
      </div>

      {activeTab === 'logs' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           {/* Red Flags Panel */}
           <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <AlertOctagon size={20} className="text-red-500" /> Active Red Flags
                 </h3>
                 <div className="space-y-3">
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
                       <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-red-700 uppercase">Collusion Risk</span>
                          <span className="text-xs bg-white/50 px-1.5 py-0.5 rounded text-red-800">High</span>
                       </div>
                       <p className="text-xs text-red-800 mt-2">
                          3 Bids for Tender T-001 submitted from same IP subnet within 5 minutes.
                       </p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                       <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-amber-700 uppercase">Split Payment</span>
                          <span className="text-xs bg-white/50 px-1.5 py-0.5 rounded text-amber-800">Med</span>
                       </div>
                       <p className="text-xs text-amber-800 mt-2">
                          2 payments of K24,000 to Contractor X created same day (Threshold avoidance).
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Audit Log Table */}
           <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">Immutable System Logs</h3>
                 <div className="flex gap-2">
                    <input 
                       type="text" 
                       placeholder="Search User, Action or Entity..." 
                       className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-64"
                    />
                    <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded">
                       <Filter size={18} />
                    </button>
                    <button className="text-sm bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 flex items-center gap-2">
                       <Download size={16} /> Export
                    </button>
                 </div>
              </div>
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                       <th className="px-6 py-3">Timestamp</th>
                       <th className="px-6 py-3">User Principal</th>
                       <th className="px-6 py-3">Action</th>
                       <th className="px-6 py-3">Target Entity</th>
                       <th className="px-6 py-3">Source IP</th>
                       <th className="px-6 py-3"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                       <tr key={log.id} className="hover:bg-slate-50 font-mono text-xs">
                          <td className="px-6 py-3 text-slate-500">{log.time}</td>
                          <td className="px-6 py-3 font-bold text-slate-700">{log.user}</td>
                          <td className="px-6 py-3">
                             <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                                {log.action}
                             </span>
                          </td>
                          <td className="px-6 py-3 text-blue-600">{log.entity}</td>
                          <td className="px-6 py-3 text-slate-500">{log.ip}</td>
                          <td className="px-6 py-3 text-right">
                             <button className="text-slate-400 hover:text-blue-600">
                                <Eye size={16} />
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                 <p className="text-xs text-slate-500">Logs are write-once and cryptographically chained.</p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'whistleblower' && (
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl min-h-[500px] border border-slate-800">
           <div className="bg-red-900/20 p-6 border-b border-red-900/30 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-red-500/10 rounded-lg text-red-500">
                    <EyeOff size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-slate-100">Secure Whistleblower Inbox</h2>
                    <p className="text-red-400 text-sm flex items-center gap-1">
                       <Lock size={12} /> End-to-End Encrypted • Identity Protected
                    </p>
                 </div>
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                 <Key size={16} /> Decrypt with Admin Key
              </button>
           </div>

           <div className="p-8">
              <div className="grid gap-4">
                 {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-slate-200">
                             <Lock size={20} />
                          </div>
                          <div>
                             <h4 className="font-mono font-bold text-slate-200 text-sm">REPORT-{2024000+i}</h4>
                             <p className="text-xs text-slate-500 mt-1">Received: Oct {20+i}, 2024 • <span className="text-slate-400">Encrypted Payload</span></p>
                          </div>
                       </div>
                       <div className="flex items-center gap-6">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${i===1 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                             {i===1 ? 'High Priority' : 'Unclassified'}
                          </span>
                          <span className="text-slate-600 text-sm font-mono group-hover:text-blue-400 flex items-center gap-2">
                             View Content <ArrowRight size={14} />
                          </span>
                       </div>
                    </div>
                 ))}
              </div>
              
              <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-slate-700 text-center">
                 <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                    This vault contains encrypted tips regarding CDF mismanagement. Access is restricted to the <strong>Internal Audit Committee</strong> and requires dual-key authorization. Access attempts are logged on an immutable ledger.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Audit;
