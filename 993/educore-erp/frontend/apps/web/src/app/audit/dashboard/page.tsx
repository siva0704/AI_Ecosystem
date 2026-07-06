'use client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, AlertBanner } from '@/components/ui/DashboardWidgets';

export default function AuditDashboard() {
  return (
    <DashboardShell pageTitle="Compliance & Audit" requiredRole="AUDITOR">
      <div className="space-y-6 fade-in-up">
        <AlertBanner type="info" message="Read-only access. All actions are logged. Session expires in 8 hours." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Compliance Score" value="96.2%" icon="⚖️" color="teal" />
          <StatCard label="Open Findings" value="2" icon="🔍" color="amber" />
          <StatCard label="Last Audit Date" value="30 Jun" icon="📅" color="indigo" />
          <StatCard label="Access Level" value="T6 — R/O" icon="🔒" color="indigo" />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Financial Trail Summary (CONTEXT.md §5)</h2>
          <div className="space-y-2">
            {[['Fee Transactions', 'Append-only, immutable', '✓ Compliant'], ['Payroll Records', '≥7 years retained', '✓ Compliant'], ['PII Logs', 'Regex redacted', '✓ Compliant'], ['Cross-tenant Data', 'RLS enforced', '✓ Compliant']].map(([area, desc, status]) => (
              <div key={area} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                <div className="flex-1"><p className="text-white text-sm">{area}</p><p className="text-slate-400 text-xs">{desc}</p></div>
                <span className="text-green-400 text-xs font-medium">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
