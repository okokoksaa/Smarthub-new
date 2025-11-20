import React from 'react';
import { 
  HardHat, 
  FileCheck, 
  Gavel, 
  AlertTriangle,
  Calendar
} from 'lucide-react';

const Projects: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Project Lifecycle Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="border border-slate-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-all">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <FileCheck size={20} />
                   </div>
                   <h3 className="font-bold text-slate-800">Procurement Plans</h3>
                </div>
                <p className="text-sm text-slate-500">4 Approved Plans</p>
                <p className="text-sm text-slate-500">1 Pending Ministry Approval</p>
             </div>
             <div className="border border-slate-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-all">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                      <Gavel size={20} />
                   </div>
                   <h3 className="font-bold text-slate-800">Tenders & Bids</h3>
                </div>
                <p className="text-sm text-slate-500">2 Active Tenders</p>
                <p className="text-sm text-slate-500">Bids open in 4 days</p>
             </div>
             <div className="border border-slate-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-all">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                      <HardHat size={20} />
                   </div>
                   <h3 className="font-bold text-slate-800">Active Works</h3>
                </div>
                <p className="text-sm text-slate-500">14 Sites Active</p>
                <p className="text-sm text-slate-500">3 Approaching PC</p>
             </div>
          </div>
       </div>

       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-800">Milestone Tracking</h3>
             <button className="text-blue-600 text-sm font-medium">View All Projects</button>
          </div>
          
          <div className="space-y-6">
             {/* Project Item */}
             <div className="border border-slate-100 rounded-lg p-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-2">
                   <div>
                      <h4 className="font-bold text-slate-800">Construction of Maternity Wing - Zone B</h4>
                      <p className="text-xs text-slate-500">Contractor: BuildRight Ltd | End Date: Nov 30, 2024</p>
                   </div>
                   <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold self-start">
                      On Track
                   </span>
                </div>
                
                {/* Milestones */}
                <div className="relative">
                   <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full -z-10"></div>
                   <div className="flex justify-between">
                      <div className="flex flex-col items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                            <FileCheck size={14} />
                         </div>
                         <span className="text-[10px] font-medium text-slate-600">Site Handover</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                            <HardHat size={14} />
                         </div>
                         <span className="text-[10px] font-medium text-slate-600">Foundation</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs ring-4 ring-blue-100">
                            3
                         </div>
                         <span className="text-[10px] font-bold text-blue-600">Roof Level</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs">
                            4
                         </div>
                         <span className="text-[10px] font-medium text-slate-400">Finishes</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs">
                            5
                         </div>
                         <span className="text-[10px] font-medium text-slate-400">Handover</span>
                      </div>
                   </div>
                </div>
                
                <div className="mt-6 flex gap-2">
                   <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-100">
                      <AlertTriangle size={14} />
                      <span>Variation Request Pending: Foundation depth increase (+K45,000)</span>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Projects;