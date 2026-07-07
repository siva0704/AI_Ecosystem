'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { API_BASE } from '@/lib/types/auth';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  SUBMITTED:     { label: 'Submitted',      color: 'text-blue-300 bg-blue-500/10 border-blue-500/20',     dot: 'bg-blue-400' },
  PENDING_DOCS:  { label: 'Pending Docs',   color: 'text-amber-300 bg-amber-500/10 border-amber-500/20',  dot: 'bg-amber-400' },
  DOCS_RECEIVED: { label: 'Docs Received',  color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',     dot: 'bg-cyan-400' },
  UNDER_REVIEW:  { label: 'Under Review',   color: 'text-purple-300 bg-purple-500/10 border-purple-500/20', dot: 'bg-purple-400' },
  APPROVED:      { label: 'Approved',       color: 'text-green-300 bg-green-500/10 border-green-500/20',  dot: 'bg-green-400' },
  REJECTED:      { label: 'Rejected',       color: 'text-red-300 bg-red-500/10 border-red-500/20',        dot: 'bg-red-400' },
  COMPLETED:     { label: 'Completed',      color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
};

export default function AdminAdmissionsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('educore_token');
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE}/api/admissions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.data || []);
        setTotal(data.pagination?.total ?? 0);

        // Compute stats from all data (not paginated)
        const allRes = await fetch(`${API_BASE}/api/admissions?limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allData = await allRes.json();
        if (allData.success) {
          const all = allData.data || [];
          setStats({
            total: all.length,
            pending: all.filter((a: any) => ['SUBMITTED', 'PENDING_DOCS', 'DOCS_RECEIVED', 'UNDER_REVIEW'].includes(a.status)).length,
            approved: all.filter((a: any) => ['APPROVED', 'COMPLETED'].includes(a.status)).length,
            rejected: all.filter((a: any) => a.status === 'REJECTED').length,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch admissions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, [statusFilter, page]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchApplications(); };

  return (
    <DashboardShell pageTitle="Admissions Management" requiredRole="INSTITUTION_ADMIN">
      <div className="space-y-6 fade-in-up">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Applications', value: stats.total, icon: '📋', color: 'indigo' },
            { label: 'Pending Review', value: stats.pending, icon: '⏳', color: 'amber' },
            { label: 'Approved', value: stats.approved, icon: '✅', color: 'green' },
            { label: 'Rejected', value: stats.rejected, icon: '❌', color: 'red' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{loading ? '…' : s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, or APP code..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="submit" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-medium transition">
                Search
              </button>
            </form>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <Link href="/admin/admissions/new"
              className="px-5 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-white text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap">
              + Walk-in Entry
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">App Code</th>
                  <th className="text-left px-5 py-3 font-medium">Student Name</th>
                  <th className="text-left px-5 py-3 font-medium">Grade</th>
                  <th className="text-left px-5 py-3 font-medium">Parent Email</th>
                  <th className="text-left px-5 py-3 font-medium">Source</th>
                  <th className="text-left px-5 py-3 font-medium">Docs Pending</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Submitted</th>
                  <th className="text-left px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-5 py-4"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-slate-500">
                      <div className="text-4xl mb-3">📋</div>
                      <p>No applications found</p>
                      {statusFilter && <p className="text-sm mt-1">Try clearing the status filter</p>}
                    </td>
                  </tr>
                ) : (
                  applications.map(app => {
                    const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG['SUBMITTED'];
                    return (
                      <tr key={app.application_id} className="hover:bg-white/5 transition">
                        <td className="px-5 py-4">
                          <span className="font-mono font-semibold text-indigo-300 text-xs tracking-wider">{app.app_code}</span>
                        </td>
                        <td className="px-5 py-4 text-white font-medium">
                          {app.student_first_name} {app.student_last_name}
                        </td>
                        <td className="px-5 py-4 text-slate-300">Gr. {app.applying_for_grade}</td>
                        <td className="px-5 py-4 text-slate-400 max-w-[180px] truncate">{app.parent_email}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            app.source === 'WALK_IN' ? 'bg-purple-500/10 text-purple-300' : 'bg-blue-500/10 text-blue-300'
                          }`}>
                            {app.source === 'WALK_IN' ? '🚶 Walk-in' : '🌐 Online'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {Number(app.pending_docs) > 0 ? (
                            <span className="text-amber-300 font-medium">{app.pending_docs} pending</span>
                          ) : (
                            <span className="text-green-400 text-xs">All received</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs">
                          {new Date(app.submitted_at).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-5 py-4">
                          <Link href={`/admin/admissions/${app.application_id}`}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition">
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 15 && (
            <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between text-sm text-slate-400">
              <span>Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, total)} of {total}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition">←</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition">→</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
