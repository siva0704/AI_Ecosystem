'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, AlertBanner, QuickAction } from '@/components/ui/DashboardWidgets';

export default function ParentDashboard() {
  return (
    <DashboardShell pageTitle="Ward Overview" requiredRole="PARENT">
      <div className="space-y-6 fade-in-up">
        <AlertBanner type="warning" message="Fee due: ₹12,500 before 15 July 2026. Tap 'Fee Payment' to pay now." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Arjun's Attendance" value="88.5%" icon="✅" color="green" />
          <StatCard label="Fee Due" value="₹12,500" icon="💳" color="amber" />
          <StatCard label="Pending Homework" value="2" icon="📝" color="pink" />
          <StatCard label="Consent Requests" value="1" icon="📬" color="purple" />
        </div>

        <div>
          <h2 className="text-white font-semibold text-base mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            <QuickAction label="Pay Fee" icon="💳" href="/parent/fees" />
            <QuickAction label="Track Bus" icon="📍" href="/parent/transport" />
            <QuickAction label="View Results" icon="📊" href="/parent/results" />
            <QuickAction label="Consent Inbox" icon="📬" href="/parent/consent" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-3">🚌 Bus Tracking</h2>
            <div className="bg-slate-800/40 rounded-xl p-4 text-center">
              <div className="text-4xl mb-2">📍</div>
              <p className="text-white font-medium">Route 4 — Bus KA-03-AB-1234</p>
              <p className="text-green-400 text-sm mt-1">Near MG Road · ETA 8 mins</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="pulse-dot w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-slate-400 text-xs">Live tracking active</span>
              </div>
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-3">📊 Recent Grades</h2>
            <div className="space-y-2">
              {[['Mathematics', '92/100', 'A+'], ['Physics', '84/100', 'A'], ['English', '78/100', 'B+']].map(([sub, marks, grade]) => (
                <div key={sub} className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl">
                  <p className="text-white text-sm">{sub}</p>
                  <div className="text-right">
                    <p className="text-slate-300 text-xs">{marks}</p>
                    <p className="text-green-400 text-xs font-bold">{grade}</p>
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
