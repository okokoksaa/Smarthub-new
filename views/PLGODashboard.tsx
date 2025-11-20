
import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText,
  AlertTriangle,
  CalendarDays
} from 'lucide-react';

const PLGODashboard: React.FC = () => {
  const submissions = [
    { id: 'SUB-2024-089', type: 'Project Variation', constituency: 'Kamwala', subject: 'Road Cost Escalation', submitted: '2024-10-25', deadline: '2024-11-14', status: 'Pending' },
    { id: 'SUB-2024-088', type: 'Bursary List', constituency: 'Kabwata', subject: 'Q4 Skills Training', submitted: '2024-10-24', deadline: '2024-11-13', status: 'Pending' },
    { id: 'SUB-2024-085', type: 'Procurement Plan', constituency: 'Munali', subject: 'FY 2025 Plan', submitted: '2024-10-20', deadline: '2024-11-07', status: 'Approved' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-bold text-slate-800">Provincial Oversight (Lusaka)</h1>
            <p className="text-slate-500">Manage approvals within the statutory 14 working days.</p>
         </div>
         <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-blue-100">
            <CalendarDays size={18} /> Today: Working Day 156 of 2024
         </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Pending Actions</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">8</h3>
               </div>
               <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Clock size={20} />
               </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">3 items due within 48 hours</p>
         </div>

         <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Avg. Approval Time</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">4.2 Days</h3>
               </div>
               <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                  <CheckCircle size={20} />
               </div>
            </div>
            <p className="text-xs text-green-600 mt-2 font-medium">Well within 14-day SLA</p>
         </div>

         <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Returned Submissions</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">12</h3>
               </div>
               <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                  <XCircle size={20} />
               </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Mostly due to missing minutes</p>
         </div>
      </div>

      {/* Inbox */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">Submission Inbox</h2>
            <select className="text-sm border-slate-200 rounded-lg">
               <option>All Constituencies</option>
               <option>Kamwala</option>
               <option>Kabwata</option>
               <option>Munali</option>
            </select>
         </div>
         <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
               <tr>
                  <th className="px-6 py-3">Ref ID</th>
                  <th className="px-6 py-3">Constituency</th>
                  <th className="px-6 py-3">Type / Subject</th>
                  <th className="px-6 py-3">Submitted</th>
                  <th className="px-6 py-3">SLA Deadline</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {submissions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                     <td className="px-6 py-4 font-mono text-slate-500 text-xs">{item.id}</td>
                     <td className="px-6 py-4 font-medium text-slate-900">{item.constituency}</td>
                     <td className="px-6 py-4">
                        <span className="block font-medium text-slate-800">{item.type}</span>
                        <span className="text-xs text-slate-500">{item.subject}</span>
                     </td>
                     <td className="px-6 py-4 text-slate-600">{item.submitted}</td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className="text-slate-900 font-medium">{item.deadline}</span>
                           {item.status === 'Pending' && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">12 days left</span>
                           )}
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           item.status === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                           {item.status}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <button className="text-blue-600 font-medium hover:underline">Review</button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
      
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
         <AlertTriangle className="text-amber-600 shrink-0" size={20} />
         <div>
            <h4 className="font-bold text-amber-900 text-sm">Deemed Approval Warning</h4>
            <p className="text-sm text-amber-800 mt-1">
               Submissions not acted upon within 14 working days will be automatically marked as "Deemed Approved" if the tenant setting is enabled. Ensure all reviews are logged before the deadline.
            </p>
         </div>
      </div>
    </div>
  );
};

export default PLGODashboard;