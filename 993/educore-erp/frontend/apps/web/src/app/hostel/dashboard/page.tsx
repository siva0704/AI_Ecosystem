'use client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/DashboardWidgets';

export default function HostelDashboard() {
  return (
    <DashboardShell pageTitle="Hostel Management" requiredRole="HOSTEL_WARDEN">
      <div className="space-y-6 fade-in-up">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Rooms" value="80" icon="🛏️" color="teal" />
          <StatCard label="Occupied" value="74 / 80" icon="🏠" color="green" />
          <StatCard label="Students Present" value="210" icon="👦" color="cyan" />
          <StatCard label="Maintenance Req." value="3" icon="🔧" color="amber" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Room Block Status</h2>
          <div className="grid grid-cols-2 gap-2">
            {[['Block A', '20/20', '100%', 'full'], ['Block B', '18/20', '90%', 'ok'], ['Block C', '20/20', '100%', 'full'], ['Block D', '16/20', '80%', 'ok']].map(([block, occ, pct, st]) => (
              <div key={block} className="p-3 bg-slate-800/40 rounded-xl">
                <p className="text-white text-sm font-medium">{block}</p>
                <p className="text-slate-400 text-xs">{occ} occupied</p>
                <div className="mt-2 h-1.5 bg-slate-700 rounded-full"><div className="h-full bg-teal-500 rounded-full" style={{ width: pct }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
