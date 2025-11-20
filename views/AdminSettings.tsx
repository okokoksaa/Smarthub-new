
import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Calendar, 
  Globe, 
  Trash2, 
  Save,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const AdminSettings: React.FC = () => {
  const [publicPortal, setPublicPortal] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-900 rounded-lg text-white">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Control Panel</h1>
          <p className="text-slate-500">Tenant configuration for Kamwala Constituency</p>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Shield size={18} /> Feature Flags
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900">Public Transparency Portal</h3>
              <p className="text-sm text-slate-500">Expose approved project lists and budgets to the public URL.</p>
            </div>
            <button 
              onClick={() => setPublicPortal(!publicPortal)}
              className={`transition-colors ${publicPortal ? 'text-blue-600' : 'text-slate-300'}`}
            >
              {publicPortal ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
            </button>
          </div>
          <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900">Deemed Approval (14 Days)</h3>
              <p className="text-sm text-slate-500">Auto-approve submissions if PLGO takes > 14 working days.</p>
            </div>
            <button 
              onClick={() => setAutoApprove(!autoApprove)}
              className={`transition-colors ${autoApprove ? 'text-blue-600' : 'text-slate-300'}`}
            >
              {autoApprove ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
            </button>
          </div>
          <div className="border-t border-slate-100 pt-6 flex items-center justify-between opacity-50">
            <div>
              <h3 className="font-medium text-slate-900">Red-Flag Analytics Engine</h3>
              <p className="text-sm text-slate-500">AI detection of collusion in tender bids (Premium Plan only).</p>
            </div>
            <div className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-500">Upgrade Required</div>
          </div>
        </div>
      </div>

      {/* Working Days */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={18} /> SLA & Calendar Settings
          </h2>
        </div>
        <div className="p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Primary Province</label>
                 <select className="w-full p-2 border border-slate-200 rounded-lg text-sm">
                    <option>Lusaka Province</option>
                    <option>Copperbelt Province</option>
                 </select>
                 <p className="text-xs text-slate-500 mt-2">Determines public holiday calendar for SLA calculations.</p>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">SLA Breach Threshold</label>
                 <select className="w-full p-2 border border-slate-200 rounded-lg text-sm">
                    <option>Strict (Notify immediately)</option>
                    <option>Standard (Notify at 80% time)</option>
                 </select>
              </div>
           </div>
        </div>
      </div>

      {/* Retention */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Trash2 size={18} /> Retention & Privacy
          </h2>
        </div>
        <div className="p-6 space-y-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">PII Redaction Policy</label>
              <select className="w-full p-2 border border-slate-200 rounded-lg text-sm">
                 <option>Redact after 2 years</option>
                 <option>Redact after 5 years</option>
                 <option>Keep indefinitely (Not recommended)</option>
              </select>
           </div>
           <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
              Note: Audit logs are immutable and will be retained for 10 years regardless of PII settings.
           </div>
        </div>
      </div>

      <div className="flex justify-end">
         <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
            <Save size={18} /> Save Configuration
         </button>
      </div>
    </div>
  );
};

export default AdminSettings;
