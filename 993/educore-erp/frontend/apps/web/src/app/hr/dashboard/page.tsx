'use client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, AlertBanner } from '@/components/ui/DashboardWidgets';

export default function HRDashboard() {
  return (
    <DashboardShell pageTitle="Human Resources" requiredRole="HR_MANAGER">
      <div className="space-y-6 fade-in-up">
        <AlertBanner type="warning" message="8 staff members have pending DPDP consent confirmations. Compliance deadline: 10 July." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Staff" value="142" icon="👥" color="pink" />
          <StatCard label="On Leave Today" value="4" icon="🏖️" color="amber" />
          <StatCard label="Pending Onboardings" value="2" icon="🆕" color="indigo" />
          <StatCard label="DPDP Pending" value="8" icon="🔒" color="red" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Staff Overview by Department</h2>
          <div className="space-y-2">
            {[['Teaching Staff', '98', '4 on leave'], ['Admin Staff', '22', '0 on leave'], ['Support Staff', '18', '0 on leave'], ['Contract Staff', '4', '0 on leave']].map(([type, count, leave]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <div><p className="text-white text-sm">{type}</p><p className="text-slate-400 text-xs">{leave}</p></div>
                <span className="text-pink-400 font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
