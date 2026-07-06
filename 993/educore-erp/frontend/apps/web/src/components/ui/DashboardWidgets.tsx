'use client';

import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: { value: string; positive: boolean };
  color?: 'indigo' | 'green' | 'amber' | 'red' | 'purple' | 'cyan' | 'pink' | 'orange' | 'teal';
}

const COLOR_MAP = {
  indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  green:  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  amber:  'bg-amber-500/10 border-amber-500/20 text-amber-400',
  red:    'bg-rose-500/10 border-rose-500/20 text-rose-400',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  cyan:   'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  pink:   'bg-pink-500/10 border-pink-500/20 text-pink-400',
  orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  teal:   'bg-teal-500/10 border-teal-500/20 text-teal-400',
};

export function StatCard({ label, value, icon, trend, color = 'indigo' }: StatCardProps) {
  const colorClass = COLOR_MAP[color];
  return (
    <div className={cn('rounded-2xl border bg-slate-900/50 p-5 transition hover:scale-[1.02]', colorClass)}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', trend.positive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}

interface QuickActionProps {
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  color?: string;
}

export function QuickAction({ label, icon, href, onClick, color = 'indigo' }: QuickActionProps) {
  const cls = 'flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-800/30 hover:bg-slate-800/60 transition cursor-pointer group';
  const inner = (
    <>
      <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-xs text-slate-300 text-center font-medium">{label}</span>
    </>
  );
  if (href) {
    return <a href={href} className={cls}>{inner}</a>;
  }
  return <button onClick={onClick} className={cls}>{inner}</button>;
}

interface AlertBannerProps {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

const ALERT_STYLES = {
  info:    'bg-blue-500/10 border-blue-500/30 text-blue-300',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  error:   'bg-red-500/10 border-red-500/30 text-red-300',
  success: 'bg-green-500/10 border-green-500/30 text-green-300',
};

const ALERT_ICONS = { info: 'ℹ', warning: '⚠', error: '✕', success: '✓' };

export function AlertBanner({ type, message }: AlertBannerProps) {
  return (
    <div className={cn('flex items-center gap-2 px-4 py-3 rounded-xl border text-sm', ALERT_STYLES[type])}>
      <span>{ALERT_ICONS[type]}</span>
      <span>{message}</span>
    </div>
  );
}
