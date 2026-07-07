'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { API_BASE } from '@/lib/types/auth';

interface DpdpConsent {
  id: string;
  dataCategory: string;
  consentGiven: boolean;
  consentVersion: string;
  createdAt: string;
  staffFirstName: string;
  staffLastName: string;
}

export default function DpdpConsentPage() {
  const [consents, setConsents] = useState<DpdpConsent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConsents() {
      try {
        const token = localStorage.getItem('educore_token');
        const res = await fetch(`${API_BASE}/api/hr/dpdp`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setConsents(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch DPDP consents', err);
      } finally {
        setLoading(false);
      }
    }
    fetchConsents();
  }, []);

  return (
    <DashboardShell pageTitle="DPDP Consent Tracker" requiredRole="HR_MANAGER">
      <div className="space-y-6 fade-in-up">
        
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
          <h2 className="text-white font-bold mb-2">Digital Personal Data Protection Act (DPDP) 2025</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            This dashboard displays the immutable audit log of consent records provided by staff members for the processing of their Personal Identifiable Information (PII). In compliance with the DPDP Act, all consent records are stored as append-only logs and cannot be modified or deleted.
          </p>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
            <h2 className="text-white font-semibold">Consent Audit Log</h2>
            <span className="bg-pink-500/10 text-pink-400 text-xs px-2.5 py-1 rounded-full border border-pink-500/20 font-medium">
              Immutable Ledger
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-white/5">
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff Member</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Category</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Version</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Consent Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading consent log...</td></tr>
                ) : consents.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">No consent records found.</td></tr>
                ) : (
                  consents.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-4 text-slate-400 font-mono text-xs">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-white font-medium">
                        {log.staffFirstName} {log.staffLastName}
                      </td>
                      <td className="p-4 text-slate-300">
                        {log.dataCategory}
                      </td>
                      <td className="p-4 text-slate-400 font-mono text-xs">
                        v{log.consentVersion}
                      </td>
                      <td className="p-4 text-right">
                        {log.consentGiven ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> GRANTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-medium text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> REVOKED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
