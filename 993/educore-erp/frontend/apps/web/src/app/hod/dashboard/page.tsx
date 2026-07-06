'use client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/DashboardWidgets';

export default function HODDashboard() {
  return (
    <DashboardShell pageTitle="Department Head" requiredRole="HOD">
      <div className="space-y-6 fade-in-up">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Department Staff" value="18" icon="👥" color="cyan" />
          <StatCard label="Subjects" value="12" icon="📖" color="indigo" />
          <StatCard label="Avg Attendance" value="91.5%" icon="✅" color="green" />
          <StatCard label="Exam Days" value="5" icon="✏️" color="amber" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Subject Performance</h2>
          <div className="space-y-2">
            {[['Mathematics', '82%', '28 teachers'], ['Physics', '78%', '12 teachers'], ['Chemistry', '85%', '10 teachers']].map(([sub, avg, staff]) => (
              <div key={sub} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                <div className="flex-1"><p className="text-white text-sm">{sub}</p><p className="text-slate-400 text-xs">{staff}</p></div>
                <span className="text-cyan-400 font-semibold text-sm">{avg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
