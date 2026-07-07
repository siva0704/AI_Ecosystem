'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  SUBMITTED:     { label: 'Application Submitted',  color: 'text-blue-300',   bg: 'bg-blue-500/10 border-blue-500/20',   icon: '📋' },
  PENDING_DOCS:  { label: 'Documents Required',      color: 'text-amber-300',  bg: 'bg-amber-500/10 border-amber-500/20', icon: '📄' },
  DOCS_RECEIVED: { label: 'Documents Received',      color: 'text-cyan-300',   bg: 'bg-cyan-500/10 border-cyan-500/20',   icon: '✅' },
  UNDER_REVIEW:  { label: 'Under Review',            color: 'text-purple-300', bg: 'bg-purple-500/10 border-purple-500/20', icon: '🔍' },
  APPROVED:      { label: 'Application Approved',    color: 'text-green-300',  bg: 'bg-green-500/10 border-green-500/20', icon: '🎉' },
  REJECTED:      { label: 'Application Rejected',    color: 'text-red-300',    bg: 'bg-red-500/10 border-red-500/20',     icon: '❌' },
  COMPLETED:     { label: 'Enrollment Complete',     color: 'text-emerald-300',bg: 'bg-emerald-500/10 border-emerald-500/20', icon: '🏫' },
};

const DOC_LABELS: Record<string, string> = {
  MARK_SHEET:    'Previous Year Mark Sheet',
  TRANSFER_CERT: 'Transfer Certificate (TC)',
  ID_PROOF:      'ID Proof (Aadhaar / Passport)',
  PHOTO:         'Passport Size Photograph',
  BIRTH_CERT:    'Birth Certificate',
  ADDRESS_PROOF: 'Address Proof',
};

function StatusContent() {
  const params = useSearchParams();
  const router = useRouter();
  const initialId = params.get('id') || '';

  const [appId, setAppId] = useState(initialId);
  const [searched, setSearched] = useState(!!initialId);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const search = async (id?: string) => {
    const code = (id ?? appId).trim().toUpperCase();
    if (!code) { setError('Please enter your Application Code.'); return; }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await fetch(`${API_BASE}/api/admissions/status/${code}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Application not found');
      setData(json.application);
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on load if id is in URL
  if (initialId && !searched) search(initialId);

  const status = data ? (STATUS_LABELS[data.status] ?? STATUS_LABELS['SUBMITTED']) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-lg">EC</div>
            <div>
              <div className="font-bold text-white">EduCore ERP</div>
              <div className="text-xs text-indigo-300">Greenfield Academy</div>
            </div>
          </div>
          <a href="/admissions" className="text-sm text-indigo-300 hover:text-white transition">
            ← New Application
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Track Your Application</h1>
          <p className="text-slate-400">Enter your Application Code (e.g. APP-X7K2M9) to check status</p>
        </div>

        {/* Search Box */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <input
              value={appId}
              onChange={e => setAppId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="APP-XXXXXX"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 tracking-widest"
            />
            <button onClick={() => search()}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition">
              {loading ? '⟳' : 'Track'}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-3">⚠️ {error}</p>}
        </div>

        {/* Results */}
        {data && status && (
          <div className="space-y-5 fade-in">
            {/* Status Card */}
            <div className={`border rounded-2xl p-6 ${status.bg}`}>
              <div className="flex items-center gap-4">
                <span className="text-4xl">{status.icon}</span>
                <div>
                  <p className="text-sm text-slate-400 mb-0.5">Current Status</p>
                  <p className={`text-xl font-bold ${status.color}`}>{status.label}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-slate-500">Application Code</p>
                  <p className="font-mono font-bold text-white tracking-widest">{data.appCode}</p>
                </div>
              </div>
            </div>

            {/* Student Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Application Details</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Student Name" value={data.studentName} />
                <InfoRow label="Applying for Grade" value={`Grade ${data.applyingForGrade}`} />
                <InfoRow label="Parent Name" value={data.parentName} />
                <InfoRow label="Submitted On" value={new Date(data.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
                <InfoRow label="Hostel Requested" value={data.hostelRequested ? '✅ Yes' : 'No'} />
                <InfoRow label="Transport Requested" value={data.transportRequested ? '✅ Yes' : 'No'} />
              </div>
            </div>

            {/* Status Timeline */}
            {data.timeline && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5">Application Timeline</h2>
                <div className="space-y-3">
                  {data.timeline.map((step: any, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0
                        ${step.status === 'DONE' ? 'bg-green-500 text-white' :
                          step.status === 'CURRENT' ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/30' :
                          step.status === 'SKIPPED' ? 'bg-red-500/20 text-red-400' :
                          'bg-white/5 text-slate-500'}`}>
                        {step.status === 'DONE' ? '✓' : step.icon}
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm font-medium
                          ${step.status === 'DONE' ? 'text-green-300' :
                            step.status === 'CURRENT' ? 'text-white' :
                            step.status === 'SKIPPED' ? 'text-red-400 line-through' :
                            'text-slate-500'}`}>
                          {step.label}
                        </span>
                      </div>
                      {step.status === 'CURRENT' && (
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">Current</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {data.documents && data.documents.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Required Documents</h2>
                <div className="space-y-3">
                  {data.documents.map((doc: any) => (
                    <div key={doc.doc_type} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{DOC_LABELS[doc.doc_type] ?? doc.doc_type}</span>
                      <DocStatusBadge status={doc.status} />
                    </div>
                  ))}
                </div>
                {data.status === 'PENDING_DOCS' && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
                    📌 Please bring all required documents to the school office or upload them via the link in your confirmation email.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {searched && !loading && !data && !error && (
          <div className="text-center text-slate-500 py-12">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg">No application found</p>
            <p className="text-sm mt-1">Please check your Application Code and try again</p>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-white font-medium">{value || '—'}</p>
    </div>
  );
}

function DocStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING:  'bg-slate-500/20 text-slate-400',
    UPLOADED: 'bg-blue-500/20 text-blue-300',
    VERIFIED: 'bg-green-500/20 text-green-300',
    REJECTED: 'bg-red-500/20 text-red-300',
  };
  const labels: Record<string, string> = {
    PENDING: '⏳ Pending', UPLOADED: '📤 Uploaded',
    VERIFIED: '✅ Verified', REJECTED: '❌ Rejected',
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${map[status] ?? 'bg-white/5 text-slate-400'}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default function AdmissionsStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <StatusContent />
    </Suspense>
  );
}
