import { Role } from '../db/demo-users';

/**
 * EduCore RBAC — Role Permission Map
 * Defines which menu items, features, and sub-routes each role can access.
 * Mirrors the RLS tier matrix in /docs/security/rls-tenant-matrix.md
 */

export interface MenuItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

export interface RoleConfig {
  tier: number;
  dashboardPath: string;
  label: string;
  color: string;          // Tailwind color token for role badge
  menus: MenuItem[];
  allowedRoutes: string[]; // route prefixes this role can access
}

export const RBAC_CONFIG: Record<Role, RoleConfig> = {
  SUPER_ADMIN: {
    tier: 0,
    dashboardPath: '/platform/dashboard',
    label: 'Platform Super Admin',
    color: 'purple',
    menus: [
      { label: 'Platform Overview', href: '/platform/dashboard', icon: '🌐' },
      { label: 'All Tenants', href: '/platform/tenants', icon: '🏫' },
      { label: 'Global Billing', href: '/platform/billing', icon: '💳' },
      { label: 'Feature Flags', href: '/platform/flags', icon: '🚩' },
      { label: 'Global Audit Log', href: '/platform/audit', icon: '📋' },
      { label: 'System Health', href: '/platform/health', icon: '❤️' },
    ],
    allowedRoutes: ['/platform'],
  },
  INSTITUTION_ADMIN: {
    tier: 1,
    dashboardPath: '/admin/dashboard',
    label: 'Institution Admin',
    color: 'indigo',
    menus: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: '🏠' },
      { label: 'Admissions', href: '/admin/admissions', icon: '🎓' },
      { label: 'Academic Setup', href: '/admin/academic', icon: '📚' },
      { label: 'Staff Management', href: '/admin/staff', icon: '👥' },
      { label: 'Finance Overview', href: '/admin/finance', icon: '💰' },
      { label: 'Fee Structures', href: '/admin/fees', icon: '🧾' },
      { label: 'Campus & Branches', href: '/admin/campus', icon: '🏫' },
      { label: 'Compliance', href: '/admin/compliance', icon: '⚖️' },
      { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
    ],
    allowedRoutes: ['/admin'],
  },
  PRINCIPAL: {
    tier: 2,
    dashboardPath: '/principal/dashboard',
    label: 'Principal',
    color: 'blue',
    menus: [
      { label: 'Dashboard', href: '/principal/dashboard', icon: '🏠' },
      { label: 'Academic Calendar', href: '/principal/calendar', icon: '📅' },
      { label: 'Staff Overview', href: '/principal/staff', icon: '👨‍🏫' },
      { label: 'Class Performance', href: '/principal/performance', icon: '📊' },
      { label: 'Attendance Reports', href: '/principal/attendance', icon: '✅' },
      { label: 'Approvals Inbox', href: '/principal/approvals', icon: '📬', badge: '3' },
      { label: 'Announcements', href: '/principal/announcements', icon: '📢' },
    ],
    allowedRoutes: ['/principal'],
  },
  HOD: {
    tier: 2,
    dashboardPath: '/hod/dashboard',
    label: 'Head of Department',
    color: 'cyan',
    menus: [
      { label: 'Dashboard', href: '/hod/dashboard', icon: '🏠' },
      { label: 'Department Staff', href: '/hod/staff', icon: '👥' },
      { label: 'Curriculum', href: '/hod/curriculum', icon: '📖' },
      { label: 'Timetable', href: '/hod/timetable', icon: '🗓️' },
      { label: 'Exam Schedule', href: '/hod/exams', icon: '✏️' },
      { label: 'Performance Analytics', href: '/hod/analytics', icon: '📈' },
    ],
    allowedRoutes: ['/hod'],
  },
  TEACHER: {
    tier: 3,
    dashboardPath: '/teacher/dashboard',
    label: 'Teacher',
    color: 'green',
    menus: [
      { label: 'Dashboard', href: '/teacher/dashboard', icon: '🏠' },
      { label: 'My Classes', href: '/teacher/classes', icon: '🏫' },
      { label: 'Attendance', href: '/teacher/attendance', icon: '✅', badge: 'Due' },
      { label: 'Assignments', href: '/teacher/assignments', icon: '📝' },
      { label: 'Gradebook', href: '/teacher/gradebook', icon: '📊' },
      { label: 'Timetable', href: '/teacher/timetable', icon: '🗓️' },
      { label: 'Leave Requests', href: '/teacher/leave', icon: '🏖️' },
    ],
    allowedRoutes: ['/teacher'],
  },
  ACCOUNTANT: {
    tier: 3,
    dashboardPath: '/finance/dashboard',
    label: 'Finance / Accountant',
    color: 'amber',
    menus: [
      { label: 'Dashboard', href: '/finance/dashboard', icon: '🏠' },
      { label: 'Fee Collection', href: '/finance/fees', icon: '💳' },
      { label: 'Payment Ledger', href: '/finance/ledger', icon: '📒' },
      { label: 'Pending Dues', href: '/finance/dues', icon: '⚠️', badge: '12' },
      { label: 'Payroll', href: '/finance/payroll', icon: '💰' },
      { label: 'GST Reports', href: '/finance/gst', icon: '🧾' },
      { label: 'Receipts', href: '/finance/receipts', icon: '🧾' },
    ],
    allowedRoutes: ['/finance'],
  },
  HR_MANAGER: {
    tier: 3,
    dashboardPath: '/hr/dashboard',
    label: 'HR Manager',
    color: 'pink',
    menus: [
      { label: 'Dashboard', href: '/hr/dashboard', icon: '🏠' },
      { label: 'Staff Directory', href: '/hr/staff', icon: '👥' },
      { label: 'Onboarding', href: '/hr/onboarding', icon: '🆕' },
      { label: 'Leave Management', href: '/hr/leave', icon: '🏖️' },
      { label: 'Payroll Initiation', href: '/hr/payroll', icon: '💰' },
      { label: 'DPDP Consent', href: '/hr/dpdp', icon: '🔒' },
      { label: 'Performance Reviews', href: '/hr/performance', icon: '⭐' },
    ],
    allowedRoutes: ['/hr'],
  },
  TRANSPORT_OFFICER: {
    tier: 3,
    dashboardPath: '/transport/dashboard',
    label: 'Transport Officer',
    color: 'orange',
    menus: [
      { label: 'Dashboard', href: '/transport/dashboard', icon: '🏠' },
      { label: 'Live GPS Tracking', href: '/transport/gps', icon: '📍' },
      { label: 'Route Management', href: '/transport/routes', icon: '🗺️' },
      { label: 'Driver Roster', href: '/transport/drivers', icon: '🚌' },
      { label: 'Vehicle Register', href: '/transport/vehicles', icon: '🚐' },
      { label: 'Incident Logs', href: '/transport/incidents', icon: '⚠️' },
    ],
    allowedRoutes: ['/transport'],
  },
  HOSTEL_WARDEN: {
    tier: 3,
    dashboardPath: '/hostel/dashboard',
    label: 'Hostel Warden',
    color: 'teal',
    menus: [
      { label: 'Dashboard', href: '/hostel/dashboard', icon: '🏠' },
      { label: 'Room Allocation', href: '/hostel/rooms', icon: '🛏️' },
      { label: 'Student Roster', href: '/hostel/students', icon: '👦' },
      { label: 'Mess Menu', href: '/hostel/mess', icon: '🍽️' },
      { label: 'Attendance', href: '/hostel/attendance', icon: '✅' },
      { label: 'Maintenance', href: '/hostel/maintenance', icon: '🔧' },
    ],
    allowedRoutes: ['/hostel'],
  },
  LIBRARIAN: {
    tier: 3,
    dashboardPath: '/library/dashboard',
    label: 'Librarian',
    color: 'violet',
    menus: [
      { label: 'Dashboard', href: '/library/dashboard', icon: '🏠' },
      { label: 'Book Catalog', href: '/library/catalog', icon: '📚' },
      { label: 'Issue / Return', href: '/library/transactions', icon: '🔄' },
      { label: 'Overdue Books', href: '/library/overdue', icon: '⚠️', badge: '5' },
      { label: 'Digital Resources', href: '/library/digital', icon: '💻' },
      { label: 'Reservations', href: '/library/reservations', icon: '🔖' },
    ],
    allowedRoutes: ['/library'],
  },
  STUDENT: {
    tier: 4,
    dashboardPath: '/student/dashboard',
    label: 'Student',
    color: 'sky',
    menus: [
      { label: 'Dashboard', href: '/student/dashboard', icon: '🏠' },
      { label: 'My Attendance', href: '/student/attendance', icon: '✅' },
      { label: 'Assignments', href: '/student/assignments', icon: '📝', badge: '2' },
      { label: 'Results & Grades', href: '/student/grades', icon: '📊' },
      { label: 'Timetable', href: '/student/timetable', icon: '🗓️' },
      { label: 'Fee Status', href: '/student/fees', icon: '💳' },
      { label: 'Library', href: '/student/library', icon: '📚' },
    ],
    allowedRoutes: ['/student'],
  },
  PARENT: {
    tier: 5,
    dashboardPath: '/parent/dashboard',
    label: 'Parent / Guardian',
    color: 'rose',
    menus: [
      { label: 'Dashboard', href: '/parent/dashboard', icon: '🏠' },
      { label: "Ward's Attendance", href: '/parent/attendance', icon: '✅' },
      { label: 'Homework', href: '/parent/homework', icon: '📝' },
      { label: 'Fee Payment', href: '/parent/fees', icon: '💳', badge: 'Due' },
      { label: 'Bus Tracking', href: '/parent/transport', icon: '📍' },
      { label: 'Report Card', href: '/parent/results', icon: '📊' },
      { label: 'Consent Inbox', href: '/parent/consent', icon: '📬', badge: '1' },
    ],
    allowedRoutes: ['/parent'],
  },
  AUDITOR: {
    tier: 6,
    dashboardPath: '/audit/dashboard',
    label: 'External Auditor',
    color: 'slate',
    menus: [
      { label: 'Dashboard', href: '/audit/dashboard', icon: '🏠' },
      { label: 'Compliance Export', href: '/audit/export', icon: '📤' },
      { label: 'Financial Trails', href: '/audit/finance', icon: '📋' },
      { label: 'Access Logs', href: '/audit/logs', icon: '🔍' },
    ],
    allowedRoutes: ['/audit'],
  },
};

export function getRoleConfig(role: Role): RoleConfig {
  return RBAC_CONFIG[role];
}

export function canAccess(role: Role, routePath: string): boolean {
  const config = RBAC_CONFIG[role];
  return config.allowedRoutes.some((prefix) => routePath.startsWith(prefix));
}
