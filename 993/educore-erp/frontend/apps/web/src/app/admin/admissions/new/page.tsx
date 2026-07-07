'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { API_BASE } from '@/lib/types/auth';
import Link from 'next/link';

const GRADES = ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'XI', 'XII'];

export default function AdminAdmissionsNewPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ appCode: string; applicationId: string } | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    studentFirstName: '', studentLastName: '', dateOfBirth: '',
    gender: '', applyingForGrade: '', previousSchool: '', previousGrade: '',
    parentName: '', parentEmail: '', parentPhone: '', parentRelation: 'FATHER',
    street: '', city: '', state: '', pincode: '',
    hostelRequested: false, transportRequested: false,
    preferredArea: '', specialNeeds: '',
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));
  const setCheck = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.checked }));

  const submit = async () => {
    if (!form.studentFirstName || !form.studentLastName || !form.dateOfBirth || !form.gender || !form.applyingForGrade) {
      setError('Please fill all required student fields.'); return;
    }
    if (!form.parentName || !form.parentEmail || !form.parentPhone) {
      setError('Please fill all required parent fields.'); return;
    }

    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/admissions/admin/new`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'WALK_IN' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Submission failed');
      setSuccess({ appCode: data.appCode, applicationId: data.applicationId });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell pageTitle="New Walk-in Application" requiredRole="INSTITUTION_ADMIN">
      <div className="max-w-3xl fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin/admissions" className="text-slate-400 hover:text-white text-sm transition">
            ← Back to Admissions
          </Link>
          <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">🚶 Walk-in Entry</span>
        </div>

        {success ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-10 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-300 mb-2">Application Created!</h2>
            <p className="text-slate-400 mb-6">Walk-in application has been successfully recorded in the system.</p>
            <div className="bg-black/20 rounded-2xl px-8 py-5 inline-block mb-8">
              <p className="text-xs text-slate-500 mb-1">Application Code</p>
              <p className="text-3xl font-mono font-bold text-green-300 tracking-widest">{success.appCode}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/admin/admissions/${success.applicationId}`}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition">
                View Application →
              </Link>
              <button onClick={() => { setSuccess(null); setForm({ studentFirstName: '', studentLastName: '', dateOfBirth: '', gender: '', applyingForGrade: '', previousSchool: '', previousGrade: '', parentName: '', parentEmail: '', parentPhone: '', parentRelation: 'FATHER', street: '', city: '', state: '', pincode: '', hostelRequested: false, transportRequested: false, preferredArea: '', specialNeeds: '' }); }}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition border border-white/10">
                Add Another
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Student Details */}
            <Section title="🎓 Student Details">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name *" value={form.studentFirstName} onChange={set('studentFirstName')} placeholder="Arjun" />
                <Field label="Last Name *" value={form.studentLastName} onChange={set('studentLastName')} placeholder="Sharma" />
                <Field label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                <Select label="Gender *" value={form.gender} onChange={set('gender')}
                  options={[{ value: '', label: 'Select' }, { value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]} />
                <Select label="Grade Applied *" value={form.applyingForGrade} onChange={set('applyingForGrade')}
                  options={[{ value: '', label: 'Select Grade' }, ...GRADES.map(g => ({ value: g, label: `Grade ${g}` }))]} />
                <Field label="Previous School" value={form.previousSchool} onChange={set('previousSchool')} placeholder="School name (optional)" />
              </div>
            </Section>

            {/* Parent Details */}
            <Section title="👨‍👩‍👦 Parent / Guardian Details">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Parent Name *" value={form.parentName} onChange={set('parentName')} placeholder="Rajesh Sharma" />
                <Select label="Relation" value={form.parentRelation} onChange={set('parentRelation')}
                  options={[{ value: 'FATHER', label: 'Father' }, { value: 'MOTHER', label: 'Mother' }, { value: 'GUARDIAN', label: 'Guardian' }]} />
                <Field label="Email *" type="email" value={form.parentEmail} onChange={set('parentEmail')} placeholder="rajesh@email.com" />
                <Field label="Phone *" type="tel" value={form.parentPhone} onChange={set('parentPhone')} placeholder="+91 98765 43210" />
              </div>
            </Section>

            {/* Address */}
            <Section title="📍 Address">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field label="Street" value={form.street} onChange={set('street')} placeholder="House No. / Street Name" />
                </div>
                <Field label="City" value={form.city} onChange={set('city')} placeholder="Bengaluru" />
                <Field label="State" value={form.state} onChange={set('state')} placeholder="Karnataka" />
                <Field label="Pincode" value={form.pincode} onChange={set('pincode')} placeholder="560001" />
              </div>
            </Section>

            {/* Preferences */}
            <Section title="⚙️ Preferences">
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.hostelRequested} onChange={setCheck('hostelRequested')} className="w-4 h-4 accent-indigo-500" />
                  <span className="text-sm text-slate-300">Hostel accommodation requested</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.transportRequested} onChange={setCheck('transportRequested')} className="w-4 h-4 accent-indigo-500" />
                  <span className="text-sm text-slate-300">School transport requested</span>
                </label>
                {form.transportRequested && (
                  <Field label="Pickup Area" value={form.preferredArea} onChange={set('preferredArea')} placeholder="e.g. Indiranagar" />
                )}
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Special Requirements (optional)</label>
                  <textarea value={form.specialNeeds} onChange={set('specialNeeds')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={2} placeholder="Dietary, medical, accessibility needs..." />
                </div>
              </div>
            </Section>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button onClick={submit} disabled={submitting}
                className="px-10 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition disabled:opacity-60 flex items-center gap-2">
                {submitting ? <><span className="animate-spin">⟳</span> Creating…</> : '🚀 Create Application'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function Section({ title, children }: any) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, value, onChange, placeholder = '', type = 'text' }: any) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    </div>
  );
}
function Select({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <select value={value} onChange={onChange}
        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
