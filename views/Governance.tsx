
import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  CheckSquare, 
  FileWarning, 
  Gavel,
  Check,
  X,
  AlertCircle,
  Clock,
  FileText,
  ShieldCheck,
  UserCheck,
  ArrowRight
} from 'lucide-react';

const Governance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'meetings' | 'coi' | 'voting' | 'tac'>('meetings');
  const [hasDeclared, setHasDeclared] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-6">
        <button 
          onClick={() => setActiveTab('meetings')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'meetings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Meeting Scheduler & Agenda
        </button>
        <button 
          onClick={() => setActiveTab('coi')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'coi' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Conflict of Interest (COI)
        </button>
        <button 
          onClick={() => setActiveTab('voting')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'voting' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Prioritization & Voting
        </button>
        <button 
          onClick={() => setActiveTab('tac')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'tac' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Technical Appraisal (TAC)
        </button>
      </div>

      {/* Meetings Tab */}
      {activeTab === 'meetings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-slate-800">Upcoming Meetings</h2>
                <button className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  <Calendar size={16} /> Schedule New
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl p-4 hover:border-blue-400 transition-all cursor-pointer bg-blue-50/30">
                  <div className="flex justify-between items-start">
                     <div>
                        <h3 className="font-bold text-slate-800">Q4 Project Appraisal Review</h3>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                           <Clock size={14} /> Oct 28, 09:00 AM • Main Council Chamber
                        </p>
                     </div>
                     <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Confirmed</span>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                     <div className="flex -space-x-2">
                        {[1,2,3,4,5,6,7].map(i => (
                           <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600">
                              {String.fromCharCode(64 + i)}
                           </div>
                        ))}
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white border-2 border-white flex items-center justify-center text-xs font-medium">
                           +3
                        </div>
                     </div>
                     <div className="text-sm font-medium text-green-600 flex items-center gap-1">
                        <Check size={16} /> Quorum Met (10/12)
                     </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 hover:border-blue-400 transition-all cursor-pointer opacity-75">
                  <div className="flex justify-between items-start">
                     <div>
                        <h3 className="font-bold text-slate-800">Bursary Committee Selection</h3>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                           <Clock size={14} /> Nov 02, 10:00 AM • Virtual
                        </p>
                     </div>
                     <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">Tentative</span>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                     <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                           <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600">
                              {String.fromCharCode(64 + i)}
                           </div>
                        ))}
                     </div>
                     <div className="text-sm font-medium text-amber-600 flex items-center gap-1">
                        <AlertCircle size={16} /> Quorum Pending (3/12)
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
             <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-bold text-slate-800 mb-4">Statutory Rules</h3>
                <ul className="space-y-3 text-sm">
                   <li className="flex gap-3 text-slate-600">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                      <span>Quorum is mandatory: at least 50% of members (6 members) must be present.</span>
                   </li>
                   <li className="flex gap-3 text-slate-600">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">2</div>
                      <span>Agenda must be circulated 7 working days prior to ordinary meetings.</span>
                   </li>
                </ul>
             </div>
          </div>
        </div>
      )}

      {/* COI Tab */}
      {activeTab === 'coi' && (
         <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="text-center mb-8">
               <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                  <FileWarning size={32} />
               </div>
               <h2 className="text-xl font-bold text-slate-800">Conflict of Interest Declaration</h2>
               <p className="text-slate-500 mt-2">
                  For Agenda Item: <span className="font-semibold text-slate-900">Selection of Contractors for Zone B Roads</span>
               </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
               <p className="text-sm text-slate-700 leading-relaxed mb-4">
                  I, <span className="font-bold">Jane Doe</span>, hereby declare that I have no pecuniary or other interest, direct or indirect, in any of the companies bidding for the above-mentioned project, except as stated below. I understand that failure to disclose such interest is a violation of the CDF Act.
               </p>
               <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="declare" 
                    checked={hasDeclared}
                    onChange={(e) => setHasDeclared(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" 
                  />
                  <label htmlFor="declare" className="text-sm font-medium text-slate-900 select-none">
                     I declare that the information provided is true and complete.
                  </label>
               </div>
            </div>

            <div className="flex justify-center">
               <button 
                 disabled={!hasDeclared}
                 className={`px-8 py-3 rounded-lg font-bold text-white transition-all ${
                    hasDeclared 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200' 
                    : 'bg-slate-300 cursor-not-allowed'
                 }`}
               >
                  Sign & Submit Declaration
               </button>
            </div>
         </div>
      )}

      {/* Voting Tab */}
      {activeTab === 'voting' && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <div>
                  <h2 className="font-bold text-slate-800">Project Prioritization Ranking</h2>
                  <p className="text-xs text-slate-500 mt-1">Session ID: SES-2024-10-28</p>
               </div>
               <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-green-600 font-bold flex items-center gap-1"><Users size={14} /> Voting Open</span>
               </div>
            </div>
            
            <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                     <th className="px-6 py-3">Rank</th>
                     <th className="px-6 py-3">Project Name</th>
                     <th className="px-6 py-3">Ward</th>
                     <th className="px-6 py-3">Est. Cost</th>
                     <th className="px-6 py-3">Votes</th>
                     <th className="px-6 py-3">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {[
                     { r: 1, n: 'Chibolya Clinic Expansion', w: 'Chibolya', c: 'K1.2M', v: 8 },
                     { r: 2, n: 'Market Shelter Rehab', w: 'Kamwala', c: 'K450k', v: 6 },
                     { r: 3, n: 'Youth Skills Center Equipment', w: 'Kabwata', c: 'K250k', v: 5 },
                  ].map((item) => (
                     <tr key={item.r} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-400">#{item.r}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{item.n}</td>
                        <td className="px-6 py-4 text-slate-600">{item.w}</td>
                        <td className="px-6 py-4 font-mono text-slate-600">{item.c}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-1 text-blue-600 font-bold">
                              {item.v} <Users size={12} />
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors" title="Vote Up">
                              <Gavel size={18} />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            <div className="p-4 bg-amber-50 border-t border-amber-100 text-center">
               <p className="text-xs text-amber-800 font-medium">
                  Voting is legally binding. Ensure all COI declarations are filed before casting votes.
               </p>
            </div>
         </div>
      )}

      {/* TAC Appraisal Tab */}
      {activeTab === 'tac' && (
         <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-slate-900 text-white p-6 rounded-xl flex justify-between items-center">
               <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                     <ShieldCheck size={24} className="text-green-400" /> Technical Appraisal Committee
                  </h2>
                  <p className="text-slate-400 mt-1">
                     Enforcing the "Two-Reviewer Rule". Projects are blocked from PLGO submission until two independent technical appraisals are filed.
                  </p>
               </div>
               <div className="flex gap-3">
                  <div className="text-right">
                     <p className="text-xs text-slate-400 uppercase">Pending Review</p>
                     <p className="text-2xl font-bold">4</p>
                  </div>
                  <div className="w-px bg-slate-700"></div>
                  <div className="text-right">
                     <p className="text-xs text-slate-400 uppercase">Ready for PLGO</p>
                     <p className="text-2xl font-bold text-green-400">2</p>
                  </div>
               </div>
            </div>

            {/* Appraisal List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                     <tr>
                        <th className="px-6 py-3">Project Ref</th>
                        <th className="px-6 py-3">Project Name</th>
                        <th className="px-6 py-3">Technical Docs</th>
                        <th className="px-6 py-3">Reviewer 1</th>
                        <th className="px-6 py-3">Reviewer 2</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {[
                        { id: 'PRJ-088', name: 'Drainage System - Zone 4', docs: true, r1: 'Done', r2: 'Pending', status: 'In Progress' },
                        { id: 'PRJ-091', name: 'Maternity Wing Expansion', docs: true, r1: 'Done', r2: 'Done', status: 'Ready' },
                        { id: 'PRJ-095', name: 'Solar Street Lights Ph2', docs: false, r1: 'Pending', r2: 'Pending', status: 'Blocked' },
                     ].map((project) => (
                        <tr key={project.id} className="hover:bg-slate-50">
                           <td className="px-6 py-4 font-mono text-slate-500 text-xs">{project.id}</td>
                           <td className="px-6 py-4 font-medium text-slate-900">{project.name}</td>
                           <td className="px-6 py-4">
                              {project.docs ? (
                                 <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded border border-green-100">
                                    <FileText size={12} /> SoR/BOQ/Drawings
                                 </span>
                              ) : (
                                 <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded border border-red-100">
                                    <X size={12} /> Missing Docs
                                 </span>
                              )}
                           </td>
                           <td className="px-6 py-4">
                              {project.r1 === 'Done' ? (
                                 <span className="flex items-center gap-1 text-green-600 font-medium text-xs">
                                    <UserCheck size={14} /> Eng. Mumba
                                 </span>
                              ) : (
                                 <span className="text-slate-400 text-xs italic">Pending Assign</span>
                              )}
                           </td>
                           <td className="px-6 py-4">
                              {project.r2 === 'Done' ? (
                                 <span className="flex items-center gap-1 text-green-600 font-medium text-xs">
                                    <UserCheck size={14} /> Arc. Phiri
                                 </span>
                              ) : (
                                 <span className="text-slate-400 text-xs italic">Pending Assign</span>
                              )}
                           </td>
                           <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                 project.status === 'Ready' ? 'bg-green-50 text-green-700' :
                                 project.status === 'Blocked' ? 'bg-red-50 text-red-700' :
                                 'bg-blue-50 text-blue-700'
                              }`}>
                                 {project.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button 
                                disabled={project.status === 'Blocked'}
                                className={`text-xs font-medium px-3 py-1.5 rounded border transition-colors ${
                                   project.status === 'Ready' 
                                   ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
                                   : project.status === 'Blocked'
                                   ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                   : 'bg-white text-blue-600 border-slate-200 hover:bg-blue-50'
                                }`}
                              >
                                 {project.status === 'Ready' ? 'Fwd to PLGO' : 'Appraise'}
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      )}
    </div>
  );
};

export default Governance;
