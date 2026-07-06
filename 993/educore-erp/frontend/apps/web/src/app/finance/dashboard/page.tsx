'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, AlertBanner, QuickAction } from '@/components/ui/DashboardWidgets';

interface FinanceStats {
  todayCollection: string;
  pendingReceipts: number;
  overdueCount: number;
  payrollStatus: string;
}

interface FeeTransaction {
  id: string;
  fee_head: string;
  amount_display: string;
  payment_status: string;
  payment_mode: string;
  created_at: string;
}

export default function FinanceDashboard() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem('educore_token');

        // Fetch stats
        const statsRes = await fetch('http://localhost:4000/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }

        // Fetch recent transactions
        const txRes = await fetch('http://localhost:4000/api/fees', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const txData = await txRes.json();
        if (txData.success) {
          setTransactions(txData.data.slice(0, 5)); // show top 5 recent
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <DashboardShell pageTitle="Finance & Accounts" requiredRole="ACCOUNTANT">
      <div className="space-y-6 fade-in-up">
        <AlertBanner type="info" message={`Payroll status for June 2026: ${stats?.payrollStatus || 'PROCESSED'}. GST return due on 20 July.`} />

        {loading ? (
          <div className="text-slate-400 text-sm">Loading financial data...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Today's Collection" value={stats?.todayCollection || '₹0'} icon="💰" color="green" />
            <StatCard label="Pending Receipts" value={stats?.pendingReceipts ?? 0} icon="🧾" color="amber" />
            <StatCard label="Overdue Students" value={stats?.overdueCount ?? 0} icon="⚠️" color="red" />
            <StatCard label="Monthly Revenue" value={stats?.todayCollection || '₹0'} icon="📊" color="indigo" />
          </div>
        )}

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
            {transactions.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-6">No recent transactions recorded.</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                  <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
                    <span className="text-green-400 text-xs">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{tx.fee_head}</p>
                    <p className="text-slate-500 text-[10px] font-mono">{tx.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-sm font-semibold">{tx.amount_display}</p>
                    <p className="text-slate-500 text-xs">{tx.payment_mode} · {tx.payment_status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="text-slate-600 text-xs mt-3 text-center">🔒 Append-only ledger — no modifications possible (CONTEXT.md §1.3)</p>
        </div>
      </div>
    </DashboardShell>
  );
}
