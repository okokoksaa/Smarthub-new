
import React, { useState } from 'react';
import { 
  DollarSign, 
  PieChart, 
  Download, 
  ShieldCheck, 
  AlertCircle,
  Search,
  Lock,
  UserCheck,
  CheckCircle,
  X,
  ChevronRight,
  FileSpreadsheet,
  UploadCloud,
  History
} from 'lucide-react';
import { FinancialRecord } from '../types';

const mockFinancials: FinancialRecord[] = [
  { id: 'TRX-8832', description: 'Payment for Cement Supply - School Project', amount: 45000, date: '2024-10-25', status: 'Pending Panel B', category: 'Infrastructure' },
  { id: 'TRX-8831', description: 'Bursary Disbursement - UNZAS', amount: 120000, date: '2024-10-24', status: 'Approved', category: 'Bursary' },
  { id: 'TRX-8830', description: 'Empowerment Grant - Women Coop', amount: 20000, date: '2024-10-23', status: 'Paid', category: 'Empowerment' },
  { id: 'TRX-8829', description: 'Site Monitoring Fuel Allowance', amount: 2500, date: '2024-10-22', status: 'Pending Panel A', category: 'Infrastructure' },
];

const Financials: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'returns'>('ledger');
  const [selectedTx, setSelectedTx] = useState<FinancialRecord | null>(null);

  // Transaction Details Modal (The Enforcement Logic Visualizer)
  const TransactionDetail = ({ record, onClose }: { record: FinancialRecord, onClose: () => void }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end animate-fade-in">
       <div className="h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <div>
                <h3 className="font-bold text-slate-800">Transaction Inspector</h3>
                <p className="text-xs font-mono text-slate-500">{record.id}</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                <X size={20} />
             </button>
          </div>

          <div className="p-6 space-y-8">
             {/* Amount Header */}
             <div className="text-center">
                <p className="text-sm text-slate-500 uppercase tracking-wider font-medium mb-1">Total Amount</p>
                <h2 className="text-4xl font-bold text-slate-900">K {record.amount.toLocaleString()}</h2>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-bold">
                   {record.category}
                </span>
             </div>

             {/* Approval Chain */}
             <div>
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <ShieldCheck size={18} className="text-blue-600" /> Security Chain
                </h4>
                <div className="relative space-y-6 pl-4">
                   <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200 -z-10"></div>
                   
                   {/* Step 1 */}
                   <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                         <CheckCircle size={18} />
                      </div>
                      <div>
                         <p className="font-bold text-slate-800 text-sm">Initiation & Budget Check</p>
                         <p className="text-xs text-slate-500">Verified against Cost Item 4.2.1</p>
                         <p className="text-[10px] text-slate-400 mt-1">By Finance Officer • Oct 25, 09:30</p>
                      </div>
                   </div>

                   {/* Step 2 - Panel A */}
                   <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                         record.status === 'Pending Panel A' ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse' : 'bg-green-500 text-white'
                      }`}>
                         {record.status === 'Pending Panel A' ? <UserCheck size={18} /> : <CheckCircle size={18} />}
                      </div>
                      <div>
                         <p className="font-bold text-slate-800 text-sm">Panel A Approval</p>
                         <p className="text-xs text-slate-500">Council Secretary / Town Clerk</p>
                         {record.status === 'Pending Panel A' ? (
                            <div className="mt-2 flex gap-2">
                               <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700 shadow-md">Sign (Key)</button>
                               <button className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-medium hover:bg-slate-200">Reject</button>
                            </div>
                         ) : (
                            <p className="text-[10px] text-green-600 mt-1 font-mono flex items-center gap-1">
                               <Lock size={10} /> Sig: 0x4f...8a2
                            </p>
                         )}
                      </div>
                   </div>

                   {/* Step 3 - Panel B */}
                   <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors ${
                         record.status === 'Pending Panel B' ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 
                         record.status === 'Pending Panel A' ? 'bg-slate-200 text-slate-400' : 'bg-green-500 text-white'
                      }`}>
                         {record.status === 'Pending Panel B' ? <UserCheck size={18} /> : 
                          record.status === 'Pending Panel A' ? <Lock size={18} /> : <CheckCircle size={18} />}
                      </div>
                      <div>
                         <p className={`font-bold text-sm ${record.status === 'Pending Panel A' ? 'text-slate-400' : 'text-slate-800'}`}>Panel B Approval</p>
                         <p className="text-xs text-slate-500">Council Treasurer / Director Finance</p>
                         {record.status === 'Pending Panel A' && (
                            <p className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1 inline-block border border-amber-100">
                               <Lock size={10} className="inline mr-1" /> Locked until Panel A signs
                            </p>
                         )}
                         {record.status === 'Pending Panel B' && (
                            <div className="mt-2 flex gap-2">
                               <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700 shadow-md">Sign (Key)</button>
                            </div>
                         )}
                      </div>
                   </div>

                   {/* Step 4 - Disbursement */}
                   <div className="flex gap-4">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                         record.status === 'Paid' ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'
                       }`}>
                          <DollarSign size={18} />
                       </div>
                       <div>
                          <p className={`font-bold text-sm ${record.status === 'Paid' ? 'text-slate-800' : 'text-slate-400'}`}>Disbursement</p>
                          <p className="text-xs text-slate-500">Bank Transfer API</p>
                       </div>
                   </div>
                </div>
             </div>

             {/* Documents */}
             <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-bold text-slate-800 text-sm mb-3">Supporting Artifacts</h4>
                <ul className="space-y-2">
                   <li className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-100">
                      <span className="flex items-center gap-2 text-slate-600"><Download size={12} /> Payment Voucher.pdf</span>
                      <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={10} /> Verified</span>
                   </li>
                   <li className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-100">
                      <span className="flex items-center gap-2 text-slate-600"><Download size={12} /> Invoice_882.pdf</span>
                      <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={10} /> Verified</span>
                   </li>
                </ul>
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      {selectedTx && <TransactionDetail record={selectedTx} onClose={() => setSelectedTx(null)} />}

      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="border-b border-slate-200 flex gap-6">
            <button 
               onClick={() => setActiveTab('ledger')}
               className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ledger' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
               Commitments & Payments
            </button>
            <button 
               onClick={() => setActiveTab('returns')}
               className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'returns' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
               Returns & Reconciliation
            </button>
         </div>
         
         <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <History size={14} /> Last Reconciled: Today 09:00 AM
         </div>
      </div>

      {/* Ledger Content */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
           {/* Top Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 text-white p-6 rounded-xl shadow-md">
                 <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Current Account Balance</p>
                 <div className="flex items-baseline gap-1 mt-2">
                 <span className="text-lg font-medium text-slate-300">K</span>
                 <h2 className="text-3xl font-bold">2,450,800.00</h2>
                 </div>
                 <div className="mt-4 flex items-center text-xs text-slate-400 gap-2">
                    <ShieldCheck size={14} className="text-green-400" />
                    Synced with Bank Statement (Today 09:00)
                 </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <p className="text-slate-500 text-xs font-medium uppercase">Committed Funds</p>
                 <div className="flex items-baseline gap-1 mt-2">
                 <span className="text-lg font-medium text-slate-400">K</span>
                 <h2 className="text-3xl font-bold text-slate-900">1,800,000.00</h2>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
                    <div className="bg-amber-500 h-full w-[60%]"></div>
                 </div>
                 <p className="text-xs text-slate-500 mt-2">60% of Balance committed</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <p className="text-slate-500 text-xs font-medium uppercase">Pending Payments</p>
                 <div className="flex items-baseline gap-1 mt-2">
                 <span className="text-lg font-medium text-slate-400">K</span>
                 <h2 className="text-3xl font-bold text-slate-900">150,500.00</h2>
                 </div>
                 <div className="mt-4 flex gap-2">
                    <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100">2 Pending Panel A</span>
                    <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100">1 Pending Panel B</span>
                 </div>
              </div>
           </div>

           {/* Payment Ledger */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <h3 className="font-bold text-slate-800">Payment Ledger</h3>
                 <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                          type="text" 
                          placeholder="Search transaction or payee..." 
                          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                       />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                       <Download size={16} /> Export
                    </button>
                 </div>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                       <tr>
                          <th className="px-6 py-3">Reference</th>
                          <th className="px-6 py-3">Description</th>
                          <th className="px-6 py-3">Category</th>
                          <th className="px-6 py-3 text-right">Amount (K)</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {mockFinancials.map((record) => (
                          <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                             <td className="px-6 py-4 font-mono text-slate-600">{record.id}</td>
                             <td className="px-6 py-4 font-medium text-slate-900">{record.description}</td>
                             <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                                   {record.category}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right font-mono">{record.amount.toLocaleString()}</td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                   <span className={`w-2 h-2 rounded-full ${
                                      record.status === 'Paid' ? 'bg-green-500' :
                                      record.status === 'Approved' ? 'bg-blue-500' :
                                      'bg-amber-500'
                                   }`} />
                                   {record.status}
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <button 
                                  onClick={() => setSelectedTx(record)}
                                  className="text-blue-600 font-medium hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                   Inspect <ChevronRight size={14} />
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* Returns & Reconciliation Content */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
           {/* Enforcement Alert */}
           <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex items-start gap-4 shadow-sm">
              <div className="p-3 bg-red-100 rounded-full text-red-600 shrink-0">
                 <Lock size={24} />
              </div>
              <div>
                 <h3 className="font-bold text-red-900">Disbursement Gate Active</h3>
                 <p className="text-sm text-red-800 mt-1">
                    Q3 2024 Disbursements are currently <span className="font-bold">BLOCKED</span>. 
                    You must submit and verify the Q2 Expenditure Returns before funds can be released by the Ministry.
                 </p>
                 <div className="mt-4 flex gap-3">
                    <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700">
                       Upload Q2 Returns
                    </button>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Returns History */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800">Quarterly Returns Status</h3>
                 </div>
                 <div className="divide-y divide-slate-100">
                    <div className="p-6 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-500 font-bold">
                             <span className="text-xs uppercase">2024</span>
                             <span className="text-lg">Q3</span>
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-800">July - September</h4>
                             <p className="text-xs text-slate-500">Due: Oct 15, 2024</p>
                          </div>
                       </div>
                       <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">Not Started</span>
                    </div>
                    <div className="p-6 flex items-center justify-between bg-amber-50/30">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-amber-100 rounded-lg flex flex-col items-center justify-center text-amber-600 font-bold">
                             <span className="text-xs uppercase">2024</span>
                             <span className="text-lg">Q2</span>
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-800">April - June</h4>
                             <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                                <AlertCircle size={12} /> Overdue
                             </p>
                          </div>
                       </div>
                       <div className="flex flex-col items-end gap-1">
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Draft Saved</span>
                          <span className="text-[10px] text-slate-500">Missing Bank Statement</span>
                       </div>
                    </div>
                    <div className="p-6 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex flex-col items-center justify-center text-green-600 font-bold">
                             <span className="text-xs uppercase">2024</span>
                             <span className="text-lg">Q1</span>
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-800">January - March</h4>
                             <p className="text-xs text-green-600">Verified Apr 20, 2024</p>
                          </div>
                       </div>
                       <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                          <CheckCircle size={12} /> Verified
                       </span>
                    </div>
                 </div>
              </div>

              {/* Upload Area */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <h3 className="font-bold text-slate-800 mb-4">Q2 2024 Submission Checklist</h3>
                 <div className="space-y-4">
                    <div className="border border-slate-200 rounded-lg p-4 flex justify-between items-center hover:border-blue-400 transition-colors group cursor-pointer">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 text-green-600 rounded">
                             <FileSpreadsheet size={20} />
                          </div>
                          <div>
                             <p className="font-bold text-sm text-slate-700">Cashbook (Excel)</p>
                             <p className="text-xs text-slate-500">Uploaded by Treasurer</p>
                          </div>
                       </div>
                       <CheckCircle className="text-green-500" size={20} />
                    </div>

                    <div className="border border-dashed border-slate-300 rounded-lg p-4 flex justify-between items-center hover:bg-slate-50 transition-colors group cursor-pointer">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 text-slate-500 rounded group-hover:text-blue-600 group-hover:bg-blue-50">
                             <UploadCloud size={20} />
                          </div>
                          <div>
                             <p className="font-bold text-sm text-slate-700">Bank Statement (CSV/PDF)</p>
                             <p className="text-xs text-slate-500">Required for reconciliation</p>
                          </div>
                       </div>
                       <button className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded font-medium">Upload</button>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-4 flex justify-between items-center opacity-60">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 text-slate-400 rounded">
                             <ShieldCheck size={20} />
                          </div>
                          <div>
                             <p className="font-bold text-sm text-slate-700">Reconciliation Report</p>
                             <p className="text-xs text-slate-500">Auto-generated after upload</p>
                          </div>
                       </div>
                       <Lock size={16} className="text-slate-400" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Financials;
