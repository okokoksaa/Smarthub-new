
import React, { useState } from 'react';
import { 
  MapPin, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Globe,
  Navigation,
  Shield,
  Map as MapIcon,
  Loader2
} from 'lucide-react';
import DocumentUpload from '../components/DocumentUpload';

const MonitoringEvaluation: React.FC = () => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'success' | 'fail'>('idle');
  const [distance, setDistance] = useState<number | null>(null);

  // Mock function to simulate GPS verification against project geofence
  const verifyLocation = () => {
    setGpsStatus('locating');
    setTimeout(() => {
      // Simulate a random distance calculation
      const simDistance = Math.floor(Math.random() * 300); // 0 to 300 meters
      setDistance(simDistance);
      
      // Geofence radius is 200m
      if (simDistance <= 200) {
        setGpsStatus('success');
      } else {
        setGpsStatus('fail');
      }
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Log Visit Modal */}
      {showLogModal && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                     <h3 className="font-bold text-slate-800 text-lg">Log Site Visit</h3>
                     <p className="text-xs text-slate-500">M&E Report Capture</p>
                  </div>
                  <button onClick={() => setShowLogModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                     <X size={20} />
                  </button>
               </div>

               <div className="p-6 space-y-6 overflow-y-auto">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Select Project</label>
                     <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                        <option>School Block A - Roof Inspection</option>
                        <option>Market Shelter - Foundation</option>
                     </select>
                  </div>

                  {/* Geofence Enforcement Section */}
                  <div className={`border rounded-xl p-5 text-center transition-colors ${
                     gpsStatus === 'success' ? 'border-green-200 bg-green-50' :
                     gpsStatus === 'fail' ? 'border-red-200 bg-red-50' :
                     'border-slate-200 bg-slate-50'
                  }`}>
                     <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-center gap-2">
                        <MapIcon size={16} /> GPS Geofence Verification
                     </h4>
                     
                     {gpsStatus === 'idle' && (
                        <button 
                           onClick={verifyLocation}
                           className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-2 mx-auto"
                        >
                           <Navigation size={16} /> Verify My Location
                        </button>
                     )}

                     {gpsStatus === 'locating' && (
                        <div className="flex flex-col items-center text-slate-500">
                           <Loader2 size={24} className="animate-spin mb-2 text-blue-600" />
                           <p className="text-xs">Triangulating satellites...</p>
                        </div>
                     )}

                     {gpsStatus === 'success' && (
                        <div className="animate-scale-in">
                           <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                              <CheckCircle2 size={24} />
                           </div>
                           <p className="text-green-800 font-bold text-sm">Location Verified</p>
                           <p className="text-xs text-green-600">You are {distance}m from the project site (Inside 200m Geofence)</p>
                        </div>
                     )}

                     {gpsStatus === 'fail' && (
                        <div className="animate-scale-in">
                           <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                              <X size={24} />
                           </div>
                           <p className="text-red-800 font-bold text-sm">Verification Failed</p>
                           <p className="text-xs text-red-600">You are {distance}m from the site. Must be within 200m to submit.</p>
                           <button onClick={verifyLocation} className="mt-2 text-xs text-red-700 underline">Retry</button>
                        </div>
                     )}
                  </div>

                  {/* Photo Upload */}
                  <div className={gpsStatus !== 'success' ? 'opacity-50 pointer-events-none' : ''}>
                      <DocumentUpload 
                         label="Site Photos (With EXIF)"
                         description="Upload at least 2 photos of progress"
                         acceptedTypes={['image/jpeg', 'image/png']}
                         onUploadComplete={() => {}}
                         onRemove={() => {}}
                      />
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1">Physical Progress (%)</label>
                     <input 
                        type="range" 
                        min="0" max="100" 
                        className="w-full"
                        disabled={gpsStatus !== 'success'}
                     />
                  </div>
               </div>

               <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                  <button 
                     disabled={gpsStatus !== 'success'}
                     className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${
                        gpsStatus === 'success' 
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200' 
                        : 'bg-slate-300 cursor-not-allowed'
                     }`}
                  >
                     Submit Report
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* KPI Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase">Physical Progress</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">78%</h3>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
             <div className="bg-blue-600 h-2 rounded-full w-[78%]"></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Average across 24 active sites</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase">Site Visits (Q3)</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">42</h3>
          <span className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
             <CheckCircle2 size={12} /> 100% Schedule Adherence
          </span>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase">Open Defects</p>
          <h3 className="text-2xl font-bold text-red-600 mt-1">5</h3>
          <span className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
             <AlertCircle size={12} /> 2 Critical Issues
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed: Site Visit Logs */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
           <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                 <MapPin size={18} className="text-blue-600" /> Recent Site Visits
              </h2>
              <button 
                 onClick={() => {
                    setShowLogModal(true);
                    setGpsStatus('idle');
                    setDistance(null);
                 }}
                 className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-transform hover:scale-105"
              >
                 + Log Visit
              </button>
           </div>
           <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((visit) => (
                 <div key={visit} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                       <div>
                          <h3 className="font-bold text-slate-800">School Block A - Roof Inspection</h3>
                          <p className="text-sm text-slate-500">Kabwata Ward • Oct 24, 2024</p>
                       </div>
                       <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold border border-green-100 flex items-center gap-1 uppercase tracking-wide">
                               <Globe size={10} /> GPS Verified
                            </span>
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100 flex items-center gap-1 uppercase tracking-wide">
                               <Camera size={10} /> EXIF Valid
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                             <Navigation size={10} /> ±4m Accuracy (Within Geofence)
                          </span>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                       <div className="h-24 bg-slate-200 rounded-lg flex items-center justify-center relative group cursor-pointer overflow-hidden">
                          <img src={`https://picsum.photos/seed/${visit}a/200/200`} alt="Site" className="w-full h-full object-cover" />
                          <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded flex items-center gap-1 backdrop-blur-sm">
                             <Shield size={8} /> Verified
                          </div>
                       </div>
                       <div className="h-24 bg-slate-200 rounded-lg flex items-center justify-center relative group cursor-pointer overflow-hidden">
                          <img src={`https://picsum.photos/seed/${visit}b/200/200`} alt="Site" className="w-full h-full object-cover" />
                       </div>
                       <div className="h-24 bg-slate-200 rounded-lg flex items-center justify-center relative group cursor-pointer overflow-hidden">
                          <img src={`https://picsum.photos/seed/${visit}c/200/200`} alt="Site" className="w-full h-full object-cover" />
                       </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                       <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">Inspector:</span>
                          <span className="text-slate-600">Eng. Mumba</span>
                       </div>
                       <div className="flex items-center gap-2">
                           <span className="font-medium text-slate-700">Progress:</span>
                           <span className="text-blue-600 font-bold">65%</span>
                       </div>
                       <div className="flex items-center gap-2 ml-auto">
                           <span className="text-xs text-slate-400 font-mono">ID: VIS-2024-{visit}88</span>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Issue Tracker */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
           <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Defect & Issue Log</h2>
           </div>
           <div className="p-4 space-y-4">
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                 <div className="flex gap-3">
                    <AlertCircle className="text-red-600 shrink-0 mt-1" size={16} />
                    <div>
                       <h4 className="text-sm font-bold text-red-800">Cracks in Foundation</h4>
                       <p className="text-xs text-red-600 mt-1">Project: Market Shelter</p>
                       <p className="text-xs text-slate-500 mt-2">Action: Contractor notified to rectify.</p>
                    </div>
                 </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                 <div className="flex gap-3">
                    <AlertCircle className="text-amber-600 shrink-0 mt-1" size={16} />
                    <div>
                       <h4 className="text-sm font-bold text-amber-800">Material Delivery Delay</h4>
                       <p className="text-xs text-amber-600 mt-1">Project: Clinic Expansion</p>
                       <p className="text-xs text-slate-500 mt-2">Est. Delay: 5 Days</p>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="p-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Geo-Fencing Stats</h3>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                 <div className="flex justify-between text-xs mb-1">
                    <span>Visits On-Site</span>
                    <span className="font-bold text-green-600">92%</span>
                 </div>
                 <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                    <div className="bg-green-500 h-1.5 rounded-full w-[92%]"></div>
                 </div>
                 <p className="text-[10px] text-slate-400">
                    3 visits flagged > 500m from site coordinates.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringEvaluation;
