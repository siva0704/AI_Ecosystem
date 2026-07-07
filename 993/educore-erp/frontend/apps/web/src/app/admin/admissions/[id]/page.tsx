'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { API_BASE } from '@/lib/types/auth';
import Link from 'next/link';

const DOC_LABELS: Record<string, string> = {
  MARK_SHEET:    'Previous Year Mark Sheet',
  TRANSFER_CERT: 'Transfer Certificate (TC)',
  ID_PROOF:      'ID Proof (Aadhaar)',
  PHOTO:         'Passport Photograph',
  BIRTH_CERT:    'Birth Certificate',
  ADDRESS_PROOF: 'Address Proof',
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'text-blue-300', PENDING_DOCS: 'text-amber-300',
  DOCS_RECEIVED: 'text-cyan-300', UNDER_REVIEW: 'text-purple-300',
  APPROVED: 'text-green-300', REJECTED: 'text-red-300', COMPLETED: 'text-emerald-300',
};

export default function AdminAdmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchApp = async () => {
    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/admissions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setApp(data.data);
    } catch (err) {
      console.error('Failed to fetch application', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApp(); }, [id]);

  const review = async (action: 'APPROVE' | 'REJECT', reason?: string) => {
    setActionLoading(action);
    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/admissions/${id}/review`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(action === 'APPROVE' ? '✅ Application approved and student provisioned!' : '❌ Application rejected.');
        setShowRejectModal(false);
        await fetchApp();
      } else {
        showToast(`Error: ${data.error}`);
      }
    } catch (err) {
      showToast('Action failed. Please try again.');
    } finally {
      setActionLoading('');
    }
  };

  const updateDoc = async (docType: string, status: string) => {
    setActionLoading(docType);
    try {
      const token = localStorage.getItem('educore_token');
      await fetch(`${API_BASE}/api/admissions/${id}/documents`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ docType, status }),
      });
      showToast(`📄 Document status updated to ${status}`);
      await fetchApp();
    } catch { showToast('Failed to update document'); }
    finally { setActionLoading(''); }
  };

  if (loading) return (
    <DashboardShell pageTitle="Application Detail" requiredRole="INSTITUTION_ADMIN">
      <div className="flex items-center justify-center h-64 text-slate-400">Loading application…</div>
    </DashboardShell>
  );

  if (!app) return (
    <DashboardShell pageTitle="Application Not Found" requiredRole="INSTITUTION_ADMIN">
      <div className="text-center py-20 text-slate-400">
        <div className="text-5xl mb-4">🔍</div>
        <p>Application not found</p>
        <Link href="/admin/admissions" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">← Back to list</Link>
      </div>
    </DashboardShell>
  );

  const canReview = ['DOCS_RECEIVED', 'UNDER_REVIEW', 'PENDING_DOCS', 'SUBMITTED'].includes(app.status);
  const statusColor = STATUS_COLORS[app.status] ?? 'text-slate-300';

  return (
    <DashboardShell pageTitle={`Application: ${app.app_code}`} requiredRole="INSTITUTION_ADMIN">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 bg-slate-800 border border-white/10 rounded-xl px-5 py-3 text-white text-sm z-50 shadow-xl animate-bounce">
          {toast}
        </div>
      )}

      <div className="space-y-6 fade-in-up max-w-5xl">
        {/* Back + Status Header */}
        <div className="flex items-center justify-between">
          <Link href="/admin/admissions" className="text-slate-400 hover:text-white text-sm transition flex items-center gap-1">
            ← Back to Admissions
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Source:</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${app.source === 'WALK_IN' ? 'bg-purple-500/10 text-purple-300' : 'bg-blue-500/10 text-blue-300'}`}>
              {app.source === 'WALK_IN' ? '🚶 Walk-in' : '🌐 Online'}
            </span>
            <span className={`text-sm font-bold ${statusColor}`}>● {app.status.replace(/_/g, ' ')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-5">
            {/* Student */}
            <Section title="🎓 Student Details">
              <Grid>
                <InfoItem label="Full Name" value={`${app.student_first_name} ${app.student_last_name}`} />
                <InfoItem label="Date of Birth" value={app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString('en-IN') : '—'} />
                <InfoItem label="Gender" value={app.gender} />
                <InfoItem label="Applying for Grade" value={`Grade ${app.applying_for_grade}`} />
                <InfoItem label="Academic Year" value={app.academic_year} />
                {app.previous_school && <InfoItem label="Previous School" value={app.previous_school} />}
              </Grid>
            </Section>

            {/* Parent */}
            <Section title="👨‍👩‍👦 Parent / Guardian">
              <Grid>
                <InfoItem label="Name" value={`${app.parent_name} (${app.parent_relation})`} />
                <InfoItem label="Email" value={app.parent_email} />
                <InfoItem label="Phone" value={app.parent_phone} />
                {app.address && (
                  <InfoItem label="Address" value={[app.address.street, app.address.city, app.address.state, app.address.pincode].filter(Boolean).join(', ')} />
                )}
              </Grid>
            </Section>

            {/* Preferences */}
            {app.preferences && (
              <Section title="⚙️ Preferences">
                <Grid>
                  <InfoItem label="Hostel" value={app.preferences.hostel_requested ? `Yes (${app.preferences.preferred_room_type || 'No preference'})` : 'Not requested'} />
                  <InfoItem label="Transport" value={app.preferences.transport_requested ? `Yes — ${app.preferences.preferred_area || 'Area TBD'}` : 'Not requested'} />
                  {app.preferences.special_needs && <InfoItem label="Special Needs" value={app.preferences.special_needs} />}
                </Grid>
              </Section>
            )}

            {/* Documents */}
            <Section title="📄 Document Checklist">
              <div className="space-y-3">
                {(app.documents || []).map((doc: any) => (
                  <div key={doc.doc_type} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-sm text-slate-300">{DOC_LABELS[doc.doc_type] ?? doc.doc_type}</span>
                    <div className="flex items-center gap-2">
                      <DocBadge status={doc.status} />
                      {doc.status === 'PENDING' && (
                        <button onClick={() => updateDoc(doc.doc_type, 'VERIFIED')}
                          disabled={actionLoading === doc.doc_type}
                          className="text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1 rounded-lg transition">
                          {actionLoading === doc.doc_type ? '…' : 'Mark Verified'}
                        </button>
                      )}
                      {doc.status === 'VERIFIED' && (
                        <span className="text-xs text-green-400">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Rejection Reason */}
            {app.status === 'REJECTED' && app.rejection_reason && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                <h3 className="text-red-300 font-semibold mb-2">Rejection Reason</h3>
                <p className="text-slate-300 text-sm">{app.rejection_reason}</p>
              </div>
            )}

            {/* Student Provisioned */}
            {app.student_id && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
                <h3 className="text-green-300 font-semibold mb-2">✅ Student Provisioned</h3>
                <p className="text-slate-300 text-sm">Student record created. ID: <span className="font-mono text-xs text-green-300">{app.student_id}</span></p>
              </div>
            )}
          </div>

          {/* Right: Actions + Timeline */}
          <div className="space-y-5">
            {/* Action Panel */}
            {canReview && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 text-sm text-slate-300 uppercase tracking-wider">Actions</h3>
                <div className="space-y-3">
                  <button onClick={() => review('APPROVE')} disabled={!!actionLoading}
                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {actionLoading === 'APPROVE' ? '⟳ Approving…' : '✅ Approve Application'}
                  </button>
                  <button onClick={() => setShowRejectModal(true)} disabled={!!actionLoading}
                    className="w-full py-3 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-semibold transition disabled:opacity-50">
                    ❌ Reject Application
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-3 text-center">
                  Approving will automatically create a student record
                </p>
              </div>
            )}

            {/* Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-sm space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Application Code</p>
                <p className="font-mono font-bold text-indigo-300 tracking-widest">{app.app_code}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Submitted</p>
                <p className="text-white">{new Date(app.submitted_at).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Last Updated</p>
                <p className="text-slate-300">{new Date(app.updated_at).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Timeline */}
            {app.timeline && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold mb-4 text-sm text-slate-300 uppercase tracking-wider">Timeline</h3>
                <div className="space-y-3">
                  {app.timeline.map((step: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0
                        ${step.status === 'DONE' ? 'bg-green-500 text-white' :
                          step.status === 'CURRENT' ? 'bg-indigo-500 text-white' :
                          'bg-white/5 text-slate-600'}`}>
                        {step.status === 'DONE' ? '✓' : step.icon}
                      </div>
                      <span className={`text-xs ${step.status === 'DONE' ? 'text-green-300' : step.status === 'CURRENT' ? 'text-white font-medium' : 'text-slate-600'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-2">Reject Application</h2>
            <p className="text-slate-400 text-sm mb-5">Please provide a reason for rejection (optional but recommended).</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-5"
              rows={4} placeholder="e.g. Application incomplete, grade not available, documents not submitted..." />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition">
                Cancel
              </button>
              <button onClick={() => review('REJECT', rejectReason)} disabled={!!actionLoading}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition disabled:opacity-50">
                {actionLoading === 'REJECT' ? '⟳ Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Section({ title, children }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <h3 className="font-semibold text-sm text-slate-300 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}
function Grid({ children }: any) { return <div className="grid grid-cols-2 gap-3">{children}</div>; }
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm text-white">{value || '—'}</p>
    </div>
  );
}
function DocBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    PENDING: 'bg-slate-500/20 text-slate-400',
    UPLOADED: 'bg-blue-500/20 text-blue-300',
    VERIFIED: 'bg-green-500/20 text-green-300',
    REJECTED: 'bg-red-500/20 text-red-300',
  };
  const labels: Record<string, string> = {
    PENDING: 'Pending', UPLOADED: 'Uploaded', VERIFIED: '✓ Verified', REJECTED: 'Rejected',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cfg[status]}`}>{labels[status] ?? status}</span>;
}
