'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, QuickAction, AlertBanner } from '@/components/ui/DashboardWidgets';

export default function SuperAdminDashboard() {
  return (
    <DashboardShell pageTitle="Platform Overview" requiredRole="SUPER_ADMIN">
      <div className="space-y-6 fade-in-up">
        <AlertBanner type="info" message="EduCore Platform is operating normally. All systems green." />

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatCard label="Total Tenants" value="48" icon="🏫" color="indigo" trend={{ value: '+2 this month', positive: true }} />
          <StatCard label="Active Tenants" value="46" icon="✅" color="green" />
          <StatCard label="Monthly Revenue" value="₹24.8L" icon="💰" color="amber" trend={{ value: '+8.4%', positive: true }} />
          <StatCard label="Platform Uptime" value="99.97%" icon="❤️" color="green" />
          <StatCard label="Active Users" value="18,420" icon="👥" color="cyan" />
          <StatCard label="API Requests/Day" value="2.1M" icon="📡" color="purple" />
          <StatCard label="Open Incidents" value="0" icon="🛡️" color="green" />
          <StatCard label="Feature Flags" value="12" icon="🚩" color="orange" />
        </div>

        <div>
          <h2 className="text-white font-semibold text-base mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <QuickAction label="Add Tenant" icon="➕" href="/platform/tenants/onboard" />
            <QuickAction label="Billing" icon="💳" href="/platform/billing" />
            <QuickAction label="Feature Flags" icon="🚩" href="/platform/flags" />
            <QuickAction label="Audit Log" icon="📋" href="/platform/audit" />
            <QuickAction label="System Health" icon="❤️" href="/platform/health" />
            <QuickAction label="API Docs" icon="📖" href="/platform/docs" />
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Tenant Activity (Demo Data)</h2>
          <div className="space-y-2">
            {['Greenfield Academy', 'Sri Vidya Mandir', 'National Public School', 'Delhi Model School'].map((name, i) => (
              <div key={name} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">{name[0]}</div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{name}</p>
                  <p className="text-slate-400 text-xs">Active · {800 + i * 200} students</p>
                </div>
                <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full">Live</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
