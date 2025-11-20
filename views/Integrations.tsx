
import React from 'react';
import { 
  Network, 
  UploadCloud, 
  FileSpreadsheet, 
  Database, 
  CheckCircle2,
  RefreshCcw
} from 'lucide-react';

const Integrations: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white p-8 rounded-xl shadow-lg">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
               <Network size={32} />
            </div>
            <div>
               <h1 className="text-2xl font-bold">Integrations & Data Pipelines</h1>
               <p className="text-indigo-200">Manage external data sources, bank feeds, and document generation.</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Bank Feed Integration */}
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="text-green-600" size={20} /> Bank Statement Ingestion
               </h3>
               <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">Active</span>
            </div>
            <div className="p-6 space-y-6">
               <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-blue-50 transition-colors cursor-pointer">
                  <UploadCloud size={40} className="mx-auto text-slate-400 mb-3" />
                  <h4 className="font-bold text-slate-700">Upload Bank CSV</h4>
                  <p className="text-sm text-slate-500 mt-1">Drag and drop ZANACO/FNB statement files here</p>
                  <p className="text-xs text-slate-400 mt-4">Supported formats: .csv, .mt940</p>
               </div>
               
               <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Recent Pipeline Runs</h4>
                  <div className="space-y-3">
                     <div className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-3">
                           <CheckCircle2 size={16} className="text-green-500" />
                           <span className="font-medium text-slate-700">Zanaco_Oct_24.csv</span>
                        </div>
                        <span className="text-slate-500 text-xs">142 records • 2 mins ago</span>
                     </div>
                     <div className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-3">
                           <CheckCircle2 size={16} className="text-green-500" />
                           <span className="font-medium text-slate-700">FNB_Weekly.csv</span>
                        </div>
                        <span className="text-slate-500 text-xs">89 records • 1 hour ago</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Legacy Data Import */}
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Database className="text-blue-600" size={20} /> Legacy Data Import
               </h3>
            </div>
            <div className="p-6">
               <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-800 font-medium">
                     Importing historical data from Excel? Use the staging area validation tool before committing to the master database.
                  </p>
               </div>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                     <div>
                        <p className="font-bold text-slate-800">Project History (2021-2023)</p>
                        <p className="text-xs text-slate-500">Excel Template v2.4</p>
                     </div>
                     <button className="bg-slate-900 text-white px-3 py-1.5 rounded text-sm hover:bg-slate-800">
                        Open Importer
                     </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                     <div>
                        <p className="font-bold text-slate-800">Beneficiary Registry</p>
                        <p className="text-xs text-slate-500">CSV Bulk Load</p>
                     </div>
                     <button className="bg-slate-900 text-white px-3 py-1.5 rounded text-sm hover:bg-slate-800">
                        Open Importer
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Integrations;