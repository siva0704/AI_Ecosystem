'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AlertBanner } from '@/components/ui/DashboardWidgets';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  grade: string;
  section: string;
}

interface FeeTransaction {
  id: string;
  fee_head: string;
  amount_display: string;
  payment_status: 'PENDING' | 'INITIATED' | 'PROCESSING' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  payment_mode: string;
  created_at: string;
}

export default function FeeCollectionPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [history, setHistory] = useState<FeeTransaction[]>([]);
  const [feeHeads, setFeeHeads] = useState<Record<string, { amount_paise: number; description: string }>>({});
  const [selectedFeeHead, setSelectedFeeHead] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch student roster
  useEffect(() => {
    async function fetchStudents() {
      try {
        const token = localStorage.getItem('educore_token');
        const res = await fetch(`http://localhost:4000/api/students?limit=50&search=${search}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setStudents(data.data);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    }
    const delayDebounce = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Fetch Fee structures & Student history
  useEffect(() => {
    async function fetchStructures() {
      try {
        const token = localStorage.getItem('educore_token');
        const res = await fetch('http://localhost:4000/api/fees/structures', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setFeeHeads(data.data);
          setSelectedFeeHead(Object.keys(data.data)[0] || '');
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchStructures();
  }, []);

  useEffect(() => {
    if (!selectedStudent) return;
    const studentId = selectedStudent.id;
    async function fetchHistory() {
      try {
        const token = localStorage.getItem('educore_token');
        const res = await fetch(`http://localhost:4000/api/fees?studentId=${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setHistory(data.data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchHistory();
  }, [selectedStudent]);

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch('http://localhost:4000/api/fees/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          feeHeadId: selectedFeeHead,
          paymentMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Transaction recorded successfully in ledger.' });
        // Refresh history
        const updatedRes = await fetch(`http://localhost:4000/api/fees?studentId=${selectedStudent.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updatedData = await updatedRes.json();
        if (updatedData.success) {
          setHistory(updatedData.data);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to record transaction' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell pageTitle="Fee Collection & Cash Counter" requiredRole="ACCOUNTANT">
      <div className="space-y-6 max-w-6xl mx-auto fade-in-up">
        {message && <AlertBanner type={message.type} message={message.text} />}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Column 1: Student Search */}
          <div className="glass rounded-2xl p-5 space-y-4 h-fit">
            <h3 className="text-white font-bold text-sm">Find Student</h3>
            <input
              type="text"
              placeholder="🔍 Search name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
            />

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => {
                    setSelectedStudent(student);
                    setMessage(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition flex justify-between items-center ${
                    selectedStudent?.id === student.id ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-slate-800/40 hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <div>
                    <p className="text-white text-sm font-medium">{student.firstName} {student.lastName}</p>
                    <p className="text-slate-500 text-xs">{student.rollNumber} · Class {student.grade}-{student.section}</p>
                  </div>
                  <span className="text-slate-400 text-xs">➔</span>
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: Collect Fee / Create Transaction */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">New Payment Record</h3>
            {selectedStudent ? (
              <form onSubmit={handleCollect} className="space-y-4">
                <div className="p-3 bg-slate-900/60 rounded-xl">
                  <span className="text-slate-400 text-xs block">Paying Student</span>
                  <span className="text-white font-semibold text-sm">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                  <span className="text-slate-500 text-xs block font-mono">{selectedStudent.rollNumber}</span>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Select Fee Head</label>
                  <select
                    value={selectedFeeHead}
                    onChange={(e) => setSelectedFeeHead(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                  >
                    {Object.entries(feeHeads).map(([key, head]) => (
                      <option key={key} value={key}>{head.description}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="UPI">UPI (GPay/PhonePe)</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="NEFT">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CASH">Cash Over Counter</option>
                  </select>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                  <p className="text-amber-400 text-xs leading-relaxed">
                    ⚠️ <strong>Audit Policy:</strong> Submitting this payment creates an immutable ledger entry. Ledger modifications or deletions are blocked at database engine level.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white font-semibold text-sm py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? 'Recording...' : 'Record Receipt'}
                </button>
              </form>
            ) : (
              <div className="text-center p-10 text-slate-500 text-xs">
                Select a student from the panel to collect payments.
              </div>
            )}
          </div>

          {/* Column 3: Ledger History */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="text-white font-bold text-sm">Receipt Ledger History</h3>
            {selectedStudent ? (
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-10">No past transactions found.</p>
                ) : (
                  history.map((tx) => (
                    <div key={tx.id} className="p-3 bg-slate-900/60 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-xs font-semibold">{tx.fee_head}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          tx.payment_status === 'CAPTURED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>{tx.payment_status}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>{tx.amount_display}</span>
                        <span className="font-mono">{tx.payment_mode}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-center p-10 text-slate-500 text-xs">
                Select student to inspect transaction trails.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
