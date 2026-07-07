'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AlertBanner } from '@/components/ui/DashboardWidgets';

export default function ManageClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ grade: '10', section: 'A' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch('http://localhost:4000/api/academic/classes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch('http://localhost:4000/api/academic/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        await fetchClasses();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell pageTitle="Manage Classes & Subjects" requiredRole="INSTITUTION_ADMIN">
      <div className="space-y-6 max-w-4xl mx-auto fade-in-up">
        <div className="grid md:grid-cols-2 gap-6">
          
          <div className="glass rounded-2xl p-6">
            <h2 className="text-white text-lg font-bold mb-4">Create New Class</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1.5 font-medium">Grade</label>
                <input
                  type="text"
                  required
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1.5 font-medium">Section</label>
                <input
                  type="text"
                  required
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-sm px-6 py-2 rounded-xl transition"
              >
                {saving ? 'Creating...' : 'Create Class'}
              </button>
            </form>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-white text-lg font-bold mb-4">Active Classes</h2>
            {loading ? (
              <p className="text-slate-400 text-sm">Loading...</p>
            ) : classes.length === 0 ? (
              <p className="text-slate-400 text-sm">No classes created yet.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {classes.map((c) => (
                  <div key={c.id} className="bg-slate-900/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                      <span className="text-white font-medium">Grade {c.grade}</span>
                      <span className="text-slate-400 text-xs ml-2">Sec {c.section}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}
