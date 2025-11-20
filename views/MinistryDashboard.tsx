
import React from 'react';
import { 
  Building, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  FileText,
  ArrowRight
} from 'lucide-react';

const MinistryDashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
       {/* Ministry Header */}
       <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                   <Building size={32} className="text-yellow-400" />
                </div>
                <div>
                   <h1 className="text-2xl font-bold">Ministry HQ Dashboard</h1>
                   <p className="text-slate-300">National Oversight & CAPR Tracking</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-xs uppercase text-slate-400">National CDF Allocation</p>
                <p className="font-bold text-2xl">K 4.8 Billion</p>
             </div>
          </div>
       </div>

       {/* 90-Day Rule Tracker (CAPR) */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
             <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock size={20} className="text-blue-600" /> CAPR 90-Day Rule Tracker
             </h2>
             <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Statutory Requirement</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                   <span className="font-bold text-slate-700">Lusaka Central</span>
                   <span className="text-green-600 font-bold">Day 45/90</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
                   <div className="bg-green-500 h-3 rounded-full w-[50%]"></div>
                </div>
                <p className="text-xs text-slate-500">First Sitting: Sep 10 • Due: Dec 09</p>
             </div>

             <div className="border border-slate-200 rounded-lg p-4 bg-amber-50/50">
                <div className="flex justify-between text-sm mb-2">
                   <span className="font-bold text-slate-700">Matero</span>
                   <span className="text-amber-600 font-bold">Day 82/90</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
                   <div className="bg-amber-500 h-3 rounded-full w-[91%]"></div>
                </div>
                <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
                   <AlertOctagon size={12} /> Approaching Deadline
                </p>
             </div>

             <div className="border border-slate-200 rounded-lg p-4 bg-red-50/50">
                <div className="flex justify-between text-sm mb-2">
                   <span className="font-bold text-slate-700">Munali</span>
                   <span className="text-red-600 font-bold">Day 92/90</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
                   <div className="bg-red-500 h-3 rounded-full w-[100%]"></div>
                </div>
                <p className="text-xs text-red-700 font-bold flex items-center gap-1">
                   <AlertOctagon size={12} /> BREACHED
                </p>
             </div>
          </div>
       </div>

       {/* Constituency Approvals Queue */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
             <h2 className="font-bold text-slate-800">Consolidated Project List Approvals</h2>
             <button className="text-blue-600 text-sm font-medium hover:underline">View All 156</button>
          </div>
          <table className="w-full text-left text-sm">
             <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                   <th className="px-6 py-3">Reference</th>
                   <th className="px-6 py-3">Constituency</th>
                   <th className="px-6 py-3">Total Projects</th>
                   <th className="px-6 py-3">Value</th>
                   <th className="px-6 py-3">PLGO Status</th>
                   <th className="px-6 py-3">Ministry Action</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                   <td className="px-6 py-4 font-mono text-slate-500 text-xs">LIST-2024-LSK-01</td>
                   <td className="px-6 py-4 font-medium text-slate-900">Lusaka Central</td>
                   <td className="px-6 py-4">24</td>
                   <td className="px-6 py-4">K 12.5M</td>
                   <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-bold">
                         <CheckCircle2 size={12} /> Approved
                      </span>
                   </td>
                   <td className="px-6 py-4">
                      <button className="bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-slate-800">
                         Review & Gazette
                      </button>
                   </td>
                </tr>
                <tr className="hover:bg-slate-50">
                   <td className="px-6 py-4 font-mono text-slate-500 text-xs">LIST-2024-MAT-01</td>
                   <td className="px-6 py-4 font-medium text-slate-900">Matero</td>
                   <td className="px-6 py-4">18</td>
                   <td className="px-6 py-4">K 9.2M</td>
                   <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-bold">
                         <CheckCircle2 size={12} /> Approved
                      </span>
                   </td>
                   <td className="px-6 py-4">
                      <button className="bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-slate-800">
                         Review & Gazette
                      </button>
                   </td>
                </tr>
             </tbody>
          </table>
       </div>
    </div>
  );
};

export default MinistryDashboard;