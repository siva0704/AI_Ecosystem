'use client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/ui/DashboardWidgets';

export default function LibraryDashboard() {
  return (
    <DashboardShell pageTitle="Library Management" requiredRole="LIBRARIAN">
      <div className="space-y-6 fade-in-up">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Books Issued" value="48" icon="📚" color="purple" />
          <StatCard label="Overdue Books" value="5" icon="⚠️" color="red" />
          <StatCard label="Reservations" value="7" icon="🔖" color="indigo" />
          <StatCard label="New Arrivals" value="12" icon="✨" color="green" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Overdue Returns</h2>
          <div className="space-y-2">
            {[['Arjun Patel', 'Introduction to Algorithms', '3 days'], ['Priya Singh', 'Physics Vol. II', '7 days'], ['Rohan Mehta', 'English Grammar', '1 day']].map(([student, book, days]) => (
              <div key={student} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                <span className="text-red-400">📕</span>
                <div className="flex-1"><p className="text-white text-sm">{student}</p><p className="text-slate-400 text-xs">{book}</p></div>
                <span className="text-red-400 text-xs font-medium">+{days} overdue</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
