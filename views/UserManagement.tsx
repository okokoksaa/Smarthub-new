
import React from 'react';
import { 
  Shield, 
  Users, 
  MoreVertical, 
  Plus,
  Lock
} from 'lucide-react';

const UserManagement: React.FC = () => {
  const users = [
    { id: 1, name: 'Jane Doe', email: 'jane@cdf.gov.zm', role: 'CDFC Secretary', scope: 'Constituency', status: 'Active' },
    { id: 2, name: 'John Smith', email: 'john.p@council.gov.zm', role: 'PLGO Officer', scope: 'Province', status: 'Active' },
    { id: 3, name: 'Mary Banda', email: 'mary.b@wdc.org', role: 'WDC Chairperson', scope: 'Ward (Kabwata)', status: 'Active' },
    { id: 4, name: 'Tech Consultant', email: 'audit@external.com', role: 'Auditor', scope: 'Read-Only', status: 'Inactive' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={28} className="text-blue-600" /> User & Role Management
         </h1>
         <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700">
            <Plus size={18} /> Invite User
         </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
               <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Access Scope</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {user.name.charAt(0)}
                           </div>
                           <div>
                              <p className="font-medium text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                           <Shield size={12} /> {user.role}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-slate-600">
                        {user.scope}
                     </td>
                     <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           user.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                           {user.status}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                           <MoreVertical size={18} />
                        </button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Lock size={18} className="text-slate-500" /> Row-Level Security (RLS)
            </h3>
            <p className="text-sm text-slate-500 mb-4">
               The platform enforces strict data isolation. Users can only access data corresponding to their assigned scope (Province, Constituency, or Ward).
            </p>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs font-mono text-slate-600">
               Policy: ALLOW SELECT ON projects WHERE ward_id IN (user.assigned_wards)
            </div>
         </div>
      </div>
    </div>
  );
};

export default UserManagement;