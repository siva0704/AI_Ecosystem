'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { API_BASE } from '@/lib/types/auth';
import { AlertBanner } from '@/components/ui/DashboardWidgets';

interface LeaveRequest {
  id: string;
  staffFirstName: string;
  staffLastName: string;
  staffRole: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  daysCount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
}

export default function LeaveManagementPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/hr/leave`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch leave requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/hr/leave/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, reviewNote: status === 'APPROVED' ? 'Approved by HR' : 'Declined by HR' }),
      });
      
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Leave request ${status.toLowerCase()} successfully.` });
        fetchLeaveRequests();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update request' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed' });
    }
  };

  return (
    <DashboardShell pageTitle="Leave Management" requiredRole="HR_MANAGER">
      <div className="space-y-6 fade-in-up">
        {message && <AlertBanner type={message.type} message={message.text} />}

        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
            <h2 className="text-white font-semibold">Pending & Recent Requests</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-white/5">
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff Member</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Leave Details</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-sm">Loading requests...</td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-sm">No leave requests found.</td></tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-4">
                        <div className="text-white text-sm font-medium">{req.staffFirstName} {req.staffLastName}</div>
                        <div className="text-slate-500 text-xs">{req.staffRole}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-300 text-sm font-medium">{req.leaveType}</div>
                        <div className="text-slate-500 text-xs mt-0.5 truncate max-w-xs" title={req.reason}>
                          {req.reason || 'No reason provided'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-300 text-sm">{req.daysCount} Day(s)</div>
                        <div className="text-slate-500 text-xs font-mono">
                          {req.fromDate} to {req.toDate}
                        </div>
                      </td>
                      <td className="p-4">
                        {req.status === 'PENDING' && <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">Pending</span>}
                        {req.status === 'APPROVED' && <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">Approved</span>}
                        {req.status === 'REJECTED' && <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium">Rejected</span>}
                        {req.status === 'CANCELLED' && <span className="px-2 py-1 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-medium">Cancelled</span>}
                      </td>
                      <td className="p-4 text-right">
                        {req.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleReview(req.id, 'APPROVED')}
                              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReview(req.id, 'REJECTED')}
                              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {req.status !== 'PENDING' && (
                          <span className="text-slate-500 text-xs italic">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
