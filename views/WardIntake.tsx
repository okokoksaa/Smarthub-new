
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
  ArrowRight,
  MessageSquare,
  Megaphone,
  BarChart2
} from 'lucide-react';
import DocumentUpload from '../components/DocumentUpload';

const WardIntake: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'bursaries' | 'meetings' | 'engagement'>('projects');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [completedGates, setCompletedGates] = useState<string[]>([]);
  
  // Form State
  const [projectData, setProjectData] = useState({
    title: '',
    sector: 'Education',
    beneficiaries: '',
    location: ''
  });

  const handleNewProposal = () => {
    setWizardStep(1);
    setCompletedGates([]);
    setProjectData({
      title: '',
      sector: 'Education',
      beneficiaries: '',
      location: ''
    });
    setIsModalOpen(true);
  };

  const handleUploadSuccess = (gate: string) => {
    if (!completedGates.includes(gate)) {
      setCompletedGates(prev => [...prev, gate]);
    }
  };

  const handleRemoveFile = (gate: string) => {
    setCompletedGates(prev => prev.filter(g => g !== gate));
  };

  const updateField = (field: string, value: string) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
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
                    <input 
                        type="text" 
                        value={projectData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="e.g. Construction of Market Shelter" 
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Sector</label>
                       <select 
                            value={projectData.sector}
                            onChange={(e) => updateField('sector', e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2"
                        >
                          <option>Education</option>
                          <option>Health</option>
                          <option>Water & Sanitation</option>
                          <option>Agriculture</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Est. Beneficiaries</label>
                       <input 
                            type="number" 
                            value={projectData.beneficiaries}
                            onChange={(e) => updateField('beneficiaries', e.target.value)}
                            placeholder="0" 
                            className="w-full border border-slate-300 rounded-lg px-4 py-2" 
                        />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Project Location</label>
                    <div className="flex gap-2">
                       <input 
                            type="text" 
                            value={projectData.location}
                            onChange={(e) => updateField('location', e.target.value)}
                            placeholder="Search map location..." 
                            className="flex-1 border border-slate-300 rounded-lg px-4 py-2" 
                        />
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

                 <div className="space-y-4">
                    <DocumentUpload 
                       label="Community Meeting Minutes"
                       description="Minutes signed by WDC Chair & Secretary (PDF Only)"
                       acceptedTypes={['application/pdf']}
                       isUploaded={completedGates.includes('minutes')}
                       onUploadComplete={() => handleUploadSuccess('minutes')}
                       onRemove={() => handleRemoveFile('minutes')}
                    />

                    <DocumentUpload 
                       label="Proof of Land Availability"
                       description="Council Letter or Chief's Consent (PDF/Image)"
                       acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']}
                       isUploaded={completedGates.includes('land')}
                       onUploadComplete={() => handleUploadSuccess('land')}
                       onRemove={() => handleRemoveFile('land')}
                    />

                    <DocumentUpload 
                       label="Bill of Quantities (BOQ)"
                       description="Preliminary Estimates / Costing (PDF/Excel)"
                       acceptedTypes={['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']}
                       isUploaded={completedGates.includes('boq')}
                       onUploadComplete={() => handleUploadSuccess('boq')}
                       onRemove={() => handleRemoveFile('boq')}
                    />
                 </div>
              </div>
           )}

           {wizardStep === 3 && (
              <div className="text-center py-8 animate-scale-in">
                 <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800">Ready to Submit</h3>
                 <p className="text-slate-500 max-w-md mx-auto mt-2 text-sm">
                    This proposal will be hashed and timestamped. Once submitted, it cannot be modified without a formal variation request.
                 </p>
                 
                 <div className="mt-6 bg-slate-50 p-5 rounded-xl text-left text-sm border border-slate-200 max-w-sm mx-auto space-y-3">
                    <div className="border-b border-slate-200 pb-3 mb-3">
                        <h4 className="font-bold text-slate-800 mb-2">Proposal Summary</h4>
                        <div className="grid grid-cols-3 gap-y-2 text-xs">
                            <span className="text-slate-500">Title:</span>
                            <span className="col-span-2 font-medium text-slate-900">{projectData.title || 'Untitled'}</span>
                            
                            <span className="text-slate-500">Sector:</span>
                            <span className="col-span-2 font-medium text-slate-900">{projectData.sector}</span>
                            
                            <span className="text-slate-500">Location:</span>
                            <span className="col-span-2 font-medium text-slate-900">{projectData.location || 'Not specified'}</span>
                            
                            <span className="text-slate-500">Beneficiaries:</span>
                            <span className="col-span-2 font-medium text-slate-900">{projectData.beneficiaries || '0'}</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-between">
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
              disabled={
                (wizardStep === 1 && !projectData.title) ||
                (wizardStep === 2 && completedGates.length < 3)
              }
              className={`px-6 py-2 font-bold rounded-lg flex items-center gap-2 transition-all ${
                ((wizardStep === 1 && !projectData.title) || (wizardStep === 2 && completedGates.length < 3))
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
      <div className="border-b border-slate-200 flex gap-6 flex-wrap">
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
          WDC Meetings
        </button>
        <button 
          onClick={() => setActiveTab('engagement')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'engagement' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Community Engagement
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
            
            {/* Using the new component here as well */}
            <div className="w-full max-w-md">
                <DocumentUpload 
                   label="WDC Meeting Minutes"
                   acceptedTypes={['application/pdf']}
                   onUploadComplete={() => console.log("Minutes Uploaded")}
                   onRemove={() => console.log("Minutes Removed")}
                />
            </div>
         </div>
      )}
      
      {activeTab === 'engagement' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Community Polls */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <BarChart2 size={18} className="text-blue-600" /> Active Polls
                 </h3>
                 <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Live</span>
              </div>
              <div className="p-6 space-y-6">
                 <div>
                    <h4 className="font-bold text-slate-800 mb-2">Priority Project Sector for 2025</h4>
                    <p className="text-xs text-slate-500 mb-4">Ends in 5 days • 450 Votes cast</p>
                    <div className="space-y-3">
                       <div>
                          <div className="flex justify-between text-xs mb-1">
                             <span className="font-medium text-slate-700">Water & Sanitation</span>
                             <span className="font-bold text-blue-600">55%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                             <div className="bg-blue-600 h-2 rounded-full w-[55%]"></div>
                          </div>
                       </div>
                       <div>
                          <div className="flex justify-between text-xs mb-1">
                             <span className="font-medium text-slate-700">Roads & Drainage</span>
                             <span className="font-bold text-slate-600">30%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                             <div className="bg-slate-400 h-2 rounded-full w-[30%]"></div>
                          </div>
                       </div>
                       <div>
                          <div className="flex justify-between text-xs mb-1">
                             <span className="font-medium text-slate-700">Education</span>
                             <span className="font-bold text-slate-600">15%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                             <div className="bg-slate-400 h-2 rounded-full w-[15%]"></div>
                          </div>
                       </div>
                    </div>
                 </div>
                 <button className="w-full py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Create New Poll
                 </button>
              </div>
           </div>

           {/* Notices */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Megaphone size={18} className="text-amber-600" /> Public Notices
                 </h3>
                 <button className="text-sm text-blue-600 hover:underline">View Archive</button>
              </div>
              <div className="divide-y divide-slate-100">
                 <div className="p-6 hover:bg-slate-50">
                    <div className="flex gap-3">
                       <div className="mt-1 p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                          <MessageSquare size={20} />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800">Town Hall Meeting: Zone 4</h4>
                          <p className="text-sm text-slate-600 mt-1">
                             Discussion of proposed market shelter location. All residents invited.
                          </p>
                          <div className="flex gap-4 mt-3 text-xs text-slate-500 font-medium">
                             <span>Sat, Nov 2 @ 10:00 AM</span>
                             <span>Community Hall</span>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="p-6 hover:bg-slate-50">
                    <div className="flex gap-3">
                       <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                          <FileText size={20} />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800">Bursary Application Deadline Extended</h4>
                          <p className="text-sm text-slate-600 mt-1">
                             Submission deadline extended to Friday due to holiday.
                          </p>
                          <div className="flex gap-4 mt-3 text-xs text-slate-500 font-medium">
                             <span>New Date: Nov 08</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-4 border-t border-slate-100">
                 <button className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
                    Publish New Notice
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WardIntake;
