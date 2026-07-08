'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AlertBanner } from '@/components/ui/DashboardWidgets';
import { API_BASE } from '@/lib/types/auth';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  gender: string;
  classId: string;
  parentEmail?: string;
  parentPhone?: string;
  isActive: boolean;
  dateOfBirth?: string;
}

export default function StudentDirectoryPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for Edit/Create (Though create is usually via Admissions)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    rollNumber: '',
    gender: 'MALE',
    dateOfBirth: '',
    parentEmail: '',
    parentPhone: '',
  });

  const loadStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/students?limit=50&search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadStudents();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleEdit = async (studentId: string) => {
    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const s = data.data;
        setForm({
          firstName: s.firstName,
          lastName: s.lastName,
          rollNumber: s.rollNumber,
          gender: s.gender,
          dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '',
          parentEmail: s.parentEmail || '',
          parentPhone: s.parentPhone || '',
        });
        setEditingStudentId(studentId);
        setModalOpen(true);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to fetch student details.' });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!editingStudentId) return;

    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/students/${editingStudentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Successfully updated ${form.firstName} ${form.lastName}.` });
        setModalOpen(false);
        setEditingStudentId(null);
        loadStudents();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update student.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed.' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate student ${name}?`)) return;

    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/students/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Successfully deactivated ${name}.` });
        loadStudents();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to deactivate student.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed.' });
    }
  };

  return (
    <DashboardShell pageTitle="Student Directory" requiredRole="INSTITUTION_ADMIN">
      <div className="space-y-6 max-w-6xl mx-auto fade-in-up">
        {message && <AlertBanner type={message.type} message={message.text} />}

        {/* Action Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <input
            type="text"
            placeholder="🔍 Search students by name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 w-80"
          />
        </div>

        {/* Student Table */}
        <div className="glass rounded-2xl overflow-hidden border border-slate-800">
          {loading ? (
            <div className="p-20 text-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 text-sm">Searching student catalog...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Gender</th>
                  <th className="p-4">Parent Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((s) => (
                  <tr key={s.id} className="text-xs text-slate-300 hover:bg-slate-900/10">
                    <td className="p-4 font-mono text-indigo-400 font-bold">{s.rollNumber}</td>
                    <td className="p-4 font-medium text-white">{s.firstName} {s.lastName}</td>
                    <td className="p-4">{s.gender}</td>
                    <td className="p-4 text-slate-400">{s.parentEmail || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        s.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {s.isActive ? '✓ Active' : '✕ Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button onClick={() => handleEdit(s.id)} className="text-slate-400 hover:text-blue-400 transition cursor-pointer">Edit</button>
                      {s.isActive && (
                        <button onClick={() => handleDelete(s.id, `${s.firstName} ${s.lastName}`)} className="text-slate-400 hover:text-red-400 transition cursor-pointer">Deactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
                {students.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass max-w-lg w-full rounded-2xl p-6 border border-slate-700/80 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-white font-bold text-base">Update Student Profile</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">First Name</label>
                    <input type="text" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Last Name</label>
                    <input type="text" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Date of Birth</label>
                    <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Gender</label>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500">
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Parent Email</label>
                    <input type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Parent Phone</label>
                    <input type="tel" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs mb-1">Roll Number</label>
                  <input type="text" required value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500" />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setModalOpen(false)} className="bg-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-xs transition">Cancel</button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
