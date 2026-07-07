'use client';
import React, { useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default function TenantOnboardingPage() {
  const [name, setName] = useState('');
  const [policyId, setPolicyId] = useState('NEP_2020');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('http://localhost:8000/api/platform/tenants/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, policyId })
      });
      const data = await response.json();
      
      if (data.success) {
        setStatus({ type: 'success', message: data.message, workflowId: data.workflowId });
        setName('');
      } else {
        setStatus({ type: 'error', message: data.error });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell pageTitle="Onboard Institution" requiredRole="SUPER_ADMIN">
      <div className="max-w-3xl space-y-8 fade-in-up">
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Onboard Institution</h2>
        <p className="text-slate-400 text-lg">Provision a new tenant across the EduCore distributed ecosystem.</p>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl">
          <h3 className="text-xl font-semibold text-slate-100 mb-6 flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
            Tenant Configuration
          </h3>
          
          <form onSubmit={handleOnboard} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Institution Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-3 bg-slate-950/50 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all placeholder-slate-600"
                placeholder="e.g. Global Tech High School"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Academic Curriculum Policy</label>
              <select 
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                className="w-full px-5 py-3 bg-slate-950/50 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="NEP_2020">National Education Policy 2020 (5+3+3+4)</option>
                <option value="KA_SEP_2025">Karnataka State Policy 2025 (2+8+4)</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full relative overflow-hidden bg-rose-600 hover:bg-rose-500 text-white font-bold text-lg py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group mt-4 shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)]"
            >
              <span className="flex items-center justify-center gap-3 relative z-10">
                {loading ? (
                  <><svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Orchestrating Temporal Saga...</>
                ) : (
                  <>Provision Ecosystem <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg></>
                )}
              </span>
            </button>
          </form>

          {status && (
            <div className={`mt-8 p-5 rounded-xl border backdrop-blur-md animate-in fade-in slide-in-from-top-2 flex items-start gap-4 ${
              status.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                : 'bg-red-500/10 border-red-500/30 text-red-200'
            }`}>
              <div className="flex-1">
                <p className="font-semibold text-lg">{status.message}</p>
                {status.workflowId && (
                  <div className="mt-3 p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-sm break-all">
                    <span className="text-slate-400">Workflow ID:</span> <span className="text-emerald-400">{status.workflowId}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </DashboardShell>
  );
}
