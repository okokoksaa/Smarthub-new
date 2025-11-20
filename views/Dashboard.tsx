
import React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  Users,
  Wallet,
  FileText,
  ChevronRight
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

const StatCard = ({ title, value, trend, icon: Icon, colorClass, bgClass }: any) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${bgClass} ${colorClass} group-hover:scale-110 transition-transform duration-200`}>
        <Icon size={22} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-xs font-medium">
      {trend && (
        <span className={`${trend.startsWith('+') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-2 py-1 rounded-full flex items-center gap-1`}>
          <TrendingUp size={12} /> {trend}
        </span>
      )}
      <span className="text-slate-400 ml-2">vs last quarter</span>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Budget Utilization" 
          value="64.2%" 
          trend="+12%" 
          icon={Wallet} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <StatCard 
          title="Active Projects" 
          value="28" 
          trend="+3" 
          icon={CheckCircle2} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50" 
        />
        <StatCard 
          title="Pending Approvals" 
          value="7" 
          trend="-2" 
          icon={Clock} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50" 
        />
        <StatCard 
          title="Bursaries Paid" 
          value="1,240" 
          trend="+150" 
          icon={Users} 
          colorClass="text-green-600" 
          bgClass="bg-green-50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Action Items</h2>
              <p className="text-xs text-slate-500">Tasks requiring your immediate attention</p>
            </div>
            <button className="text-sm text-blue-600 font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
            {mockTasks.map((task) => (
              <div key={task.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors group cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${task.priority === 'High' ? 'bg-red-500 shadow-red-200' : task.priority === 'Medium' ? 'bg-amber-500 shadow-amber-200' : 'bg-blue-500 shadow-blue-200'}`} />
                  <div>
                    <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-sm">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{task.type}</span>
                      <span className="text-xs text-slate-400">• Assigned: {task.assignedTo}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {task.dueInDays < 0 ? (
                    <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                      <AlertTriangle size={12} className="mr-1" /> {Math.abs(task.dueInDays)}d Overdue
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      {task.dueInDays}d left
                    </span>
                  )}
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto p-4 bg-slate-50 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400">You have cleared 12 tasks this week. Good job!</p>
          </div>
        </div>

        {/* SLA Heatmap / Alerts */}
        <div className="space-y-6">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
               <h2 className="font-bold text-slate-800 text-lg">SLA Pulse</h2>
             </div>
             <div className="p-6">
               <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
               </div>
               <div className="grid grid-cols-5 gap-2">
                 {Array.from({ length: 20 }).map((_, i) => {
                   const status = i === 12 ? 'danger' : i === 14 ? 'warning' : i === 7 ? 'warning' : 'good';
                   const color = status === 'danger' ? 'bg-red-500 shadow-lg shadow-red-200' : status === 'warning' ? 'bg-amber-400' : 'bg-slate-100';
                   return (
                     <div 
                       key={i} 
                       className={`h-10 rounded-lg ${color} transition-all hover:scale-105 cursor-pointer relative group`}
                     >
                     </div>
                   );
                 })}
               </div>
               
               <div className="mt-6 space-y-3">
                 <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="p-2 bg-white rounded-full text-red-500 shadow-sm">
                       <AlertCircle size={16} />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-800">2 Critical Blockers</p>
                       <p className="text-xs text-slate-500 mt-0.5">Projects missing environmental assessment certificates.</p>
                       <button className="text-xs font-bold text-red-600 mt-2 hover:underline">Resolve Now</button>
                    </div>
                 </div>
               </div>
             </div>
           </div>

           {/* Quick Actions */}
           <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-bold text-lg mb-4">Quick Access</h3>
              <div className="grid grid-cols-2 gap-3">
                 <button className="bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-xl text-left transition-colors">
                    <FileText size={20} className="mb-2 opacity-80" />
                    <p className="text-xs font-bold">New Proposal</p>
                 </button>
                 <button className="bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-xl text-left transition-colors">
                    <Users size={20} className="mb-2 opacity-80" />
                    <p className="text-xs font-bold">Log Meeting</p>
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Financial Overview Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Budget Allocation vs. Spend</h2>
            <p className="text-sm text-slate-500">Real-time financial tracking by sector</p>
          </div>
          <select className="text-sm border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50">
             <option>Q3 2024</option>
             <option>Q2 2024</option>
          </select>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `K${(value / 1000000).toFixed(1)}M`} />
              <Tooltip 
                 cursor={{ fill: '#f8fafc' }}
                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="budget" name="Allocated Budget" fill="#e2e8f0" radius={[6, 6, 6, 6]} barSize={32} />
              <Bar dataKey="spent" name="Actual Spend" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={32}>
                 {mockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.spent > entry.budget ? '#ef4444' : '#3b82f6'} />
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
