'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { API_BASE } from '@/lib/types/auth';

interface DemoUser {
  email: string;
  password: string;
  name: string;
  role: string;
  tier: number;
  roleLabel: string;
  roleColor: string;
}

const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN:       'bg-indigo-700',
  INSTITUTION_ADMIN: 'bg-slate-700',
  PRINCIPAL:         'bg-blue-700',
  HOD:               'bg-cyan-700',
  TEACHER:           'bg-emerald-700',
  ACCOUNTANT:        'bg-amber-700',
  HR_MANAGER:        'bg-rose-700',
  TRANSPORT_OFFICER: 'bg-orange-700',
  HOSTEL_WARDEN:     'bg-teal-700',
  LIBRARIAN:         'bg-violet-700',
  STUDENT:           'bg-sky-700',
  PARENT:            'bg-fuchsia-700',
  AUDITOR:           'bg-slate-600',
};

const TIER_LABELS: Record<number, string> = {
  0: 'Tier 0 — Platform',
  1: 'Tier 1 — Institution',
  2: 'Tier 2 — Leadership',
  3: 'Tier 3 — Operations',
  4: 'Tier 4 — Student',
  5: 'Tier 5 — Parent',
  6: 'Tier 6 — External',
};

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [showDemo, setShowDemo] = useState(true);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(user.dashboardPath);
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/demo-users`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setDemoUsers(d.users); })
      .catch(() => {});
  }, []);

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

  const quickLogin = (u: DemoUser) => {
    setEmail(u.email);
    setPassword(u.password);
    setError('');
  };

  const filteredUsers = selectedTier !== null
    ? demoUsers.filter((u) => u.tier === selectedTier)
    : demoUsers;

  const tiers = [...new Set(demoUsers.map((u) => u.tier))].sort();

  return (
    <div className="min-h-screen bg-[#020817] flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
          EC
        </div>
        <div>
          <span className="text-white font-semibold text-lg tracking-tight">EduCore</span>
          <span className="text-slate-500 text-xs ml-2 font-mono">ERP v1.0-dev</span>
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
              <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
                <span className="text-amber-400 text-xs">⚠</span>
                <span className="text-amber-300 text-xs font-medium">Developer Mode — Demo Credentials Active</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="role@demo.educore.dev"
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
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
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

            {/* Toggle demo panel */}
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="w-full mt-4 text-xs text-slate-500 hover:text-slate-300 transition flex items-center justify-center gap-1"
            >
              {showDemo ? '▲ Hide' : '▼ Show'} demo credentials panel
            </button>
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

        {/* Demo Credentials Panel */}
        {showDemo && (
          <div className="flex-1 max-w-2xl fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-white font-semibold text-lg">Demo Credentials</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Click any role to auto-fill the login form</p>
                </div>
                <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1">
                  <span className="text-red-400 text-xs">🚫</span>
                  <span className="text-red-300 text-xs font-mono">NOT FOR PRODUCTION</span>
                </div>
              </div>

              {/* Tier filter */}
              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  onClick={() => setSelectedTier(null)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${selectedTier === null ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600 text-slate-400 hover:border-slate-400'}`}
                >
                  All Roles
                </button>
                {tiers.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTier(t === selectedTier ? null : t)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${selectedTier === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600 text-slate-400 hover:border-slate-400'}`}
                  >
                    {TIER_LABELS[t] || `Tier ${t}`}
                  </button>
                ))}
              </div>

              {demoUsers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Connecting to API Gateway…</p>
                  <p className="text-slate-600 text-xs mt-1">Make sure the backend is running on port 4000</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
                  {filteredUsers.map((u) => (
                    <button
                      key={u.email}
                      onClick={() => quickLogin(u)}
                      className={`text-left p-3.5 rounded-xl border transition-all group
                        ${email === u.email
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-slate-700 hover:border-slate-500 bg-slate-800/30 hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${ROLE_COLOR[u.role] || 'bg-slate-700'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          T{u.tier}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-white text-xs font-semibold truncate">{u.name}</span>
                            {email === u.email && (
                              <span className="text-xs bg-indigo-600 text-white px-1.5 rounded-full flex-shrink-0">Selected</span>
                            )}
                          </div>
                          <p className="text-slate-400 text-xs truncate">{u.roleLabel}</p>
                          <div className="mt-1.5 space-y-0.5">
                            <p className="text-slate-500 text-xs font-mono truncate">{u.email}</p>
                            <p className="text-slate-600 text-xs font-mono">{u.password}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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
