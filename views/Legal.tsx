import React, { useState } from 'react';
import { 
  Scale, 
  FileText, 
  Search,
  Link as LinkIcon,
  Gavel,
  AlertCircle
} from 'lucide-react';

const Legal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'contracts' | 'disputes'>('contracts');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Scale size={28} className="text-slate-700" /> Legal & Compliance
         </h1>
         <div className="flex gap-3">
            <button 
               onClick={() => setActiveTab('contracts')}
               className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'contracts' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
               Contract Repository
            </button>
            <button 
               onClick={() => setActiveTab('disputes')}
               className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'disputes' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
               <Gavel size={16} /> Dispute Registry
            </button>
         </div>
      </div>

      {activeTab === 'contracts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Contract Repository</h3>
                    <div className="relative">
                       <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                       <input 
                          type="text" 
                          placeholder="Search contracts..." 
                          className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-64"
                       />
                    </div>
                 </div>
                 <div className="divide-y divide-slate-100">
                    {[1, 2, 3].map((i) => (
                       <div key={i} className="p-4 hover:bg-slate-50 flex justify-between items-center">
                          <div className="flex items-start gap-3">
                             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <FileText size={20} />
                             </div>
                             <div>
                                <h4 className="font-bold text-slate-800 text-sm">Contract for Construction of Works</h4>
                                <p className="text-xs text-slate-500">Ref: CNT-2024-00{i} • Contractor: BuildRight Ltd</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className={`text-xs px-2 py-1 rounded font-medium ${i === 1 ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                {i === 1 ? 'Active' : 'Draft'}
                             </span>
                             <button className="text-blue-600 text-xs font-medium hover:underline">View</button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-slate-800 mb-4">Legal Opinions</h3>
                 <ul className="space-y-3">
                    <li className="text-sm text-blue-600 hover:underline cursor-pointer flex items-start gap-2">
                       <LinkIcon size={14} className="mt-1 shrink-0" />
                       Use of Force Account for Constituency Projects (AG Opinion)
                    </li>
                    <li className="text-sm text-blue-600 hover:underline cursor-pointer flex items-start gap-2">
                       <LinkIcon size={14} className="mt-1 shrink-0" />
                       Procurement Thresholds for 2024/2025
                    </li>
                    <li className="text-sm text-blue-600 hover:underline cursor-pointer flex items-start gap-2">
                       <LinkIcon size={14} className="mt-1 shrink-0" />
                       Dispute Resolution Mechanism Guidelines
                    </li>
                 </ul>
              </div>
              
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                 <h3 className="font-bold text-slate-800 text-sm mb-2">Local Preference Rule</h3>
                 <p className="text-xs text-slate-600 leading-relaxed">
                    Awards to non-local contractors require a mandatory written justification attached to the contract, citing lack of local capacity as per ZPPA Act Section 48.
                 </p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'disputes' && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="font-bold text-slate-800">Dispute Cases</h3>
               <button className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-amber-100">
                  Log New Case
               </button>
            </div>
            <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                     <th className="px-6 py-3">Case ID</th>
                     <th className="px-6 py-3">Parties Involved</th>
                     <th className="px-6 py-3">Issue</th>
                     <th className="px-6 py-3">Current Stage</th>
                     <th className="px-6 py-3">Status</th>
                     <th className="px-6 py-3">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                     <td className="px-6 py-4 font-mono text-slate-500">DSP-2024-001</td>
                     <td className="px-6 py-4 font-bold text-slate-800">BuildRight Ltd vs Council</td>
                     <td className="px-6 py-4">Delayed Payment Interest</td>
                     <td className="px-6 py-4">Arbitration</td>
                     <td className="px-6 py-4">
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold">Open</span>
                     </td>
                     <td className="px-6 py-4">
                        <button className="text-blue-600 hover:underline font-medium">View File</button>
                     </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                     <td className="px-6 py-4 font-mono text-slate-500">DSP-2024-004</td>
                     <td className="px-6 py-4 font-bold text-slate-800">Community Group vs WDC</td>
                     <td className="px-6 py-4">Selection Bias Allegation</td>
                     <td className="px-6 py-4">CDFC Review</td>
                     <td className="px-6 py-4">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Resolved</span>
                     </td>
                     <td className="px-6 py-4">
                        <button className="text-blue-600 hover:underline font-medium">View File</button>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>
      )}
    </div>
  );
};

export default Legal;