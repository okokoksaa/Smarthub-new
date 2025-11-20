
import React from 'react';
import { 
  Scale, 
  FileText, 
  Search,
  Link as LinkIcon
} from 'lucide-react';

const Legal: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Scale size={28} className="text-slate-700" /> Legal & Compliance
         </h1>
         <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-800">
            <FileText size={16} /> Draft New Contract
         </button>
      </div>

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
    </div>
  );
};

export default Legal;