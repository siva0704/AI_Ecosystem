'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, AlertBanner, QuickAction } from '@/components/ui/DashboardWidgets';

export default function FinanceDashboard() {
  return (
    <DashboardShell pageTitle="Finance & Accounts" requiredRole="ACCOUNTANT">
      <div className="space-y-6 fade-in-up">
        <AlertBanner type="info" message="Payroll for June 2026 has been processed. GST return due on 20 July." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Today's Collection" value="₹84,000" icon="💰" color="green" trend={{ value: '+18%', positive: true }} />
          <StatCard label="Pending Receipts" value="12" icon="🧾" color="amber" />
          <StatCard label="Overdue Students" value="38" icon="⚠️" color="red" />
          <StatCard label="Monthly Revenue" value="₹18.4L" icon="📊" color="indigo" />
        </div>

        <div>
          <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            <QuickAction label="Collect Fee" icon="💳" href="/finance/fees" />
            <QuickAction label="View Ledger" icon="📒" href="/finance/ledger" />
            <QuickAction label="Pending Dues" icon="⚠️" href="/finance/dues" />
            <QuickAction label="GST Report" icon="🧾" href="/finance/gst" />
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Recent Transactions (Immutable Ledger)</h2>
          <div className="space-y-2">
            {[
              ['FEE-20260706-001', 'Arjun Patel — Annual Fee', '₹12,500', 'UPI'],
              ['FEE-20260706-002', 'Priya Singh — Term Fee', '₹8,200', 'Razorpay'],
              ['FEE-20260705-089', 'Rohan Mehta — Hostel Fee', '₹15,000', 'NEFT'],
              ['FEE-20260705-088', 'Asha Rao — Bus Fee', '₹3,500', 'Cash'],
            ].map(([txnId, name, amount, mode]) => (
              <div key={txnId} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
                  <span className="text-green-400 text-xs">✓</span>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{name}</p>
                  <p className="text-slate-500 text-xs font-mono">{txnId}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 text-sm font-semibold">{amount}</p>
                  <p className="text-slate-500 text-xs">{mode}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-600 text-xs mt-3 text-center">🔒 Append-only ledger — no modifications possible (CONTEXT.md §1.3)</p>
        </div>
      </div>
    </DashboardShell>
  );
}
