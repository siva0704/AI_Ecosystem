'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { API_BASE } from '@/lib/types/auth';

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(user.dashboardPath);
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020817] flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
          EC
        </div>
        <div>
          <span className="text-white font-semibold text-lg tracking-tight">EduCore</span>
          <span className="text-slate-500 text-xs ml-2 font-mono">ERP v1.0</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="pulse-dot w-2 h-2 bg-green-500 rounded-full inline-block" />
          <span className="text-xs text-slate-400">API: {API_BASE}</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-4 pt-8 gap-8 max-w-screen-xl mx-auto w-full">
        {/* Login Card */}
        <div className="w-full max-w-md flex-shrink-0 fade-in-up">
          <div className="glass rounded-2xl p-8 glow-purple">
            <div className="p-8 pb-10">
            {/* Logo area */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
                🎓
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">EduCore ERP</h1>
              <p className="text-slate-400 text-sm">AI-Native Education Management Platform</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-slate-800/60 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-800/60 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">⚠</span>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    <span>🔐</span>
                    <span>Sign In to EduCore</span>
                  </>
                )}
              </button>
            </form>
            </div>
          </div>

          {/* RBAC Info */}
          <div className="mt-4 glass rounded-xl p-4">
            <p className="text-xs text-slate-500 text-center">
              7-tier RBAC &nbsp;·&nbsp; Row-Level Security &nbsp;·&nbsp; Multi-tenant isolation
              <br />
              <span className="text-slate-600">Governed by NIST CSF 2.0 · DPDP Rules 2025</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-slate-600 text-xs">
          EduCore ERP &copy; 2026 &nbsp;·&nbsp; Phase 1 MVP &nbsp;·&nbsp; Agentic Development Build
        </p>
      </footer>
    </div>
  );
}
