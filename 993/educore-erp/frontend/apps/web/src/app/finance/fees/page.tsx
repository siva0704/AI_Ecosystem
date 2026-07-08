'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AlertBanner } from '@/components/ui/DashboardWidgets';
import { API_BASE } from '@/lib/types/auth';

interface Transaction {
  id: string;
  studentId: string;
  feeHead: string;
  amount_rupees: string;
  amount_display: string;
  currency: string;
  paymentStatus: string;
  paymentMode: string;
  createdAt: string;
  studentFirstName: string;
  studentLastName: string;
  rollNumber: string;
}

export default function FeesDashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ totalCollected: 0, pendingCount: 0 });
  const [students, setStudents] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<Record<string, any>>({});
  
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Forms state
  const [paymentForm, setPaymentForm] = useState({ feeHeadId: 'annual-tuition', paymentMode: 'UPI' });
  const [concessionForm, setConcessionForm] = useState({ amountRupees: '', reason: '' });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('educore_token');
      
      const tRes = await fetch(`${API_BASE}/api/fees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tData = await tRes.json();
      if (tData.success) {
        setTransactions(tData.data);
        setStats({
          totalCollected: tData.meta.total_collected_paise / 100,
          pendingCount: tData.meta.pending_count,
        });
      }

      const fRes = await fetch(`${API_BASE}/api/fees/structures`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fData = await fRes.json();
      if (fData.success) setFeeStructures(fData.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      const token = localStorage.getItem('educore_token');
      const sRes = await fetch(`${API_BASE}/api/students?limit=20&search=${searchStudent}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sData = await sRes.json();
      if (sData.success) setStudents(sData.data);
    };
    const timer = setTimeout(fetchStudents, 300);
    return () => clearTimeout(timer);
  }, [searchStudent]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setLoading(true); setMessage(null);

    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/fees/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          ...paymentForm
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Payment captured successfully.' });
        loadData();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleConcession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !concessionForm.amountRupees) return;
    setLoading(true); setMessage(null);

    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/fees/concession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          amountPaise: Math.round(parseFloat(concessionForm.amountRupees) * 100),
          reason: concessionForm.reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Concession applied successfully.' });
        loadData();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell pageTitle="Finance Dashboard" requiredRole="ACCOUNTANT">
      <div className="space-y-6 max-w-6xl mx-auto fade-in-up">
        {message && <AlertBanner type={message.type} message={message.text} />}

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Total Collected</h3>
            <p className="text-2xl font-bold text-white">₹{stats.totalCollected.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Panel 1: Payment & Concession */}
          <div className="glass rounded-2xl p-5 space-y-6">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">Select Student</label>
              <input
                type="text"
                placeholder="🔍 Type Student Name..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 mb-2"
              />
              <div className="max-h-[120px] overflow-y-auto space-y-1.5">
                {students.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedStudent(s)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition border ${
                      selectedStudent?.id === s.id ? 'bg-indigo-500/20 border-indigo-500/30 text-white' : 'bg-slate-800/40 hover:bg-slate-800/80 border-transparent text-slate-300'
                    }`}
                  >
                    {s.firstName} {s.lastName} ({s.rollNumber})
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <h3 className="text-white font-bold text-sm mb-4">Capture Payment</h3>
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Fee Head</label>
                  <select
                    value={paymentForm.feeHeadId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, feeHeadId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {Object.entries(feeStructures).map(([id, val]: any) => (
                      <option key={id} value={id}>{val.description}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Payment Mode</label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading || !selectedStudent}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-800 text-white font-semibold text-sm py-3 rounded-xl transition cursor-pointer"
                >
                  Capture Payment
                </button>
              </form>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <h3 className="text-white font-bold text-sm mb-4">Grant Concession</h3>
              <form onSubmit={handleConcession} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={concessionForm.amountRupees}
                    onChange={(e) => setConcessionForm({ ...concessionForm, amountRupees: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Reason</label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    value={concessionForm.reason}
                    onChange={(e) => setConcessionForm({ ...concessionForm, reason: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !selectedStudent}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-sm py-3 rounded-xl transition cursor-pointer"
                >
                  Apply Concession
                </button>
              </form>
            </div>
          </div>

          {/* Panel 2 & 3: Transaction Ledger */}
          <div className="md:col-span-2 glass rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Transaction Ledger (Immutable)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 text-xs uppercase">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Student</th>
                    <th className="py-2.5">Particulars</th>
                    <th className="py-2.5">Mode</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="text-xs text-slate-300 hover:bg-slate-900/10">
                      <td className="py-3">{new Date(txn.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 font-medium text-slate-200">{txn.studentFirstName} {txn.studentLastName} ({txn.rollNumber})</td>
                      <td className="py-3 truncate max-w-[200px]">{txn.feeHead}</td>
                      <td className="py-3 font-mono text-[10px]">{txn.paymentMode}</td>
                      <td className={`py-3 text-right font-bold ${txn.amount_rupees.startsWith('-') ? 'text-indigo-400' : 'text-green-400'}`}>
                        {txn.amount_display}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No transactions recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
