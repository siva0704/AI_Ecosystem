'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, AlertBanner } from '@/components/ui/DashboardWidgets';

interface HRStats {
  totalStaff: number;
  onLeaveToday: number;
  pendingOnboardings: number;
  pendingDPDPConsents: number;
}

export default function HRDashboard() {
  const [stats, setStats] = useState<HRStats | null>(null);
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
    <DashboardShell pageTitle="Human Resources" requiredRole="HR_MANAGER">
      <div className="space-y-6 fade-in-up">
        {loading ? (
          <div className="text-slate-400 text-sm">Loading HR state...</div>
        ) : (
          <>
            {stats && stats.pendingDPDPConsents > 0 ? (
              <AlertBanner type="warning" message={`${stats.pendingDPDPConsents} staff members have pending DPDP consent confirmations. Compliance deadline: 10 July.`} />
            ) : (
              <AlertBanner type="success" message="✓ All staff members have signed active DPDP consent agreements." />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Staff" value={stats?.totalStaff ?? 142} icon="👥" color="pink" />
              <StatCard label="On Leave Today" value={stats?.onLeaveToday ?? 4} icon="🏖️" color="amber" />
              <StatCard label="Pending Onboardings" value={stats?.pendingOnboardings ?? 2} icon="🆕" color="indigo" />
              <StatCard label="DPDP Pending" value={stats?.pendingDPDPConsents ?? 0} icon="🔒" color="red" />
            </div>
          </>
        )}

        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Staff Overview by Department</h2>
          <div className="space-y-2">
            {[
              ['Teaching Staff', '98', '4 on leave'],
              ['Admin Staff', '22', '0 on leave'],
              ['Support Staff', '18', '0 on leave'],
              ['Contract Staff', '4', '0 on leave'],
            ].map(([type, count, leave]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <div>
                  <p className="text-white text-sm font-medium">{type}</p>
                  <p className="text-slate-400 text-xs">{leave}</p>
                </div>
                <span className="text-pink-400 font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
