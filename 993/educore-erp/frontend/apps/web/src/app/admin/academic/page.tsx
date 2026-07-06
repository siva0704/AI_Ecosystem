'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AlertBanner } from '@/components/ui/DashboardWidgets';

export default function AcademicSetupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    grade: '10',
    section: 'A',
    rollNumber: '',
    parentEmail: '',
    parentPhone: '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch('http://localhost:4000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', message: `Student ${formData.firstName} ${formData.lastName} registered successfully!` });
        // Clear form
        setFormData({
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: 'MALE',
          grade: '10',
          section: 'A',
          rollNumber: '',
          parentEmail: '',
          parentPhone: '',
        });
      } else {
        setMessage({ type: 'error', message: result.error || 'Failed to register student.' });
      }
    } catch (err) {
      setMessage({ type: 'error', message: 'Connection error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell pageTitle="Academic Setup & Admissions" requiredRole="INSTITUTION_ADMIN">
      <div className="space-y-6 max-w-4xl mx-auto fade-in-up">
        {message && <AlertBanner type={message.type} message={message.message} />}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Admission Form */}
          <div className="md:col-span-2 glass rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-white text-lg font-bold">New Student Registration</h2>
              <p className="text-slate-400 text-xs mt-1">Enroll a student into the institution roster</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    required
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Grade / Class *</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Section *</label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">Roll Number *</label>
                  <input
                    type="text"
                    name="rollNumber"
                    required
                    value={formData.rollNumber}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. 10A032"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 my-4 pt-4">
                <h3 className="text-white text-sm font-semibold mb-3">Guardian Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1.5 font-medium">Parent Email</label>
                    <input
                      type="email"
                      name="parentEmail"
                      value={formData.parentEmail}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="guardian@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1.5 font-medium">Parent Phone</label>
                    <input
                      type="tel"
                      name="parentPhone"
                      value={formData.parentPhone}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-sm px-6 py-3 rounded-xl transition cursor-pointer flex items-center gap-2"
                >
                  {saving ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Stats sidebar */}
          <div className="glass rounded-2xl p-6 space-y-4 h-fit">
            <h3 className="text-white font-bold text-sm">Admission Stats</h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-900/60 rounded-xl">
                <span className="text-slate-400 text-xs block">Active Admissions</span>
                <span className="text-white text-xl font-bold">1,840</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl">
                <span className="text-slate-400 text-xs block">New This Term</span>
                <span className="text-indigo-400 text-xl font-bold">+124</span>
              </div>
            </div>
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
              <span className="text-amber-400 text-xs font-semibold block mb-1">🛡️ RLS Isolation Layer</span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Admitted student records are partitioned at the database engine level. Query context is automatically bounded to this institution instance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
