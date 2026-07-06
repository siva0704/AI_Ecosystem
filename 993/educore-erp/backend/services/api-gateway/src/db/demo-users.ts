/**
 * EduCore ERP — Demo User Store
 * DEV-ONLY: These credentials exist purely for local developer testing.
 * NEVER ship this file to production. Production auth uses HashiCorp Vault + SSO.
 */

export type Role =
  | 'SUPER_ADMIN'        // Tier 0 — Platform Super Admin
  | 'INSTITUTION_ADMIN'  // Tier 1 — Institution Admin
  | 'PRINCIPAL'          // Tier 2
  | 'HOD'                // Tier 2
  | 'TEACHER'            // Tier 3
  | 'ACCOUNTANT'         // Tier 3
  | 'HR_MANAGER'         // Tier 3
  | 'TRANSPORT_OFFICER'  // Tier 3
  | 'HOSTEL_WARDEN'      // Tier 3
  | 'LIBRARIAN'          // Tier 3
  | 'STUDENT'            // Tier 4
  | 'PARENT'             // Tier 5
  | 'AUDITOR';           // Tier 6

export interface DemoUser {
  id: string;
  email: string;
  password: string; // plain text — DEV ONLY
  name: string;
  role: Role;
  tier: number;
  tenantId: string;
  tenantName: string;
  /** Subdomain this user belongs to (for routing) */
  subdomain: string;
}

export const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const DEMO_TENANT_NAME = 'Greenfield Academy (Demo)';

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'usr-000',
    email: 'superadmin@educore.dev',
    password: 'super@123',
    name: 'Platform Super Admin',
    role: 'SUPER_ADMIN',
    tier: 0,
    tenantId: '00000000-0000-0000-0000-000000000000',
    tenantName: 'EduCore Platform',
    subdomain: 'platform',
  },
  {
    id: 'usr-001',
    email: 'admin@demo.educore.dev',
    password: 'admin@123',
    name: 'Rajesh Sharma',
    role: 'INSTITUTION_ADMIN',
    tier: 1,
    tenantId: DEMO_TENANT_ID,
    tenantName: DEMO_TENANT_NAME,
    subdomain: 'demo',
  },
  {
    id: 'usr-002',
    email: 'principal@demo.educore.dev',
    password: 'principal@123',
    name: 'Dr. Priya Nair',
    role: 'PRINCIPAL',
    tier: 2,
    tenantId: DEMO_TENANT_ID,
    tenantName: DEMO_TENANT_NAME,
    subdomain: 'demo',
  },
  {
    id: 'usr-003',
    email: 'hod@demo.educore.dev',
    password: 'hod@123',
    name: 'Prof. Venkat Rao',
    role: 'HOD',
    tier: 2,
    tenantId: DEMO_TENANT_ID,
    tenantName: DEMO_TENANT_NAME,
    subdomain: 'demo',
  },
  {
    id: 'usr-004',
    email: 'teacher@demo.educore.dev',
    password: 'teacher@123',
    name: 'Anitha Menon',
    role: 'TEACHER',
    tier: 3,
    tenantId: DEMO_TENANT_ID,
    tenantName: DEMO_TENANT_NAME,
    subdomain: 'demo',
  },
  {
    id: 'usr-005',
    email: 'accountant@demo.educore.dev',
    password: 'accountant@123',
    name: 'Suresh Iyer',
    role: 'ACCOUNTANT',
    tier: 3,
    tenantId: DEMO_TENANT_ID,
    tenantName: DEMO_TENANT_NAME,
    subdomain: 'demo',
  },
  {
    id: 'usr-006',
    email: 'hr@demo.educore.dev',
    password: 'hr@123',
    name: 'Divya Krishnan',
    role: 'HR_MANAGER',
    tier: 3,
    tenantId: DEMO_TENANT_ID,
    tenantName: DEMO_TENANT_NAME,
    subdomain: 'demo',
  },
  {
    id: 'usr-007',
    email: 'transport@demo.educore.dev',
    password: 'transport@123',
    name: 'Ramesh Kumar',
    role: 'TRANSPORT_OFFICER',
    tier: 3,
    tenantId: DEMO_TENANT_ID,
    tenantName: DEMO_TENANT_NAME,
    subdomain: 'demo',
  },
  {
    id: 'usr-008',
    email: 'hostel@demo.educore.dev',
    password: 'hostel@123',
    name: 'Mrs. Lakshmi Devi',
    role: 'HOSTEL_WARDEN',
    tier: 3,
    tenantId: DEMO_TENANT_ID,
    tenantName: DEMO_TENANT_NAME,
    subdomain: 'demo',
  },
  {
    id: 'usr-009',
    email: 'librarian@demo.educore.dev',
    password: 'library@123',
    name: 'Mr. Arun Pillai',
    role: 'LIBRARIAN',
    tier: 3,
    tenantId: DEMO_TENANT_ID,
    tenantName: DEMO_TENANT_NAME,
    subdomain: 'demo',
  },
  {
    id: 'usr-010',
    email: 'student@demo.educore.dev',
    password: 'student@123',
    name: 'Arjun Patel',
    role: 'STUDENT',
    tier: 4,
    tenantId: DEMO_TENANT_ID,
    tenantName: DEMO_TENANT_NAME,
    subdomain: 'demo',
  },
  {
    id: 'usr-011',
    email: 'parent@demo.educore.dev',
    password: 'parent@123',
    name: 'Meena Patel',
    role: 'PARENT',
    tier: 5,
    tenantId: DEMO_TENANT_ID,
    tenantName: DEMO_TENANT_NAME,
    subdomain: 'demo',
  },
  {
    id: 'usr-012',
    email: 'auditor@demo.educore.dev',
    password: 'auditor@123',
    name: 'CA Vikram Singh',
    role: 'AUDITOR',
    tier: 6,
    tenantId: DEMO_TENANT_ID,
    tenantName: DEMO_TENANT_NAME,
    subdomain: 'demo',
  },
];

export function findUserByEmail(email: string): DemoUser | undefined {
  return DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
