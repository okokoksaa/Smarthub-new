import React from 'react';
import { 
  MapPin, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  BarChart2,
  Calendar,
  Globe,
  Navigation,
  Shield
} from 'lucide-react';

const MonitoringEvaluation: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
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
              <button className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
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