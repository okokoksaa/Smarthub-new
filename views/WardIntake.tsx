
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
  BarChart2,
  Navigation,
  Calendar,
  Clock,
  GraduationCap
} from 'lucide-react';
import DocumentUpload from '../components/DocumentUpload';

const WardIntake: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'bursaries' | 'meetings' | 'engagement'>('projects');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
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

  const MapPicker = () => (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
       <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <div>
                <h3 className="font-bold text-slate-800">Pin Project Location</h3>
                <p className="text-xs text-slate-500">Click on the map to set coordinates</p>
             </div>
             <button onClick={() => setShowMapPicker(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                <X size={20} />
             </button>
          </div>
          <div 
            className="flex-1 bg-slate-100 relative cursor-crosshair group overflow-hidden"
            onClick={() => {
                updateField('location', 'Plot 4022, Chalala Main Rd (-15.42, 28.33)');
                setShowMapPicker(false);
            }}
          >
             {/* Simulated Map Background */}
             <div className="absolute inset-0 bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)] bg-[size:20px_20px] opacity-50"></div>
             
             {/* Map Content Simulation */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6 bg-white/80 backdrop-blur rounded-xl border border-slate-200 shadow-sm pointer-events-none">
                   <Navigation size={40} className="mx-auto text-blue-600 mb-2 opacity-50" />
                   <p className="font-bold text-slate-700">Interactive Map View</p>
                   <p className="text-xs text-slate-500">Click anywhere to drop pin</p>
                </div>
             </div>
             
             {/* Hover Effect */}
             <div className="hidden group-hover:flex absolute top-4 left-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-full shadow-lg items-center gap-2">
                <MapPin size={12} /> Pin Location
             </div>
          </div>
       </div>
    </div>
  );

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
                            placeholder="Search map location or enter address..." 
                            className="flex-1 border border-slate-300 rounded-lg px-4 py-2" 
                        />
                       <button 
                          onClick={() => setShowMapPicker(true)}
                          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center gap-2 font-medium"
                       >
                          <MapPin size={18} /> Pin on Map
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
      {showMapPicker && <MapPicker />}
      
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

      {/* Projects Content */}
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
                                  <MapPin size={12} /> Kabwata Ward | <Users size={12} /> 1,200 Beneficiaries
                               </p>
                            </div>
                         </div>
                         <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">Pending Review</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                         <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 flex items-center gap-1">
                            <Check size={10} /> Minutes
                         </span>
                         <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 flex items-center gap-1">
                            <Check size={10} /> BOQ
                         </span>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
             <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-lg">
                <ShieldCheck size={32} className="text-blue-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">Ward Guidelines</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                   Projects must be approved by the WDC before submission to CDFC. Ensure community minutes are signed by the Chairperson and Secretary.
                </p>
                <button className="w-full bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg py-2 text-sm font-medium transition-colors">
                   Download Templates
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Bursaries Content */}
      {activeTab === 'bursaries' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h2 className="font-bold text-slate-800 text-lg">Bursary Intake & Verification</h2>
                  <p className="text-sm text-slate-500">Verify residency for constituency applicants.</p>
               </div>
               <div className="flex gap-2">
                  <button className="border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-2">
                     <UploadCloud size={16} /> Bulk Upload
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 font-medium">
                     Verify Selected
                  </button>
               </div>
            </div>
            
            <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                     <th className="px-6 py-3"><input type="checkbox" className="rounded" /></th>
                     <th className="px-6 py-3">Applicant</th>
                     <th className="px-6 py-3">Institution</th>
                     <th className="px-6 py-3">Residency Proof</th>
                     <th className="px-6 py-3">Status</th>
                     <th className="px-6 py-3 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {[1, 2, 3].map((i) => (
                     <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4"><input type="checkbox" className="rounded" /></td>
                        <td className="px-6 py-4">
                           <div className="font-medium text-slate-900">Applicant {i}</div>
                           <div className="text-xs text-slate-500">NRC: 123456/10/1</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-slate-700">
                              <GraduationCap size={16} className="text-slate-400" />
                              University of Zambia
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">
                              <Check size={12} /> Verified (Chief)
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-bold">Pending WDC</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="text-blue-600 hover:underline font-medium text-xs">Review Details</button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WDC Meetings Content */}
      {activeTab === 'meetings' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-slate-800 text-lg">Meeting Scheduler</h2>
                  <button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800">
                     + Schedule
                  </button>
               </div>
               <div className="space-y-4">
                  <div className="border-l-4 border-blue-600 bg-blue-50 p-4 rounded-r-lg">
                     <h3 className="font-bold text-blue-900">Q4 Project Prioritization</h3>
                     <p className="text-sm text-blue-700 mt-1 flex items-center gap-2">
                        <Calendar size={14} /> Oct 30, 2024 • 14:00 hrs
                     </p>
                     <p className="text-xs text-blue-600 mt-2">Agenda: Review of Zone 4 submissions.</p>
                  </div>
                  <div className="border border-slate-200 p-4 rounded-lg opacity-60">
                     <h3 className="font-bold text-slate-700">Monthly Review</h3>
                     <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        <Calendar size={14} /> Sep 28, 2024 • Held
                     </p>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h2 className="font-bold text-slate-800 text-lg mb-4">Upload Minutes</h2>
               <div className="space-y-4">
                  <DocumentUpload 
                     label="Signed Minutes (Last Meeting)"
                     description="Must include attendance register"
                     acceptedTypes={['application/pdf']}
                     onUploadComplete={() => {}}
                     onRemove={() => {}}
                  />
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                     <h4 className="font-bold text-slate-700 mb-2">Quorum Check</h4>
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-500">Members Present</span>
                        <span className="font-bold text-slate-900">8 / 10</span>
                     </div>
                     <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full w-[80%]"></div>
                     </div>
                     <p className="text-xs text-green-600 mt-2 font-bold flex items-center gap-1">
                        <Check size={12} /> Quorum Met (Min 50%)
                     </p>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Engagement Content */}
      {activeTab === 'engagement' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <Megaphone className="text-blue-600" size={20} /> Digital Notices
               </h2>
               <div className="space-y-4">
                  <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-400 cursor-pointer transition-colors">
                     <div className="flex justify-between">
                        <h4 className="font-bold text-slate-800">Call for Applications (2025)</h4>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Active</span>
                     </div>
                     <p className="text-sm text-slate-500 mt-1">Posted: Oct 20 • Expires: Nov 30</p>
                     <div className="mt-3 flex gap-2 text-xs font-medium text-blue-600">
                        <span>142 Views</span> • <span>12 Shares</span>
                     </div>
                  </div>
                  <button className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 font-medium">
                     + Post New Notice
                  </button>
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <BarChart2 className="text-purple-600" size={20} /> Community Polls
               </h2>
               <div className="space-y-6">
                  <div>
                     <p className="font-medium text-slate-800 mb-2">Priority for Zone 2?</p>
                     <div className="space-y-2">
                        <div>
                           <div className="flex justify-between text-xs mb-1">
                              <span>Road Grading</span>
                              <span className="font-bold">65%</span>
                           </div>
                           <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className="bg-purple-600 h-2 rounded-full w-[65%]"></div>
                           </div>
                        </div>
                        <div>
                           <div className="flex justify-between text-xs mb-1">
                              <span>Street Lights</span>
                              <span className="font-bold">35%</span>
                           </div>
                           <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className="bg-purple-300 h-2 rounded-full w-[35%]"></div>
                           </div>
                        </div>
                     </div>
                     <p className="text-xs text-slate-400 mt-2">1,024 Votes • SMS & App</p>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default WardIntake;
