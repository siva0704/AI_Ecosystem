'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, AlertBanner } from '@/components/ui/DashboardWidgets';

export default function StudentDashboard() {
  return (
    <DashboardShell pageTitle="My Learning" requiredRole="STUDENT">
      <div className="space-y-6 fade-in-up">
        <AlertBanner type="warning" message="Fee due: ₹12,500 before 15 July 2026. Pay online via parent portal." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Attendance" value="88.5%" icon="✅" color="green" />
          <StatCard label="Pending Assignments" value="2" icon="📝" color="amber" />
          <StatCard label="Next Exam" value="12 Jul" icon="✏️" color="indigo" />
          <StatCard label="Library Books Issued" value="3" icon="📚" color="purple" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">Today&apos;s Classes</h2>
            <div className="space-y-2">
              {[['08:00', 'Mathematics', '→ Room 201'], ['10:00', 'Physics', '→ Lab 3'], ['12:00', 'English Literature', '→ Room 105'], ['02:00', 'Computer Science', '→ Lab 1']].map(([t, s, r]) => (
                <div key={t} className="flex items-center gap-3 p-2.5 bg-slate-800/40 rounded-xl">
                  <span className="text-slate-500 text-xs font-mono">{t}</span>
                  <div>
                    <p className="text-white text-sm">{s}</p>
                    <p className="text-slate-400 text-xs">{r}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">Recent Results</h2>
            <div className="space-y-2">
              {[['Mathematics', '92/100', 'A+'], ['Physics', '84/100', 'A'], ['English', '78/100', 'B+'], ['Chemistry', '88/100', 'A']].map(([sub, marks, grade]) => (
                <div key={sub} className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl">
                  <p className="text-white text-sm">{sub}</p>
                  <div className="text-right">
                    <p className="text-slate-300 text-xs">{marks}</p>
                    <p className="text-green-400 text-xs font-semibold">{grade}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
