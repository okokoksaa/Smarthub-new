import React, { useState } from 'react';
import { 
  FileText, 
  ShoppingBag, 
  Clock, 
  Lock, 
  Search,
  BarChart,
  CheckSquare,
  ClipboardCheck,
  Table,
  Check,
  X
} from 'lucide-react';

const Procurement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'evaluation'>('pipeline');

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold">Procurement Management</h1>
             <p className="text-slate-400 mt-1">Manage Plans, Sealed Bids, and Contracts compliant with ZPPA Act.</p>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={() => setActiveTab('pipeline')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'pipeline' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
             >
                Pipeline & Tenders
             </button>
             <button 
                onClick={() => setActiveTab('evaluation')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'evaluation' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
             >
                <ClipboardCheck size={16} /> Bid Evaluation
             </button>
          </div>
       </div>

       {activeTab === 'pipeline' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Tenders */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                     <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <ShoppingBag size={18} className="text-blue-600" /> Active Tenders
                     </h2>
                     <div className="flex gap-2">
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded font-bold">2 Open</span>
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded font-bold">5 Closed</span>
                     </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                     {[1, 2].map((i) => (
                        <div key={i} className="p-6 hover:bg-slate-50 transition-colors">
                           <div className="flex justify-between items-start mb-3">
                              <div>
                                 <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">TENDER-2024-00{i}</span>
                                 <h3 className="font-bold text-slate-800 mt-2 text-lg">Construction of 1x3 Classroom Block at {i === 1 ? 'Kamwala South' : 'Chilenje'} School</h3>
                              </div>
                              <div className="text-right">
                                 <div className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded text-xs border border-amber-100">
                                    <Clock size={14} /> Closes in {i === 1 ? '2d 14h' : '5d 09h'}
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-6 text-sm text-slate-600 mt-4">
                              <div className="flex items-center gap-2">
                                 <Lock size={16} className="text-slate-400" />
                                 <span>8 Sealed Bids Received</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <FileText size={16} className="text-slate-400" />
                                 <span>Open National Bidding</span>
                              </div>
                           </div>
                           <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-3">
                              <button className="text-sm text-slate-600 font-medium hover:text-slate-900">View Specs</button>
                              <button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-800">Manage Tender</button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Procurement Pipeline Stats */}
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4">Procurement Stages</h3>
                  <div className="space-y-4 relative">
                     <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-slate-100"></div>
                     
                     <div className="relative flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 z-10">
                           <CheckSquare size={16} />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-800 text-sm">Annual Plan Approved</h4>
                           <p className="text-xs text-slate-500">PLGO & Ministry Signed off</p>
                        </div>
                     </div>

                     <div className="relative flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 z-10 shadow-lg shadow-blue-200">
                           <ShoppingBag size={16} />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-800 text-sm">Tendering / Floating</h4>
                           <p className="text-xs text-slate-500">2 Active, 3 Drafts</p>
                        </div>
                     </div>

                     <div className="relative flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 z-10">
                           <Search size={16} />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-800 text-sm">Evaluation</h4>
                           <p className="text-xs text-slate-500">Pending Bid Opening</p>
                        </div>
                     </div>

                     <div className="relative flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 z-10">
                           <BarChart size={16} />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-800 text-sm">Award & Contract</h4>
                           <p className="text-xs text-slate-500">0 Awaiting Signature</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                     <Lock className="text-blue-600 mt-1" size={20} />
                     <div>
                        <h4 className="font-bold text-blue-900 text-sm">Sealed Bid Protocol</h4>
                        <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                           Bids are cryptographically sealed. They cannot be viewed or opened by anyone—including admins—until the official opening time. An audit event is logged upon opening.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
       )}

       {activeTab === 'evaluation' && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <div>
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                     <Table size={18} className="text-blue-600" /> Bid Evaluation Matrix
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Tender: TENDER-2024-003 (Closed)</p>
               </div>
               <div className="flex gap-2">
                  <button className="text-sm border border-slate-200 px-3 py-1.5 rounded bg-white hover:bg-slate-50">
                     Export Report
                  </button>
                  <button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded font-medium hover:bg-slate-800">
                     Submit for Award
                  </button>
               </div>
            </div>

            <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                     <th className="px-6 py-3">Bidder Name</th>
                     <th className="px-6 py-3">Compliance (P/F)</th>
                     <th className="px-6 py-3">Technical (80%)</th>
                     <th className="px-6 py-3">Financial Bid</th>
                     <th className="px-6 py-3">Financial Score (20%)</th>
                     <th className="px-6 py-3 font-bold text-slate-700">Total Score</th>
                     <th className="px-6 py-3">Rank</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  <tr className="bg-green-50/30 hover:bg-green-50">
                     <td className="px-6 py-4 font-bold text-slate-800">ConstructIt Ltd</td>
                     <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                           <Check size={14} /> PASS
                        </span>
                     </td>
                     <td className="px-6 py-4">76.5</td>
                     <td className="px-6 py-4 font-mono">K 450,000</td>
                     <td className="px-6 py-4">18.2</td>
                     <td className="px-6 py-4 font-bold text-green-700">94.7</td>
                     <td className="px-6 py-4">
                        <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">1</span>
                     </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                     <td className="px-6 py-4 font-medium text-slate-800">BuildFast Zambia</td>
                     <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                           <Check size={14} /> PASS
                        </span>
                     </td>
                     <td className="px-6 py-4">72.0</td>
                     <td className="px-6 py-4 font-mono">K 465,000</td>
                     <td className="px-6 py-4">17.5</td>
                     <td className="px-6 py-4 font-bold text-slate-700">89.5</td>
                     <td className="px-6 py-4">
                        <span className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                     </td>
                  </tr>
                  <tr className="hover:bg-slate-50 opacity-60">
                     <td className="px-6 py-4 text-slate-500">Lusaka Civil Works</td>
                     <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-red-600 font-bold text-xs">
                           <X size={14} /> FAIL
                        </span>
                     </td>
                     <td className="px-6 py-4">-</td>
                     <td className="px-6 py-4 font-mono">K 420,000</td>
                     <td className="px-6 py-4">-</td>
                     <td className="px-6 py-4 font-bold text-slate-400">DQ</td>
                     <td className="px-6 py-4">-</td>
                  </tr>
               </tbody>
            </table>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
               <span>Evaluation Committee: 3 Members • Quorum Met</span>
               <span>Last Updated: Oct 24, 14:30 by Chair</span>
            </div>
         </div>
       )}
    </div>
  );
};

export default Procurement;