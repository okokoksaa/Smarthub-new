
import React from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  Zap, 
  HardDrive, 
  Users,
  Download
} from 'lucide-react';

const Subscription: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Current Plan Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-lg">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <div className="flex items-center gap-2 text-blue-400 font-medium mb-2">
                  <Zap size={20} /> Current Plan
               </div>
               <h1 className="text-3xl font-bold">Professional Tier</h1>
               <p className="text-slate-400 mt-1">Next billing date: November 1, 2024</p>
            </div>
            <div className="text-right">
               <p className="text-2xl font-bold">K 5,000<span className="text-sm text-slate-400 font-normal">/month</span></p>
               <button className="mt-3 bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors">
                  Manage Payment Method
               </button>
            </div>
         </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users size={18} /> User Licenses
               </h3>
               <span className="text-sm font-medium text-slate-600">42 / 50 Used</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
               <div className="bg-blue-600 h-3 rounded-full w-[84%]"></div>
            </div>
            <p className="text-xs text-slate-500">Admin, CDFC, and WDC accounts count towards this limit.</p>
         </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <HardDrive size={18} /> Document Storage
               </h3>
               <span className="text-sm font-medium text-slate-600">8.2 GB / 50 GB Used</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
               <div className="bg-green-500 h-3 rounded-full w-[16%]"></div>
            </div>
            <p className="text-xs text-slate-500">Includes project photos, PDF guidelines, and meeting minutes.</p>
         </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
         <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
            <h3 className="font-bold text-lg text-slate-800">Basic</h3>
            <p className="text-2xl font-bold mt-2">K 2,500<span className="text-xs text-slate-500 font-normal">/mo</span></p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
               <li className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> 10 Users</li>
               <li className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> Ward Intake</li>
               <li className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> Basic Financials</li>
            </ul>
            <button className="w-full mt-6 py-2 border border-slate-200 rounded-lg font-medium text-slate-600 hover:bg-slate-50">Downgrade</button>
         </div>

         <div className="bg-white p-6 rounded-xl border-2 border-blue-600 relative shadow-lg">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Current</div>
            <h3 className="font-bold text-lg text-slate-800">Professional</h3>
            <p className="text-2xl font-bold mt-2">K 5,000<span className="text-xs text-slate-500 font-normal">/mo</span></p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
               <li className="flex gap-2"><CheckCircle size={16} className="text-blue-600" /> 50 Users</li>
               <li className="flex gap-2"><CheckCircle size={16} className="text-blue-600" /> AI Knowledge Center</li>
               <li className="flex gap-2"><CheckCircle size={16} className="text-blue-600" /> Governance Module</li>
               <li className="flex gap-2"><CheckCircle size={16} className="text-blue-600" /> Public Portal</li>
            </ul>
            <button className="w-full mt-6 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold">Current Plan</button>
         </div>

         <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
            <h3 className="font-bold text-lg text-slate-800">Enterprise</h3>
            <p className="text-2xl font-bold mt-2">Contact Us</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
               <li className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> Unlimited Users</li>
               <li className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> Red-Flag AI Analytics</li>
               <li className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> Dedicated PLGO Instance</li>
            </ul>
            <button className="w-full mt-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800">Upgrade</button>
         </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Billing History</h3>
         </div>
         <div className="divide-y divide-slate-100">
            {[
               { id: 'INV-2024-001', date: 'Oct 01, 2024', amount: 'K 5,000.00', status: 'Paid' },
               { id: 'INV-2024-002', date: 'Sep 01, 2024', amount: 'K 5,000.00', status: 'Paid' },
               { id: 'INV-2024-003', date: 'Aug 01, 2024', amount: 'K 2,500.00', status: 'Paid' },
            ].map((inv) => (
               <div key={inv.id} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50">
                  <div>
                     <p className="font-medium text-slate-900">{inv.id}</p>
                     <p className="text-xs text-slate-500">{inv.date} • {inv.status}</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="font-mono font-medium text-slate-700">{inv.amount}</span>
                     <button className="text-slate-400 hover:text-blue-600">
                        <Download size={18} />
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default Subscription;
