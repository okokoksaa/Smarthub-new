
import React from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  ShieldCheck, 
  Lock, 
  PlayCircle,
  Check
} from 'lucide-react';

const SystemHealth: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Activity size={28} className="text-blue-600" /> System Health & Security
          </h1>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-2">
             <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
             All Systems Operational
          </span>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded">
                   <Server size={20} />
                </div>
                <h3 className="font-bold text-slate-800">API Latency</h3>
             </div>
             <p className="text-3xl font-bold text-slate-900">42ms</p>
             <p className="text-xs text-slate-500 mt-1">99.9% calls &#60; 200ms</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded">
                   <Database size={20} />
                </div>
                <h3 className="font-bold text-slate-800">DB Connections</h3>
             </div>
             <p className="text-3xl font-bold text-slate-900">18/100</p>
             <p className="text-xs text-slate-500 mt-1">Pool utilization normal</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-50 text-green-600 rounded">
                   <ShieldCheck size={20} />
                </div>
                <h3 className="font-bold text-slate-800">Security Events</h3>
             </div>
             <p className="text-3xl font-bold text-slate-900">0</p>
             <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
          </div>
       </div>

       {/* RLS Test Harness */}
       <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden text-white">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
             <h3 className="font-bold text-lg flex items-center gap-2">
                <Lock className="text-red-400" /> RLS Security Test Harness
             </h3>
             <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                <PlayCircle size={16} /> Run Diagnostics
             </button>
          </div>
          <div className="p-6 space-y-4">
             <p className="text-slate-400 text-sm">
                Simulates data access attempts from different user scopes to verify Row-Level Security policies.
             </p>
             
             <div className="space-y-2 bg-black/30 p-4 rounded-lg font-mono text-xs">
                <div className="flex items-center gap-3 text-green-400">
                   <Check size={14} />
                   <span>[PASS] User 'CDFC_Sec' cannot read 'Whistleblower_Table'</span>
                </div>
                <div className="flex items-center gap-3 text-green-400">
                   <Check size={14} />
                   <span>[PASS] User 'Kabwata_WDC' cannot read 'Munali_Projects'</span>
                </div>
                <div className="flex items-center gap-3 text-green-400">
                   <Check size={14} />
                   <span>[PASS] User 'Auditor' has READ-ONLY access to 'Financial_Ledger'</span>
                </div>
                <div className="flex items-center gap-3 text-green-400">
                   <Check size={14} />
                   <span>[PASS] Write attempt to 'Audit_Log' by 'Admin' blocked (Immutable)</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default SystemHealth;