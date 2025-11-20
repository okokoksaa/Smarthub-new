import React from 'react';
import { 
  Map, 
  Search, 
  ExternalLink, 
  BarChart3, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { Project } from '../types';

const PublicPortal: React.FC = () => {
  const mockProjects: Project[] = [
    { id: 'P001', title: 'Construction of 1x3 Classroom Block', location: 'Kabwata Primary', budget: 450000, spent: 300000, status: 'Active', progress: 65, ward: 'Kabwata', startDate: '2024-01-15' },
    { id: 'P002', title: 'Youth Skills Training Grant', location: 'Constituency Wide', budget: 200000, spent: 200000, status: 'Completed', progress: 100, ward: 'All', startDate: '2023-11-01' },
    { id: 'P003', title: 'Borehole Drilling & Solar Pump', location: 'Market Area', budget: 85000, spent: 0, status: 'Procurement', progress: 10, ward: 'Kamwala', startDate: '2024-03-01' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen animate-fade-in pb-12">
      {/* Hero / Search Header */}
      <div className="bg-blue-900 text-white py-16 px-4 sm:px-6 lg:px-8">
         <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
               <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <ShieldCheck size={40} className="text-yellow-400" />
               </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
               Constituency Transparency Portal
            </h1>
            <p className="text-lg text-blue-200 mb-8 max-w-2xl mx-auto">
               Track every Kwacha. Monitor development projects in real-time. 
               Verify bursary lists and empowerment grants directly from the source.
            </p>
            
            <div className="relative max-w-2xl mx-auto">
               <input 
                  type="text" 
                  placeholder="Search for a project, school, or cooperative name..." 
                  className="w-full py-4 pl-6 pr-12 rounded-full text-slate-900 shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50"
               />
               <button className="absolute right-2 top-2 p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors text-white">
                  <Search size={24} />
               </button>
            </div>
         </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
         <div className="bg-white rounded-xl shadow-lg grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-6 text-center">
               <p className="text-sm text-slate-500 font-medium uppercase">Total Allocated (2024)</p>
               <p className="text-3xl font-bold text-slate-900 mt-1">K 28,300,000</p>
            </div>
            <div className="p-6 text-center">
               <p className="text-sm text-slate-500 font-medium uppercase">Projects Completed</p>
               <p className="text-3xl font-bold text-green-600 mt-1">14</p>
            </div>
            <div className="p-6 text-center">
               <p className="text-sm text-slate-500 font-medium uppercase">Beneficiaries Reached</p>
               <p className="text-3xl font-bold text-blue-600 mt-1">3,402</p>
            </div>
         </div>
      </div>

      {/* Project List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <BarChart3 className="text-blue-600" /> Recent Projects
            </h2>
            <button className="text-blue-600 font-medium hover:underline flex items-center gap-1">
               View Full Map <ExternalLink size={16} />
            </button>
         </div>

         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockProjects.map((project) => (
               <div key={project.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="h-48 bg-slate-200 relative overflow-hidden">
                     <img 
                        src={`https://picsum.photos/seed/${project.id}/400/250`} 
                        alt="Project site" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                     />
                     <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                           project.status === 'Active' ? 'bg-green-500 text-white' :
                           project.status === 'Completed' ? 'bg-blue-600 text-white' :
                           'bg-amber-500 text-white'
                        }`}>
                           {project.status}
                        </span>
                     </div>
                  </div>
                  <div className="p-5">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                           {project.ward}
                        </span>
                        <span className="text-xs text-slate-500">
                           ID: {project.id}
                        </span>
                     </div>
                     <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 h-12">
                        {project.title}
                     </h3>
                     <div className="space-y-3">
                        <div>
                           <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-500">Completion</span>
                              <span className="font-bold text-slate-800">{project.progress}%</span>
                           </div>
                           <div className="w-full bg-slate-100 rounded-full h-2">
                              <div 
                                 className="bg-green-500 h-2 rounded-full transition-all duration-1000" 
                                 style={{ width: `${project.progress}%` }}
                              />
                           </div>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                           <span className="text-slate-500">Budget</span>
                           <span className="font-bold text-slate-900">K{project.budget.toLocaleString()}</span>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-200">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
            <p>© 2025 Ministry of Local Government. Powered by CDF Smart Hub.</p>
            <div className="flex gap-6">
               <a href="#" className="hover:text-blue-600">Report Grievance</a>
               <a href="#" className="hover:text-blue-600">Privacy Policy</a>
               <a href="#" className="hover:text-blue-600">Contact Support</a>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PublicPortal;