'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

interface DashboardShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  /** If set, only this role can access this page */
  requiredRole?: string;
}

export function DashboardShell({ children, pageTitle, requiredRole }: DashboardShellProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/login');
    } else if (requiredRole && user.role !== requiredRole) {
      // RBAC guard — redirect to own dashboard
      router.replace(user.dashboardPath);
    }
  }, [isAuthenticated, user, router, requiredRole]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Authenticating…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar pageTitle={pageTitle} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
