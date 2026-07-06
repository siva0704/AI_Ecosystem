'use client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/DashboardWidgets';

export default function TransportDashboard() {
  return (
    <DashboardShell pageTitle="Transport Operations" requiredRole="TRANSPORT_OFFICER">
      <div className="space-y-6 fade-in-up">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Buses Active" value="12 / 14" icon="🚌" color="orange" />
          <StatCard label="Students In Transit" value="320" icon="👦" color="cyan" />
          <StatCard label="Route Deviations" value="1" icon="⚠️" color="amber" />
          <StatCard label="Incidents Today" value="0" icon="🛡️" color="green" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">🗺️ Live Fleet Status</h2>
          <div className="space-y-2">
            {[['Route 1 — KA-01-AB-1234', 'MG Road', '42 students', '🟢'], ['Route 2 — KA-02-CD-5678', 'Indiranagar', '38 students', '🟢'], ['Route 3 — KA-03-EF-9012', 'Koramangala', '29 students', '🟡 Delayed'], ['Route 4 — KA-04-GH-3456', 'Whitefield', '35 students', '🟢']].map(([route, loc, students, status]) => (
              <div key={route} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                <span className="text-lg">🚌</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{route}</p>
                  <p className="text-slate-400 text-xs">📍 {loc} · {students}</p>
                </div>
                <span className="text-xs">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
