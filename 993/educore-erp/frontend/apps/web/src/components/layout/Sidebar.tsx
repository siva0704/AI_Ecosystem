'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { ROLE_THEME } from '@/lib/types/auth';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;
  const theme = ROLE_THEME[user.role];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className={cn('w-64 flex-shrink-0 flex flex-col h-screen sticky top-0', theme.bg, 'border-r', theme.border)}>
      {/* Brand */}
      <div className="p-5 border-b border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            EC
          </div>
          <div>
            <div className="text-white font-bold text-sm">EduCore ERP</div>
            <div className="text-slate-500 text-xs truncate max-w-[130px]">{user.tenantName}</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm', theme.badge)}>
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <span className={cn('text-xs px-2 py-0.5 rounded-full', theme.badge)}>{user.roleLabel}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {user.menus.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                isActive
                  ? cn('bg-white/10', theme.text, 'font-medium')
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <span className="text-base w-6 text-center">{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Tier badge & logout */}
      <div className="p-4 border-t border-white/5 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Access Tier</span>
          <span className={cn('px-2 py-0.5 rounded-full font-mono', theme.badge)}>T{user.tier}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Tenant</span>
          <span className="font-mono text-slate-400 truncate max-w-[100px]">{user.subdomain}</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition text-sm"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
