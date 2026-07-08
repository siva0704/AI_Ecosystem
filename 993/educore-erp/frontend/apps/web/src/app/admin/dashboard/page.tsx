'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, QuickAction, AlertBanner } from '@/components/ui/DashboardWidgets';

interface AdminStats {
  totalStudents: number;
  totalStaff: number;
  collectionsThisMonth: string;
  pendingDues: string;
  attendanceRate: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem('educore_token');
        const res = await fetch('http://localhost:4000/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <DashboardShell pageTitle="Institution Dashboard" requiredRole="INSTITUTION_ADMIN">
      <div className="space-y-6 fade-in-up">
        <AlertBanner type="info" message={`Fee status: ${stats?.pendingDues || '₹0'} pending collection. RLS boundaries active.`} />

        {loading ? (
          <div className="text-slate-400 text-sm">Loading admin metrics...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Students" value={stats?.totalStudents ?? 1840} icon="👦" color="indigo" />
              <StatCard label="Total Staff" value={stats?.totalStaff ?? 142} icon="👨‍🏫" color="cyan" />
              <StatCard label="Collections Total" value={stats?.collectionsThisMonth || '₹0'} icon="💰" color="green" />
              <StatCard label="Pending Dues" value={stats?.pendingDues || '₹0'} icon="⚠️" color="amber" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Attendance Rate" value={stats?.attendanceRate || '94.2%'} icon="✅" color="green" />
              <StatCard label="Active Classes" value="42" icon="🏫" color="purple" />
              <StatCard label="Compliance Score" value="98.1%" icon="⚖️" color="teal" />
              <StatCard label="Open Approvals" value="5" icon="📬" color="pink" />
            </div>
          </>
        )}

        <div>
          <h2 className="text-white font-semibold text-base mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <QuickAction label="Student Directory" icon="🎓" href="/admin/students" />
            <QuickAction label="Academic Setup" icon="📚" href="/admin/academic" />
            <QuickAction label="Add Staff" icon="👥" href="/hr/staff" />
            <QuickAction label="Fee Structures" icon="💰" href="/finance/fees" />
            <QuickAction label="Reports" icon="📊" href="/admin/reports" />
            <QuickAction label="Settings" icon="⚙️" href="/admin/settings" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3">Department Overview</h3>
            <div className="space-y-2">
              {[
                ['Science', '320 students', '92%'],
                ['Commerce', '280 students', '95%'],
                ['Arts', '210 students', '88%'],
                ['Engineering', '180 students', '91%'],
              ].map(([dept, students, att]) => (
                <div key={dept} className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl">
                  <div>
                    <p className="text-white text-sm font-medium">{dept}</p>
                    <p className="text-slate-400 text-xs">{students}</p>
                  </div>
                  <span className="text-green-400 text-sm font-semibold">{att}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3">Recent Activity</h3>
            <div className="space-y-3">
              {[
                'Fee payment received — Arjun Patel ₹12,500',
                'New admission — Priya Sharma Grade 6',
                'Leave approved — Anitha Menon (1 day)',
                'Report card generated — Class 10 A',
              ].map((act) => (
                <div key={act} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                  <p className="text-slate-300 text-xs">{act}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
