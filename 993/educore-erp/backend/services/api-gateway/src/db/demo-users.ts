/**
 * EduCore ERP — User Types Store
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
  password?: string;
  name: string;
  role: Role;
  tier: number;
  tenantId: string;
  tenantName: string;
  subdomain: string;
}

export const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const DEMO_TENANT_NAME = 'Greenfield Academy (Demo)';
