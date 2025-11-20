
import React, { useState } from 'react';
import { 
  Users, 
  Briefcase, 
  BookOpen, 
  CheckSquare, 
  DollarSign,
  AlertTriangle
} from 'lucide-react';

const Empowerment: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'grants' | 'loans' | 'training'>('grants');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-900 to-emerald-700 p-6 rounded-xl text-white shadow-lg">
         <div>
            <h1 className="text-2xl font-bold">Empowerment Pipeline</h1>
            <p className="text-emerald-100 opacity-80">Manage Grants for Cooperatives and Loans for SMEs.</p>
         </div>
         <div className="flex gap-3">
            <div className="text-right">
               <p className="text-xs uppercase text-emerald-200">Grant Budget</p>
               <p className="font-bold text-lg">K 3,200,000</p>
            </div>
            <div className="w-px bg-emerald-600 h-10"></div>
            <div className="text-right">
               <p className="text-xs uppercase text-emerald-200">Loan Revolving Fund</p>
               <p className="font-bold text-lg">K 1,500,000</p>
            </div>
         </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-slate-200 flex gap-6">
        <button 
          onClick={() => setActiveTab('grants')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'grants' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Grant Applications
        </button>
        <button 
          onClick={() => setActiveTab('loans')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'loans' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Loan Portfolio
        </button>
        <button 
          onClick={() => setActiveTab('training')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'training' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Financial Literacy Training
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {/* Application List */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">
                    {activeTab === 'grants' ? 'Cooperative Grant Requests' : activeTab === 'loans' ? 'SME Loan Applications' : 'Training Sessions'}
                 </h3>
                 <button className="text-sm text-emerald-600 font-medium">View All</button>
              </div>
              
              <div className="divide-y divide-slate-100">
                 {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                       <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                {activeTab === 'training' ? <BookOpen size={20} /> : <Users size={20} />}
                             </div>
                             <div>
                                <h4 className="font-bold text-slate-800">
                                   {activeTab === 'training' ? `Batch ${i}: Financial Management` : `Women's Poultry Coop Group ${i}`}
                                </h4>
                                <p className="text-xs text-slate-500">
                                   {activeTab === 'training' ? 'Oct 25, 2024 • 25 Attendees' : 'Kabwata Ward • 15 Members'}
                                </p>
                             </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${i === 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                             {i === 2 ? 'Approved' : 'Under Review'}
                          </span>
                       </div>
                       {activeTab !== 'training' && (
                          <div className="ml-13 pl-13 flex items-center gap-4 mt-2 text-sm">
                             <span className="flex items-center gap-1 text-slate-600">
                                <Briefcase size={14} /> Poultry Farming
                             </span>
                             <span className="flex items-center gap-1 text-slate-600 font-mono">
                                <DollarSign size={14} /> K 40,000
                             </span>
                          </div>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Side Panel: Compliance & Training Gates */}
        <div className="space-y-6">
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <CheckSquare size={18} className="text-emerald-600" /> Eligibility Gates
              </h3>
              <div className="space-y-4">
                 <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                       <input type="checkbox" checked readOnly className="w-4 h-4 text-emerald-600 rounded border-slate-300" />
                    </div>
                    <div>
                       <p className="text-sm font-medium text-slate-800">Registration Certificate</p>
                       <p className="text-xs text-slate-500">PACRA/Registrar of Societies</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                       <input type="checkbox" checked readOnly className="w-4 h-4 text-emerald-600 rounded border-slate-300" />
                    </div>
                    <div>
                       <p className="text-sm font-medium text-slate-800">Membership Threshold</p>
                       <p className="text-xs text-slate-500">Min 10 members (Grants)</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-3 opacity-50">
                    <div className="mt-0.5">
                       <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded border-slate-300" />
                    </div>
                    <div>
                       <p className="text-sm font-medium text-slate-800">Training Verified</p>
                       <p className="text-xs text-slate-500">Attendance > 80% of members</p>
                    </div>
                 </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100">
                 <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                    <p className="text-xs text-amber-800">
                       Disbursement is blocked until Training Verification is complete for all group leaders.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Empowerment;