
import React, { useState } from 'react';
import { 
  HardHat, 
  FileCheck, 
  Gavel, 
  AlertTriangle,
  Calendar,
  X,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  contractor: string;
  originalBudget: number;
  currentBudget: number;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  variations: Variation[];
}

interface Variation {
  id: string;
  type: 'Cost' | 'Time' | 'Scope';
  description: string;
  amount: number;
  days: number;
  status: 'Approved' | 'Pending' | 'Rejected';
  date: string;
}

const Projects: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showVariationForm, setShowVariationForm] = useState(false);
  const [newVariation, setNewVariation] = useState({ type: 'Cost', amount: 0, days: 0, reason: '' });

  const mockProjects: Project[] = [
    { 
      id: 'PRJ-001', 
      title: 'Construction of Maternity Wing - Zone B', 
      contractor: 'BuildRight Ltd', 
      originalBudget: 450000, 
      currentBudget: 495000, 
      startDate: '2024-01-15', 
      endDate: '2024-11-30', 
      status: 'Active',
      progress: 65,
      variations: [
        { id: 'VAR-001', type: 'Cost', description: 'Foundation depth increase due to soil type', amount: 45000, days: 5, status: 'Approved', date: '2024-02-20' }
      ]
    },
    {
      id: 'PRJ-002',
      title: 'Solar Street Lighting - Kabwata Main',
      contractor: 'SunTech Zambia',
      originalBudget: 200000,
      currentBudget: 200000,
      startDate: '2024-03-01',
      endDate: '2024-06-01',
      status: 'Active',
      progress: 40,
      variations: []
    }
  ];

  // Enforcement Logic Calculator
  const getCumulativeVariation = (project: Project) => {
    const approved = project.variations
      .filter(v => v.status === 'Approved')
      .reduce((acc, curr) => acc + curr.amount, 0);
    return approved;
  };

  const getVariationPercentage = (project: Project, additionalAmount: number = 0) => {
    const totalVar = getCumulativeVariation(project) + additionalAmount;
    return (totalVar / project.originalBudget) * 100;
  };

  const getApprovalAuthority = (percentage: number) => {
    if (percentage > 25) return { label: 'Attorney General & Ministry HQ', color: 'text-red-600 bg-red-50 border-red-200' };
    if (percentage > 15) return { label: 'Provincial Permanent Secretary (PLGO)', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'Local Authority (Town Clerk)', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  };

  const ProjectModal = ({ project, onClose }: { project: Project, onClose: () => void }) => {
    const currentVarPercent = getVariationPercentage(project);
    const potentialVarPercent = getVariationPercentage(project, Number(newVariation.amount));
    const authority = getApprovalAuthority(potentialVarPercent);

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div>
                  <h3 className="font-bold text-slate-800 text-lg">{project.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    {project.id} • {project.contractor}
                  </p>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                     <p className="text-xs text-slate-500 uppercase">Original Sum</p>
                     <p className="text-xl font-bold text-slate-800 mt-1">K {project.originalBudget.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                     <p className="text-xs text-slate-500 uppercase">Current Sum</p>
                     <div className="flex items-end gap-2">
                        <p className="text-xl font-bold text-blue-600 mt-1">K {project.currentBudget.toLocaleString()}</p>
                        {currentVarPercent > 0 && (
                           <span className="text-xs font-bold text-amber-600 mb-1">+{currentVarPercent.toFixed(1)}%</span>
                        )}
                     </div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                     <p className="text-xs text-slate-500 uppercase">Timeline</p>
                     <p className="text-sm font-bold text-slate-800 mt-1">{project.startDate} to {project.endDate}</p>
                     <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                     </div>
                  </div>
               </div>

               <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                     <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp size={18} /> Variations History
                     </h4>
                     <button 
                        onClick={() => setShowVariationForm(!showVariationForm)}
                        className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 font-medium"
                     >
                        {showVariationForm ? 'Cancel Request' : 'Request Variation'}
                     </button>
                  </div>

                  {showVariationForm && (
                     <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 animate-scale-in">
                        <h5 className="font-bold text-slate-800 text-sm mb-4">New Variation Request</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                           <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                              <select 
                                 className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                 onChange={(e) => setNewVariation({...newVariation, type: e.target.value as any})}
                              >
                                 <option value="Cost">Cost (Financial)</option>
                                 <option value="Time">Time (Extension)</option>
                                 <option value="Scope">Scope Change</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">
                                 {newVariation.type === 'Time' ? 'Additional Days' : 'Additional Amount (K)'}
                              </label>
                              <input 
                                 type="number" 
                                 className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                 placeholder="0"
                                 onChange={(e) => setNewVariation({...newVariation, amount: Number(e.target.value), days: Number(e.target.value)})}
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Justification</label>
                              <input 
                                 type="text" 
                                 className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                 placeholder="Reason for change..."
                                 onChange={(e) => setNewVariation({...newVariation, reason: e.target.value})}
                              />
                           </div>
                        </div>

                        {/* Real-time Enforcement Feedback */}
                        {newVariation.amount > 0 && newVariation.type === 'Cost' && (
                           <div className={`rounded-lg p-4 border ${authority.color} flex items-start gap-3`}>
                              <AlertOctagon size={20} className="shrink-0 mt-0.5" />
                              <div>
                                 <p className="text-sm font-bold">Approval Authority Escalation</p>
                                 <p className="text-xs mt-1 opacity-90">
                                    This variation brings the cumulative increase to <span className="font-bold">{potentialVarPercent.toFixed(1)}%</span>.
                                    By statutory regulation, this requires approval from:
                                 </p>
                                 <p className="text-sm font-bold mt-2 uppercase tracking-wide">{authority.label}</p>
                              </div>
                           </div>
                        )}

                        <div className="mt-4 flex justify-end">
                           <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
                              Submit for Approval
                           </button>
                        </div>
                     </div>
                  )}

                  <div className="space-y-3">
                     {project.variations.length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center py-4">No variations recorded.</p>
                     ) : (
                        project.variations.map((v) => (
                           <div key={v.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3">
                                 <div className={`p-2 rounded-lg ${v.type === 'Cost' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {v.type === 'Cost' ? <DollarSign size={18} /> : <Clock size={18} />}
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-slate-800">{v.description}</p>
                                    <p className="text-xs text-slate-500">
                                       {v.type === 'Cost' ? `+K ${v.amount.toLocaleString()}` : `+${v.days} Days`} • {v.date}
                                    </p>
                                 </div>
                              </div>
                              <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded font-bold border border-green-100 flex items-center gap-1">
                                 <CheckCircle2 size={12} /> {v.status}
                              </span>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
       {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}

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
             <h3 className="font-bold text-slate-800">Active Projects List</h3>
          </div>
          
          <div className="space-y-4">
             {mockProjects.map((project) => (
                <div key={project.id} className="border border-slate-100 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                   <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-2">
                      <div>
                         <h4 className="font-bold text-slate-800 text-lg">{project.title}</h4>
                         <p className="text-xs text-slate-500">Contractor: {project.contractor} | End Date: {project.endDate}</p>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                            {project.status}
                         </span>
                         <button 
                            onClick={() => setSelectedProject(project)}
                            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                         >
                            Manage Variations
                         </button>
                      </div>
                   </div>
                   
                   {/* Milestones */}
                   <div className="relative mt-6 mb-2">
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full -z-10"></div>
                      <div className="flex justify-between">
                         <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                               <FileCheck size={14} />
                            </div>
                            <span className="text-[10px] font-medium text-slate-600">Site Handover</span>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${project.progress >= 30 ? 'bg-green-500' : 'bg-slate-200 text-slate-400'}`}>
                               <HardHat size={14} />
                            </div>
                            <span className="text-[10px] font-medium text-slate-600">Foundation</span>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${project.progress >= 60 ? 'bg-green-500' : 'bg-slate-200 text-slate-400'}`}>
                               3
                            </div>
                            <span className="text-[10px] font-medium text-slate-600">Roof Level</span>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${project.progress >= 90 ? 'bg-green-500' : 'bg-slate-200 text-slate-400'}`}>
                               4
                            </div>
                            <span className="text-[10px] font-medium text-slate-600">Finishes</span>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${project.progress === 100 ? 'bg-green-500' : 'bg-slate-200 text-slate-400'}`}>
                               5
                            </div>
                            <span className="text-[10px] font-medium text-slate-600">Handover</span>
                         </div>
                      </div>
                   </div>
                   
                   {/* Variation Warnings */}
                   {project.variations.length > 0 && (
                      <div className="mt-4 flex gap-2">
                         <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-100">
                            <AlertTriangle size={14} />
                            <span>{project.variations.length} Variations Recorded (+K{getCumulativeVariation(project).toLocaleString()})</span>
                         </div>
                      </div>
                   )}
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default Projects;
