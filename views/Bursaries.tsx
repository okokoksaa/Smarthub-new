
import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Download,
  GraduationCap
} from 'lucide-react';

const Bursaries: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'verification' | 'payments'>('applications');

  const applications = [
    { id: 'BUR-24-001', name: 'Alice Banda', institution: 'UNZA', amount: 12000, ward: 'Kabwata', status: 'Pending', type: 'University' },
    { id: 'BUR-24-002', name: 'John Phiri', institution: 'Evelyn Hone', amount: 8000, ward: 'Kamwala', status: 'Approved', type: 'College' },
    { id: 'BUR-24-003', name: 'Mary Tembo', institution: 'Apex University', amount: 11500, ward: 'Libala', status: 'Rejected', type: 'University' },
    { id: 'BUR-24-004', name: 'Peter Zulu', institution: 'NORTEC', amount: 6500, ward: 'Kabwata', status: 'Pending', type: 'Skills' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        <button 
          onClick={() => setActiveTab('applications')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'applications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          All Applications
        </button>
        <button 
          onClick={() => setActiveTab('verification')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'verification' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Ward Verification Queue
        </button>
        <button 
          onClick={() => setActiveTab('payments')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Payment Batches
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Applications</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">1,245</h3>
          <p className="text-xs text-slate-500 mt-1">Term 1, 2024</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase">Pending Review</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">48</h3>
          <p className="text-xs text-slate-500 mt-1">SLA: 2 days remaining</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase">Approved Value</p>
          <h3 className="text-2xl font-bold text-green-600 mt-1">K 4.2M</h3>
          <p className="text-xs text-slate-500 mt-1">65% of Budget</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase">Schools Paid</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">12/45</h3>
          <p className="text-xs text-slate-500 mt-1">Institutions</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
             <GraduationCap className="text-blue-600" size={20} /> 
             {activeTab === 'applications' ? 'Applicant Registry' : activeTab === 'verification' ? 'Pending Ward Verification' : 'Payment Processing'}
          </h3>
          <div className="flex gap-2 w-full sm:w-auto">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                   type="text" 
                   placeholder="Search applicant or ID..." 
                   className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
             </div>
             <button className="p-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                <Filter size={18} />
             </button>
             <button className="p-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                <Download size={18} />
             </button>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-3">Ref ID</th>
              <th className="px-6 py-3">Applicant Name</th>
              <th className="px-6 py-3">Ward</th>
              <th className="px-6 py-3">Institution</th>
              <th className="px-6 py-3 text-right">Amount (K)</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{app.id}</td>
                <td className="px-6 py-4 font-medium text-slate-900">
                   {app.name}
                   <span className="block text-xs text-slate-500 font-normal">{app.type}</span>
                </td>
                <td className="px-6 py-4 text-slate-600">{app.ward}</td>
                <td className="px-6 py-4 text-slate-600">{app.institution}</td>
                <td className="px-6 py-4 text-right font-mono">{app.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    app.status === 'Approved' ? 'bg-green-50 text-green-700' :
                    app.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {app.status === 'Pending' && <Clock size={12} className="mr-1" />}
                    {app.status === 'Approved' && <CheckCircle size={12} className="mr-1" />}
                    {app.status === 'Rejected' && <XCircle size={12} className="mr-1" />}
                    {app.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                   <button className="text-blue-600 hover:underline flex items-center gap-1">
                      <FileText size={14} /> Review
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center">
           <button className="text-sm text-slate-500 hover:text-slate-800">Load More</button>
        </div>
      </div>
    </div>
  );
};

export default Bursaries;