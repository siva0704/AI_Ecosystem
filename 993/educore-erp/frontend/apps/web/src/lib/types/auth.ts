// EduCore ERP — Frontend Auth Types & RBAC Config
// Mirrors backend RBAC and RLS tier matrix from CONTEXT.md §3

export type Role =
  | 'SUPER_ADMIN'
  | 'INSTITUTION_ADMIN'
  | 'PRINCIPAL'
  | 'HOD'
  | 'TEACHER'
  | 'ACCOUNTANT'
  | 'HR_MANAGER'
  | 'TRANSPORT_OFFICER'
  | 'HOSTEL_WARDEN'
  | 'LIBRARIAN'
  | 'STUDENT'
  | 'PARENT'
  | 'AUDITOR';

export interface MenuItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  tier: number;
  tenantId: string;
  tenantName: string;
  subdomain: string;
  dashboardPath: string;
  menus: MenuItem[];
  roleLabel: string;
  roleColor: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

export const ROLE_THEME: Record<Role, { bg: string; text: string; border: string; badge: string }> = {
  SUPER_ADMIN:       { bg: 'bg-purple-950', text: 'text-purple-300', border: 'border-purple-700', badge: 'bg-purple-600 text-white' },
  INSTITUTION_ADMIN: { bg: 'bg-indigo-950', text: 'text-indigo-300', border: 'border-indigo-700', badge: 'bg-indigo-600 text-white' },
  PRINCIPAL:         { bg: 'bg-blue-950',   text: 'text-blue-300',   border: 'border-blue-700',   badge: 'bg-blue-600 text-white' },
  HOD:               { bg: 'bg-cyan-950',   text: 'text-cyan-300',   border: 'border-cyan-700',   badge: 'bg-cyan-600 text-white' },
  TEACHER:           { bg: 'bg-green-950',  text: 'text-green-300',  border: 'border-green-700',  badge: 'bg-green-600 text-white' },
  ACCOUNTANT:        { bg: 'bg-amber-950',  text: 'text-amber-300',  border: 'border-amber-700',  badge: 'bg-amber-600 text-white' },
  HR_MANAGER:        { bg: 'bg-pink-950',   text: 'text-pink-300',   border: 'border-pink-700',   badge: 'bg-pink-600 text-white' },
  TRANSPORT_OFFICER: { bg: 'bg-orange-950', text: 'text-orange-300', border: 'border-orange-700', badge: 'bg-orange-600 text-white' },
  HOSTEL_WARDEN:     { bg: 'bg-teal-950',   text: 'text-teal-300',   border: 'border-teal-700',   badge: 'bg-teal-600 text-white' },
  LIBRARIAN:         { bg: 'bg-violet-950', text: 'text-violet-300', border: 'border-violet-700', badge: 'bg-violet-600 text-white' },
  STUDENT:           { bg: 'bg-sky-950',    text: 'text-sky-300',    border: 'border-sky-700',    badge: 'bg-sky-600 text-white' },
  PARENT:            { bg: 'bg-rose-950',   text: 'text-rose-300',   border: 'border-rose-700',   badge: 'bg-rose-600 text-white' },
  AUDITOR:           { bg: 'bg-slate-900',  text: 'text-slate-300',  border: 'border-slate-600',  badge: 'bg-slate-600 text-white' },
};

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
