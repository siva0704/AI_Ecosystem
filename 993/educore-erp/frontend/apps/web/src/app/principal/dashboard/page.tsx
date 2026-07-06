'use client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, AlertBanner } from '@/components/ui/DashboardWidgets';

export default function PrincipalDashboard() {
  return (
    <DashboardShell pageTitle="Principal's Overview" requiredRole="PRINCIPAL">
      <div className="space-y-6 fade-in-up">
        <AlertBanner type="info" message="3 approval requests pending your review — field trip consent and 2 leave applications." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Classes Running" value="42" icon="🏫" color="indigo" />
          <StatCard label="Avg Attendance" value="93.8%" icon="✅" color="green" />
          <StatCard label="Pending Approvals" value="3" icon="📬" color="amber" />
          <StatCard label="Upcoming Exams" value="2" icon="✏️" color="purple" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Department Attendance Today</h2>
          <div className="space-y-2">
            {[['Science', '94%'], ['Commerce', '97%'], ['Arts', '89%'], ['Engineering', '92%']].map(([d, a]) => (
              <div key={d} className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-xl">
                <span className="text-white text-sm flex-1">{d}</span>
                <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: a }} />
                </div>
                <span className="text-slate-300 text-xs w-10 text-right">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
