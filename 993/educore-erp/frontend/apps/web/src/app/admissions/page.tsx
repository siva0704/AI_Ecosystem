'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const GRADES = ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'XI', 'XII'];
const STEPS = ['Student Details', 'Parent & Address', 'Preferences', 'Review & Submit'];

interface FormData {
  // Student
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: string;
  gender: string;
  applyingForGrade: string;
  previousSchool: string;
  previousGrade: string;
  // Parent
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentRelation: string;
  // Address
  street: string;
  city: string;
  state: string;
  pincode: string;
  // Preferences
  hostelRequested: boolean;
  preferredRoomType: string;
  transportRequested: boolean;
  preferredArea: string;
  specialNeeds: string;
}

export default function AdmissionsPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    studentFirstName: '', studentLastName: '', dateOfBirth: '',
    gender: '', applyingForGrade: '', previousSchool: '', previousGrade: '',
    parentName: '', parentEmail: '', parentPhone: '', parentRelation: 'FATHER',
    street: '', city: '', state: '', pincode: '',
    hostelRequested: false, preferredRoomType: '', transportRequested: false,
    preferredArea: '', specialNeeds: '',
  });

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
  };

  const setCheck = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.checked }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.studentFirstName || !form.studentLastName || !form.dateOfBirth || !form.gender || !form.applyingForGrade) {
        setError('Please fill all required student fields.'); return false;
      }
    }
    if (step === 1) {
      if (!form.parentName || !form.parentEmail || !form.parentPhone) {
        setError('Please fill all required parent fields.'); return false;
      }
      if (!/\S+@\S+\.\S+/.test(form.parentEmail)) {
        setError('Please enter a valid email address.'); return false;
      }
    }
    setError('');
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => Math.min(s + 1, 3)); };
  const back = () => { setStep(s => Math.max(s - 1, 0)); setError(''); };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admissions/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'ONLINE', subdomain: 'demo' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Submission failed');
      router.push(`/admissions/success?code=${data.appCode}`);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
          <a href="/admissions/status" className="text-sm text-indigo-300 hover:text-white transition flex items-center gap-1">
            🔍 Track Application
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
            Online Admission 2026–27
          </h1>
          <p className="text-slate-400 text-lg">Complete the form below to apply for admission to Greenfield Academy</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 -z-0" />
          {STEPS.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-2 z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/30' : 'bg-white/10 text-slate-400'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-indigo-300' : 'text-slate-500'}`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Step 0: Student Details */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">🎓 Student Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="First Name *" value={form.studentFirstName} onChange={set('studentFirstName')} placeholder="Arjun" />
                <FormField label="Last Name *" value={form.studentLastName} onChange={set('studentLastName')} placeholder="Sharma" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                <FormSelect label="Gender *" value={form.gender} onChange={set('gender')}
                  options={[{ value: '', label: 'Select Gender' }, { value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormSelect label="Applying for Grade *" value={form.applyingForGrade} onChange={set('applyingForGrade')}
                  options={[{ value: '', label: 'Select Grade' }, ...GRADES.map(g => ({ value: g, label: `Grade ${g}` }))]} />
                <FormField label="Previous School" value={form.previousSchool} onChange={set('previousSchool')} placeholder="Previous school name (optional)" />
              </div>
            </div>
          )}

          {/* Step 1: Parent & Address */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">👨‍👩‍👦 Parent / Guardian Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Parent/Guardian Name *" value={form.parentName} onChange={set('parentName')} placeholder="Rajesh Sharma" />
                <FormSelect label="Relation *" value={form.parentRelation} onChange={set('parentRelation')}
                  options={[{ value: 'FATHER', label: 'Father' }, { value: 'MOTHER', label: 'Mother' }, { value: 'GUARDIAN', label: 'Guardian' }]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Email Address *" type="email" value={form.parentEmail} onChange={set('parentEmail')} placeholder="rajesh.sharma@email.com" />
                <FormField label="Phone Number *" type="tel" value={form.parentPhone} onChange={set('parentPhone')} placeholder="+91 98765 43210" />
              </div>
              <div className="pt-2">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">📍 Residential Address</h3>
                <FormField label="Street / House No." value={form.street} onChange={set('street')} placeholder="12, MG Road" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="City" value={form.city} onChange={set('city')} placeholder="Bengaluru" />
                <FormField label="State" value={form.state} onChange={set('state')} placeholder="Karnataka" />
                <FormField label="Pincode" value={form.pincode} onChange={set('pincode')} placeholder="560001" />
              </div>
            </div>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">⚙️ Hostel & Transport Preferences</h2>

              {/* Hostel */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.hostelRequested} onChange={setCheck('hostelRequested')}
                    className="w-5 h-5 accent-indigo-500" />
                  <div>
                    <div className="font-semibold">🏠 Request Hostel Accommodation</div>
                    <div className="text-xs text-slate-400 mt-0.5">Subject to availability at time of admission</div>
                  </div>
                </label>
                {form.hostelRequested && (
                  <div className="mt-4">
                    <FormSelect label="Preferred Room Type" value={form.preferredRoomType} onChange={set('preferredRoomType')}
                      options={[{ value: '', label: 'No Preference' }, { value: 'SINGLE', label: 'Single Room' }, { value: 'DOUBLE', label: 'Double Sharing' }, { value: 'TRIPLE', label: 'Triple Sharing' }]} />
                  </div>
                )}
              </div>

              {/* Transport */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.transportRequested} onChange={setCheck('transportRequested')}
                    className="w-5 h-5 accent-indigo-500" />
                  <div>
                    <div className="font-semibold">🚌 Request School Transport</div>
                    <div className="text-xs text-slate-400 mt-0.5">Bus routes available across the city</div>
                  </div>
                </label>
                {form.transportRequested && (
                  <div className="mt-4">
                    <FormField label="Pickup Area / Locality" value={form.preferredArea} onChange={set('preferredArea')} placeholder="e.g. Indiranagar, Koramangala" />
                  </div>
                )}
              </div>

              {/* Special Needs */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Special Requirements (optional)</label>
                <textarea value={form.specialNeeds} onChange={set('specialNeeds')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3} placeholder="Dietary restrictions, medical conditions, accessibility needs..." />
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">📋 Review Your Application</h2>
              <ReviewSection title="Student Details">
                <ReviewRow label="Name" value={`${form.studentFirstName} ${form.studentLastName}`} />
                <ReviewRow label="Date of Birth" value={form.dateOfBirth} />
                <ReviewRow label="Gender" value={form.gender} />
                <ReviewRow label="Applying for Grade" value={`Grade ${form.applyingForGrade}`} />
                {form.previousSchool && <ReviewRow label="Previous School" value={form.previousSchool} />}
              </ReviewSection>
              <ReviewSection title="Parent / Guardian">
                <ReviewRow label="Name" value={`${form.parentName} (${form.parentRelation})`} />
                <ReviewRow label="Email" value={form.parentEmail} />
                <ReviewRow label="Phone" value={form.parentPhone} />
                <ReviewRow label="Address" value={[form.street, form.city, form.state, form.pincode].filter(Boolean).join(', ') || '—'} />
              </ReviewSection>
              <ReviewSection title="Preferences">
                <ReviewRow label="Hostel" value={form.hostelRequested ? `Yes (${form.preferredRoomType || 'No preference'})` : 'Not requested'} />
                <ReviewRow label="Transport" value={form.transportRequested ? `Yes — ${form.preferredArea || 'Area TBD'}` : 'Not requested'} />
                {form.specialNeeds && <ReviewRow label="Special Needs" value={form.specialNeeds} />}
              </ReviewSection>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-300 text-sm mt-4">
                ℹ️ By submitting, you confirm that all information provided is accurate. You will receive an Application Code to track your admission status.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <button onClick={back} disabled={step === 0}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition disabled:opacity-30 disabled:cursor-not-allowed">
              ← Back
            </button>
            {step < 3 ? (
              <button onClick={next}
                className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shadow-lg shadow-indigo-500/20">
                Continue →
              </button>
            ) : (
              <button onClick={submit} disabled={submitting}
                className="px-8 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition shadow-lg shadow-green-500/20 disabled:opacity-60 flex items-center gap-2">
                {submitting ? <><span className="animate-spin">⟳</span> Submitting...</> : '🚀 Submit Application'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({ label, value, onChange, placeholder = '', type = 'text' }: any) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1.5">{label}</label>
      <select value={value} onChange={onChange}
        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ReviewSection({ title, children }: any) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
      <h3 className="text-sm font-semibold text-indigo-300 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );
}
