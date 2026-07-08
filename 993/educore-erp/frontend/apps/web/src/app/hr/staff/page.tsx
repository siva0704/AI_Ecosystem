'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AlertBanner } from '@/components/ui/DashboardWidgets';
import { API_BASE } from '@/lib/types/auth';

interface Staff {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
  dateOfJoining: string;
  dpdpConsentGiven: boolean;
  isActive: boolean;
  phone?: string;
}

export default function HRStaffDirectoryPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Edit mode state
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // New staff form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'TEACHER',
    department: 'Mathematics',
    dateOfJoining: new Date().toISOString().split('T')[0],
    employeeId: '',
    dpdpConsentGiven: false,
  });

  const loadStaff = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/hr/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStaff(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadStaff();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/hr/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Successfully onboarded ${form.firstName} ${form.lastName}.` });
        setModalOpen(false);
        // Clear form
        setForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: 'TEACHER',
          department: 'Mathematics',
          dateOfJoining: new Date().toISOString().split('T')[0],
          employeeId: '',
          dpdpConsentGiven: false,
        });
        loadStaff();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to onboard staff.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed.' });
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaffId(staffMember.id);
    setForm({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phone: staffMember.phone || '',
      role: staffMember.role,
      department: staffMember.department || '',
      dateOfJoining: staffMember.dateOfJoining,
      employeeId: staffMember.employeeId,
      dpdpConsentGiven: staffMember.dpdpConsentGiven,
    });
    setModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!editingStaffId) return;

    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/hr/staff/${editingStaffId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          role: form.role,
          department: form.department,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Successfully updated ${form.firstName} ${form.lastName}.` });
        setModalOpen(false);
        setEditingStaffId(null);
        loadStaff();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update staff.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed.' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}? This will remove them from active directories.`)) return;

    try {
      const token = localStorage.getItem('educore_token');
      const res = await fetch(`${API_BASE}/api/hr/staff/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Successfully deactivated ${name}.` });
        loadStaff();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to deactivate staff.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed.' });
    }
  };

  return (
    <DashboardShell pageTitle="Staff Directory & Lifecycle" requiredRole="HR_MANAGER">
      <div className="space-y-6 max-w-6xl mx-auto fade-in-up">
        {message && <AlertBanner type={message.type} message={message.text} />}

        {/* Action Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <input
            type="text"
            placeholder="🔍 Search staff members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-500 w-80"
          />

          <button
            onClick={() => {
              setEditingStaffId(null);
              setForm({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                role: 'TEACHER',
                department: 'Mathematics',
                dateOfJoining: new Date().toISOString().split('T')[0],
                employeeId: '',
                dpdpConsentGiven: false,
              });
              setModalOpen(true);
            }}
            className="bg-pink-600 hover:bg-pink-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-lg hover:shadow-pink-500/10 cursor-pointer"
          >
            ➕ Onboard New Staff
          </button>
        </div>

        {/* Staff Table */}
        <div className="glass rounded-2xl overflow-hidden border border-slate-800">
          {loading ? (
            <div className="p-20 text-center">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 text-sm">Searching staff catalog...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Employee ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">DPDP Consent</th>
                  <th className="p-4">Date Joined</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {staff.map((s) => (
                  <tr key={s.id} className="text-xs text-slate-300 hover:bg-slate-900/10">
                    <td className="p-4 font-mono text-pink-400 font-bold">{s.employeeId}</td>
                    <td className="p-4 font-medium text-white">{s.firstName} {s.lastName}</td>
                    <td className="p-4">{s.role}</td>
                    <td className="p-4">{s.department || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        s.dpdpConsentGiven ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {s.dpdpConsentGiven ? '✓ Active' : '✕ Pending'}
                      </span>
                    </td>
                    <td className="p-4">{s.dateOfJoining}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleEdit(s)} className="text-slate-400 hover:text-blue-400 transition cursor-pointer">Edit</button>
                      {s.isActive && (
                        <button onClick={() => handleDelete(s.id, `${s.firstName} ${s.lastName}`)} className="text-slate-400 hover:text-red-400 transition cursor-pointer">Deactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Onboarding Dialog Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass max-w-lg w-full rounded-2xl p-6 border border-slate-700/80 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-white font-bold text-base">{editingStaffId ? 'Update Employee' : 'New Employee Onboard'}</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
              </div>

              <form onSubmit={editingStaffId ? handleUpdate : handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-pink-500"
                    >
                      <option value="TEACHER">Teacher</option>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="LIBRARIAN">Librarian</option>
                      <option value="HOSTEL_WARDEN">Hostel Warden</option>
                      <option value="TRANSPORT_OFFICER">Transport Officer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Dept</label>
                    <input
                      type="text"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Employee ID</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingStaffId}
                      value={form.employeeId}
                      onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-500 disabled:opacity-50"
                      placeholder="EMP-055"
                    />
                  </div>
                </div>

                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-white text-xs font-semibold block">DPDP Consent Sign-off</span>
                    <span className="text-[10px] text-slate-400 block leading-tight">Has employee signed DPDP PII authorization form?</span>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!!editingStaffId}
                    checked={form.dpdpConsentGiven}
                    onChange={(e) => setForm({ ...form, dpdpConsentGiven: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 disabled:opacity-50"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="bg-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-500 text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    {editingStaffId ? 'Save Changes' : 'Complete Onboard'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
