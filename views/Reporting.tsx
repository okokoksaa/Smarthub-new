
import React from 'react';
import { 
  BarChart3, 
  Download, 
  FileText, 
  PieChart, 
  TrendingUp,
  Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePie, Pie, Cell } from 'recharts';

const Reporting: React.FC = () => {
  const spendData = [
    { name: 'Q1', budget: 400, spent: 240 },
    { name: 'Q2', budget: 300, spent: 139 },
    { name: 'Q3', budget: 200, spent: 180 },
    { name: 'Q4', budget: 278, spent: 190 },
  ];
  const sectorData = [
    { name: 'Education', value: 400 },
    { name: 'Health', value: 300 },
    { name: 'Roads', value: 300 },
    { name: 'Water', value: 200 },
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <BarChart3 size={28} className="text-blue-600" /> Reporting & Analytics
          </h1>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50">
                <Filter size={18} /> Filter
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-lg shadow-blue-200">
                <Download size={18} /> Export Pack
             </button>
          </div>
       </div>

       {/* Charts */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-800 mb-6">Quarterly Burn Rate</h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={spendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} />
                      <Bar dataKey="budget" fill="#cbd5e1" radius={[4,4,0,0]} />
                      <Bar dataKey="spent" fill="#3b82f6" radius={[4,4,0,0]} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-800 mb-6">Sector Allocation</h3>
             <div className="h-64 w-full flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                   <RePie>
                      <Pie
                         data={sectorData}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={80}
                         fill="#8884d8"
                         paddingAngle={5}
                         dataKey="value"
                      >
                         {sectorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                      </Pie>
                      <Tooltip />
                   </RePie>
                </ResponsiveContainer>
             </div>
          </div>
       </div>

       {/* Report Packs */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
             <h3 className="font-bold text-slate-800">Standard Report Packs</h3>
          </div>
          <div className="divide-y divide-slate-100">
             {[
                { name: 'Quarterly Financial Return (QFR)', desc: 'Standard format for Ministry submission', type: 'PDF + CSV' },
                { name: 'Project Status Report', desc: 'Detailed physical progress vs financial spend', type: 'PDF' },
                { name: 'Bursary Beneficiary List', desc: 'Full breakdown by Ward and Institution', type: 'Excel' },
                { name: 'Audit Trail Export', desc: 'Immutable log of all system actions (JSON)', type: 'JSON' }
             ].map((report, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                   <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-100 text-slate-500 rounded-lg">
                         <FileText size={24} />
                      </div>
                      <div>
                         <h4 className="font-bold text-slate-800">{report.name}</h4>
                         <p className="text-sm text-slate-500">{report.desc}</p>
                      </div>
                   </div>
                   <button className="flex items-center gap-2 text-blue-600 font-medium hover:bg-blue-50 px-3 py-1.5 rounded transition-colors">
                      <Download size={16} /> {report.type}
                   </button>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default Reporting;