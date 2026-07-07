'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/DashboardWidgets';
import { API_BASE } from '@/lib/types/auth';

export default function HRDashboard() {
  const [stats, setStats] = useState({
    totalStaff: 0,
    leaveRequests: 0,
    pendingDpdp: 0,
    newHires: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHRData() {
      try {
        const token = localStorage.getItem('educore_token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch staff
        const staffRes = await fetch(`${API_BASE}/api/hr/staff`, { headers });
        const staffData = await staffRes.json();
        const staffList = staffData.data || [];

        // Fetch leave requests
        const leaveRes = await fetch(`${API_BASE}/api/hr/leave`, { headers });
        const leaveData = await leaveRes.json();
        const leaveList = leaveData.data || [];

        setStats({
          totalStaff: staffList.length,
          leaveRequests: leaveList.filter((l: any) => l.status === 'PENDING').length,
          pendingDpdp: staffList.filter((s: any) => !s.dpdpConsentGiven).length,
          newHires: staffList.filter((s: any) => {
            if (!s.dateOfJoining) return false;
            const joinDate = new Date(s.dateOfJoining);
            const now = new Date();
            return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
          }).length,
        });
      } catch (err) {
        console.error('Failed to fetch HR data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHRData();
  }, []);

  return (
    <DashboardShell pageTitle="HR Manager Dashboard" requiredRole="HR_MANAGER">
      <div className="space-y-6 fade-in-up">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Staff"
            value={loading ? '...' : stats.totalStaff.toString()}
            icon="👥"
            color="pink"
          />
          <StatCard
            label="Pending Leaves"
            value={loading ? '...' : stats.leaveRequests.toString()}
            icon="🏖️"
            color="amber"
          />
          <StatCard
            label="DPDP Pending"
            value={loading ? '...' : stats.pendingDpdp.toString()}
            icon="🔒"
            color="red"
          />
          <StatCard
            label="New Hires (This Mth)"
            value={loading ? '...' : stats.newHires.toString()}
            icon="🆕"
            color="green"
          />
        </div>

        {/* DPDP Compliance Alert */}
        {stats.pendingDpdp > 0 && !loading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4">
            <div className="text-red-400 text-2xl mt-1">⚠️</div>
            <div>
              <h3 className="text-red-400 font-bold">DPDP Act 2025 Compliance Alert</h3>
              <p className="text-slate-300 text-sm mt-1 mb-3 leading-relaxed">
                You have {stats.pendingDpdp} staff members who have not provided explicit digital consent for processing their Personal Identifiable Information (PII). Under the DPDP Act 2025, continued processing of their data without logged consent may result in compliance violations.
              </p>
              <a href="/hr/dpdp" className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition border border-red-500/20 inline-block">
                Review Pending Consents
              </a>
            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
