'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AlertBanner } from '@/components/ui/DashboardWidgets';
import { API_BASE } from '@/lib/types/auth';

interface Leave {
  id: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  daysCount: number;
  reason: string;
  status: string;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
}

export default function LeavesDashboardPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Modal State
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'SICK_LEAVE',
    fromDate: '',
    toDate: '',
    daysCount: 1,
    reason: '',
  });

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/leaves`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLeaves(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeaves(); }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Leave application submitted successfully.' });
        setApplyModalOpen(false);
        setForm({ leaveType: 'SICK_LEAVE', fromDate: '', toDate: '', daysCount: 1, reason: '' });
        loadLeaves();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit leave.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed.' });
    }
  };

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this leave?`)) return;
    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/leaves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Leave successfully ${status.toLowerCase()}.` });
        loadLeaves();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update leave.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed.' });
    }
  };

  return (
    <DashboardShell pageTitle="Leave Management" requiredRole="STAFF">
      <div className="space-y-6 max-w-6xl mx-auto fade-in-up">
        {message && <AlertBanner type={message.type} message={message.text} />}

        {/* Action Header */}
        <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-5">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Leave Requests</h2>
            <p className="text-sm text-slate-400">View and manage staff leaves</p>
          </div>
          <button 
            onClick={() => setApplyModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-semibold transition flex items-center gap-2"
          >
            + Apply for Leave
          </button>
        </div>

        {/* Leaves Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 bg-black/20">
                  <tr className="text-slate-400 text-xs uppercase tracking-wider text-left">
                    <th className="px-6 py-4 font-medium">Employee</th>
                    <th className="px-6 py-4 font-medium">Type & Duration</th>
                    <th className="px-6 py-4 font-medium">Reason</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaves.map(l => (
                    <tr key={l.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{l.firstName} {l.lastName}</div>
                        <div className="text-xs text-slate-500 font-mono">{l.employeeId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-indigo-300 font-medium mb-1">{l.leaveType.replace('_', ' ')}</div>
                        <div className="text-xs text-slate-400">
                          {new Date(l.fromDate).toLocaleDateString()} to {new Date(l.toDate).toLocaleDateString()}
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">{l.daysCount}d</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={l.reason}>
                        {l.reason || 'No reason provided'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          l.status === 'APPROVED' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                          l.status === 'REJECTED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        {l.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleReview(l.id, 'APPROVED')} className="text-green-400 hover:text-green-300 transition text-xs font-bold">APPROVE</button>
                            <button onClick={() => handleReview(l.id, 'REJECTED')} className="text-red-400 hover:text-red-300 transition text-xs font-bold">REJECT</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-500">No leave requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Apply Modal */}
        {applyModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Apply for Leave</h3>
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">Leave Type</label>
                  <select value={form.leaveType} onChange={e => setForm({...form, leaveType: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500">
                    <option value="SICK_LEAVE">Sick Leave</option>
                    <option value="CASUAL_LEAVE">Casual Leave</option>
                    <option value="EARNED_LEAVE">Earned Leave</option>
                    <option value="MATERNITY_LEAVE">Maternity Leave</option>
                    <option value="UNPAID_LEAVE">Unpaid Leave</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1.5">From Date</label>
                    <input type="date" required value={form.fromDate} onChange={e => setForm({...form, fromDate: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1.5">To Date</label>
                    <input type="date" required value={form.toDate} onChange={e => setForm({...form, toDate: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">Total Days</label>
                  <input type="number" step="0.5" min="0.5" required value={form.daysCount} onChange={e => setForm({...form, daysCount: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">Reason (Optional)</label>
                  <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" placeholder="Enter reason..." />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setApplyModalOpen(false)} className="px-5 py-2.5 text-slate-400 hover:text-white text-sm font-medium transition">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-semibold transition">Submit Leave</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
