'use client';
import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AlertBanner } from '@/components/ui/DashboardWidgets';
import { API_BASE } from '@/lib/types/auth';

export default function ComplianceDashboard() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ACADEMIC');

  const loadData = async () => {
    const token = localStorage.getItem('educore_token');
    const gRes = await fetch(`${API_BASE}/api/compliance/grievances`, { headers: { Authorization: `Bearer ${token}` } });
    const gData = await gRes.json();
    if (gData.success) setGrievances(gData.data);

    const cRes = await fetch(`${API_BASE}/api/compliance/dpdp-consent`, { headers: { Authorization: `Bearer ${token}` } });
    const cData = await cRes.json();
    if (cData.success) setConsents(cData.data);
  };

  useEffect(() => { loadData(); }, []);

  const submitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('educore_token');
    const res = await fetch(`${API_BASE}/api/compliance/grievances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subject, description, category })
    });
    const data = await res.json();
    if (data.success) {
      setMessage({ type: 'success', text: 'Grievance submitted successfully' });
      setSubject(''); setDescription('');
      loadData();
    } else {
      setMessage({ type: 'error', text: 'Failed to submit grievance' });
    }
  };

  const resolveGrievance = async (id: string) => {
    const resolution = prompt('Enter resolution summary:');
    if (!resolution) return;
    const token = localStorage.getItem('educore_token');
    const res = await fetch(`${API_BASE}/api/compliance/grievances/${id}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resolution })
    });
    if (res.ok) loadData();
  };

  return (
    <DashboardShell pageTitle="Compliance & Grievances" requiredRole="STAFF">
      <div className="space-y-6 max-w-6xl mx-auto">
        {message && <AlertBanner type={message.type} message={message.text} />}
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass p-5 rounded-2xl">
            <h3 className="text-white font-bold mb-4">Submit Grievance</h3>
            <form onSubmit={submitGrievance} className="space-y-3">
              <input type="text" placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2" />
              <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2">
                <option value="ACADEMIC">Academic</option>
                <option value="ADMINISTRATIVE">Administrative</option>
                <option value="HOSTEL">Hostel</option>
                <option value="TRANSPORT">Transport</option>
              </select>
              <textarea placeholder="Description..." value={description} onChange={e=>setDescription(e.target.value)} required rows={4} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2" />
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-xl">Submit</button>
            </form>
          </div>

          <div className="glass p-5 rounded-2xl overflow-y-auto max-h-[400px]">
            <h3 className="text-white font-bold mb-4">Grievance Log</h3>
            <div className="space-y-3">
              {grievances.map(g => (
                <div key={g.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between mb-1">
                    <span className="text-white font-medium text-sm">{g.subject}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{g.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{g.description}</p>
                  {g.status === 'OPEN' && (
                    <button onClick={() => resolveGrievance(g.id)} className="text-xs text-indigo-400 hover:text-indigo-300">Mark as Resolved</button>
                  )}
                  {g.resolution && <p className="text-xs text-green-400 mt-2">Resolution: {g.resolution}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
