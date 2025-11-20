import React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  Users
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Task } from '../types';

const mockTasks: Task[] = [
  { id: '1', title: 'Approve Lusaka Ward Bursary List', dueInDays: -2, type: 'Approval', priority: 'High', assignedTo: 'CDFC' },
  { id: '2', title: 'Sign Project Variations: School Block A', dueInDays: 1, type: 'Signature', priority: 'High', assignedTo: 'Panel A' },
  { id: '3', title: 'Review Q3 Expenditure Return', dueInDays: 3, type: 'Review', priority: 'Medium', assignedTo: 'Finance' },
  { id: '4', title: 'Verify Site Visit: Chibolya Clinic', dueInDays: 5, type: 'Compliance', priority: 'Low', assignedTo: 'M&E' },
];

const mockData = [
  { name: 'Education', budget: 4000000, spent: 2400000 },
  { name: 'Health', budget: 3000000, spent: 1398000 },
  { name: 'Roads', budget: 2000000, spent: 1800000 },
  { name: 'Empowerment', budget: 2780000, spent: 1908000 },
  { name: 'Water', budget: 1890000, spent: 480000 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Budget Utilization</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">64.2%</h3>
            <span className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp size={12} /> +12% vs Q2
            </span>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Projects</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">28</h3>
            <span className="text-xs text-slate-500 mt-1">4 stalled / 24 on track</span>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Approvals</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">7</h3>
            <span className="text-xs text-amber-600 font-medium mt-1">2 Overdue > 48hrs</span>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Bursaries Paid</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">1,240</h3>
            <span className="text-xs text-slate-500 mt-1">Term 1, 2024</span>
          </div>
          <div className="p-2 bg-green-50 text-green-600 rounded-lg">
            <Users size={20} /> {/* Using imported generic icon */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">My Tasks & Exceptions</h2>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
            {mockTasks.map((task) => (
              <div key={task.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div>
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{task.type}</span>
                      <span className="text-xs text-slate-500">Assigned: {task.assignedTo}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {task.dueInDays < 0 ? (
                    <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      <AlertTriangle size={12} className="mr-1" /> Overdue {Math.abs(task.dueInDays)} days
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-full">
                      Due in {task.dueInDays} days
                    </span>
                  )}
                  <button className="text-xs text-blue-600 font-medium mt-2 flex items-center hover:underline">
                    Take Action <ArrowRight size={12} className="ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SLA Heatmap / Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">SLA Heatmap</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-5 gap-2 mb-4 text-xs text-slate-500 text-center">
               <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 25 }).map((_, i) => {
                // Mock heatmap data logic
                const status = i === 12 ? 'danger' : i === 14 ? 'warning' : i === 7 ? 'warning' : 'good';
                const color = status === 'danger' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-400' : 'bg-slate-100';
                return (
                  <div 
                    key={i} 
                    className={`h-8 rounded-md ${color} transition-opacity hover:opacity-80 cursor-pointer relative group`}
                  >
                     {status !== 'good' && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-xs py-1 px-2 rounded z-10 w-max">
                           {status === 'danger' ? '2 Critical Items' : 'Pending Review'}
                        </div>
                     )}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                 <AlertCircle className="text-red-500" size={20} />
                 <div>
                    <p className="text-sm font-bold text-red-800">2 Projects Blocked</p>
                    <p className="text-xs text-red-600">Missing environmental impact assessment.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-slate-800">Budget Allocation vs. Spend</h2>
          <select className="text-sm border-slate-200 rounded-md text-slate-600">
             <option>Q3 2024</option>
             <option>Q2 2024</option>
          </select>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `K${(value / 1000000).toFixed(1)}M`} />
              <Tooltip 
                 cursor={{ fill: '#f1f5f9' }}
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="budget" name="Allocated Budget" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="spent" name="Actual Spend" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20}>
                 {mockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.spent > entry.budget ? '#ef4444' : '#2563eb'} />
                 ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;