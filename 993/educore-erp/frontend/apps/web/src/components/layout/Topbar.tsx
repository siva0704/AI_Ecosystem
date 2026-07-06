'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { ROLE_THEME } from '@/lib/types/auth';
import { cn } from '@/lib/utils';

export function Topbar({ pageTitle }: { pageTitle?: string }) {
  const { user } = useAuth();
  if (!user) return null;
  const theme = ROLE_THEME[user.role];

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-white font-semibold text-lg">{pageTitle || 'Dashboard'}</h1>
        <p className="text-slate-500 text-xs">{dateStr} · {timeStr}</p>
      </div>
      <div className="flex items-center gap-3">
        {/* Dev badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
          <span className="text-amber-400 text-xs">⚠</span>
          <span className="text-amber-300 text-xs font-mono">DEV MODE</span>
        </div>
        {/* Role badge */}
        <div className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', theme.badge)}>
          <span>Tier {user.tier}</span>
          <span>·</span>
          <span>{user.roleLabel}</span>
        </div>
      </div>
    </header>
  );
}
