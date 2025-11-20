import React, { useState } from 'react';
import { 
  Plus, 
  FileText, 
  Users, 
  MapPin, 
  UploadCloud, 
  Check,
  ChevronRight,
  X,
  AlertCircle,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

const WardIntake: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'bursaries' | 'meetings'>('projects');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [completedGates, setCompletedGates] = useState<string[]>([]);

  const handleNewProposal = () => {
    setWizardStep(1);
    setCompletedGates([]);
    setIsModalOpen(true);
  };

  const toggleGate = (gate: string) => {
    if (completedGates.includes(gate)) {
      setCompletedGates(prev => prev.filter(g => g !== gate));
    } else {
      setCompletedGates(prev => [...prev, gate]);
    }
  };

  const ProposalWizard = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
             <h3 className="font-bold text-slate-800 text-lg">New Community Project Proposal</h3>
             <p className="text-xs text-slate-500">Ward: Kabwata • Year: 2024</p>
          </div>
          <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
             <X size={20} />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 pt-6 pb-2">
           <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center gap-2 text-sm font-bold ${wizardStep >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                 <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${wizardStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>1</span>
                 Details
              </div>
              <div className={`h-0.5 flex-1 mx-4 ${wizardStep >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <div className={`flex items-center gap-2 text-sm font-bold ${wizardStep >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
                 <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${wizardStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>2</span>
                 Compliance Gates
              </div>
              <div className={`h-0.5 flex-1 mx-4 ${wizardStep >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <div className={`flex items-center gap-2 text-sm font-bold ${wizardStep >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
                 <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${wizardStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>3</span>
                 Review
              </div>
           </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
           {wizardStep === 1 && (
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Project Title</label>
                    <input type="text" placeholder="e.g. Construction of Market Shelter" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Sector</label>
                       <select className="w-full border border-slate-300 rounded-lg px-4 py-2">
                          <option>Education</option>
                          <option>Health</option>
                          <option>Water & Sanitation</option>
                          <option>Agriculture</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Est. Beneficiaries</label>
                       <input type="number" placeholder="0" className="w-full border border-slate-300 rounded-lg px-4 py-2" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Project Location</label>
                    <div className="flex gap-2">
                       <input type="text" placeholder="Search map location..." className="flex-1 border border-slate-300 rounded-lg px-4 py-2" />
                       <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-200 flex items-center gap-2">
                          <MapPin size={18} /> Pin
                       </button>
                    </div>
                 </div>
              </div>
           )}

           {wizardStep === 2 && (
              <div className="space-y-6">
                 <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="text-amber-600 shrink-0" size={20} />
                    <div>
                       <h4 className="font-bold text-amber-800 text-sm">Enforcement Gate Active</h4>
                       <p className="text-xs text-amber-700 mt-1">
                          Per CDF Guidelines Sec 4.2, you cannot proceed without uploading the following mandatory artifacts.
                       </p>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div 
                      onClick={() => toggleGate('minutes')}
                      className={`border rounded-lg p-4 transition-all cursor-pointer group ${completedGates.includes('minutes') ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-400'}`}
                    >
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded group-hover:bg-blue-50 group-hover:text-blue-600 ${completedGates.includes('minutes') ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                {completedGates.includes('minutes') ? <Check size={20} /> : <FileText size={20} />}
                             </div>
                             <div>
                                <p className="font-bold text-slate-700 text-sm">Community Meeting Minutes</p>
                                <p className="text-xs text-slate-500">Signed by WDC Chair & Secretary</p>
                             </div>
                          </div>
                          <button className={`text-xs px-3 py-1.5 rounded font-medium border ${completedGates.includes('minutes') ? 'bg-white text-green-600 border-green-200' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                             {completedGates.includes('minutes') ? 'Uploaded' : 'Upload PDF'}
                          </button>
                       </div>
                    </div>

                    <div 
                      onClick={() => toggleGate('land')}
                      className={`border rounded-lg p-4 transition-all cursor-pointer group ${completedGates.includes('land') ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-400'}`}
                    >
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded group-hover:bg-blue-50 group-hover:text-blue-600 ${completedGates.includes('land') ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                {completedGates.includes('land') ? <Check size={20} /> : <MapPin size={20} />}
                             </div>
                             <div>
                                <p className="font-bold text-slate-700 text-sm">Proof of Land Availability</p>
                                <p className="text-xs text-slate-500">Council Letter or Chief's Consent</p>
                             </div>
                          </div>
                          <button className={`text-xs px-3 py-1.5 rounded font-medium border ${completedGates.includes('land') ? 'bg-white text-green-600 border-green-200' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                             {completedGates.includes('land') ? 'Uploaded' : 'Upload PDF'}
                          </button>
                       </div>
                    </div>

                    <div 
                      onClick={() => toggleGate('boq')}
                      className={`border rounded-lg p-4 transition-all cursor-pointer group ${completedGates.includes('boq') ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-400'}`}
                    >
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded group-hover:bg-blue-50 group-hover:text-blue-600 ${completedGates.includes('boq') ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                {completedGates.includes('boq') ? <Check size={20} /> : <ShieldCheck size={20} />}
                             </div>
                             <div>
                                <p className="font-bold text-slate-700 text-sm">Bill of Quantities (BOQ)</p>
                                <p className="text-xs text-slate-500">Preliminary Estimates</p>
                             </div>
                          </div>
                          <button className={`text-xs px-3 py-1.5 rounded font-medium border ${completedGates.includes('boq') ? 'bg-white text-green-600 border-green-200' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                             {completedGates.includes('boq') ? 'Uploaded' : 'Upload PDF'}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {wizardStep === 3 && (
              <div className="text-center py-8 animate-scale-in">
                 <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800">Ready to Submit</h3>
                 <p className="text-slate-500 max-w-md mx-auto mt-2">
                    This proposal will be hashed and timestamped. Once submitted, it cannot be modified without a formal variation request.
                 </p>
                 <div className="mt-6 bg-slate-50 p-4 rounded-lg text-left text-sm border border-slate-200 max-w-sm mx-auto">
                    <div className="flex justify-between mb-1">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-bold text-blue-600">Pending CDFC Review</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Artifacts:</span>
                        <span className="font-bold text-green-600">3/3 Verified</span>
                    </div>
                 </div>
              </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
           {wizardStep > 1 && (
              <button 
                 onClick={() => setWizardStep(prev => prev - 1)}
                 className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg"
              >
                 Back
              </button>
           )}
           <button 
              onClick={() => {
                 if (wizardStep < 3) setWizardStep(prev => prev + 1);
                 else setIsModalOpen(false);
              }}
              disabled={wizardStep === 2 && completedGates.length < 3}
              className={`px-6 py-2 font-bold rounded-lg flex items-center gap-2 transition-all ${
                wizardStep === 2 && completedGates.length < 3 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
              }`}
           >
              {wizardStep === 3 ? 'Submit Proposal' : 'Next Step'}
              {wizardStep < 3 && <ArrowRight size={16} />}
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      {isModalOpen && <ProposalWizard />}
      
      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        <button 
          onClick={() => setActiveTab('projects')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'projects' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Project Proposals
        </button>
        <button 
          onClick={() => setActiveTab('bursaries')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'bursaries' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Bursary Intake
        </button>
        <button 
          onClick={() => setActiveTab('meetings')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'meetings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          WDC Meetings & Minutes
        </button>
      </div>

      {/* Content */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-bold text-slate-800 text-lg">Community Project Intake</h2>
                  <p className="text-sm text-slate-500">Submit new project proposals for CDFC consideration.</p>
                </div>
                <button 
                  onClick={handleNewProposal}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-all transform hover:scale-105"
                >
                  <Plus size={16} /> New Proposal
                </button>
              </div>

              {/* Mock List of Proposals */}
              <div className="space-y-4">
                 {[1, 2, 3].map((item) => (
                   <div key={item} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
                      <div className="flex justify-between items-start">
                         <div className="flex gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                               <FileText size={20} />
                            </div>
                            <div>
                               <h4 className="font-semibold text-slate-800">Borehole Drilling - Zone 4</h4>
                               <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                  <MapPin size={12} /> Kabwata Ward | <Users size={12} /> 150 Beneficiaries
                               </p>
                            </div>
                         </div>
                         <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-100">
                            Pending WDC Sign-off
                         </span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                         <div className="text-xs text-slate-500">Submitted: Oct 24, 2024</div>
                         <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] text-blue-600">AB</div>
                            <div className="w-6 h-6 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-[10px] text-green-600">CD</div>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          {/* Helper/Rules Side */}
          <div className="space-y-6">
             <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <h3 className="font-bold text-blue-800 mb-2">Submission Requirements</h3>
                <ul className="space-y-2 text-sm text-blue-700">
                   <li className="flex items-start gap-2">
                      <Check size={14} className="mt-1" /> Community Request Form
                   </li>
                   <li className="flex items-start gap-2">
                      <Check size={14} className="mt-1" /> Initial Cost Estimate
                   </li>
                   <li className="flex items-start gap-2">
                      <Check size={14} className="mt-1" /> Land availability confirmation
                   </li>
                   <li className="flex items-start gap-2 opacity-50">
                      <Check size={14} className="mt-1" /> WDC Meeting Minutes (Required for forwarding)
                   </li>
                </ul>
             </div>

             <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-bold text-slate-800 mb-4">WDC Stats</h3>
                <div className="space-y-4">
                   <div>
                      <div className="flex justify-between text-xs mb-1">
                         <span className="text-slate-500">Q4 Submission Quota</span>
                         <span className="font-medium text-slate-800">3/10 Projects</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full w-[30%] bg-green-500 rounded-full"></div>
                      </div>
                   </div>
                   <div>
                      <div className="flex justify-between text-xs mb-1">
                         <span className="text-slate-500">Bursary Applications</span>
                         <span className="font-medium text-slate-800">145 verified</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full w-[75%] bg-blue-500 rounded-full"></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'meetings' && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-slate-50 rounded-full mb-4">
               <UploadCloud size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Upload Meeting Minutes</h3>
            <p className="text-slate-500 max-w-md mt-2 mb-6">
               Projects cannot be forwarded to CDFC without signed minutes from a quorate WDC meeting. The system will verify the chairperson's signature.
            </p>
            <button className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors">
               Select PDF File
            </button>
         </div>
      )}
    </div>
  );
};

export default WardIntake;