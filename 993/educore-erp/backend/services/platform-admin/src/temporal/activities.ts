import { Context } from '@temporalio/activity';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://educore_app:educore_app_dev_password@localhost:5432/educore'
});

export async function insertTenantRecord(tenantData: any): Promise<string> {
  const tenantId = `TENANT-${Date.now()}`;
  console.log(`[Activity: insertTenantRecord] Provisioning tenant: ${tenantData.name} -> ID: ${tenantId}`);
  // In reality, this would insert into Postgres 'tenants' table.
  return tenantId;
}

export async function assignAcademicPolicy(tenantId: string, policyId: string): Promise<boolean> {
  console.log(`[Activity: assignAcademicPolicy] Calling academic-service to assign policy ${policyId} to ${tenantId}...`);
  try {
    // Call academic-service (bypassing Kong internally)
    const response = await fetch('http://educore_academic_service:4003/api/academic/institution/policy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, policy_id: policyId })
    });
    const data: any = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }
    console.log(`[Activity: assignAcademicPolicy] Success: ${data.assigned_policy}`);
    return true;
  } catch (err: any) {
    console.error(`[Activity: assignAcademicPolicy] Failed:`, err.message);
    throw new Error(`Academic Policy Assignment Failed: ${err.message}`);
  }
}

export async function initializeLedger(tenantId: string): Promise<boolean> {
  console.log(`[Activity: initializeLedger] Calling core-erp to initialize ledger for ${tenantId}...`);
  // Simulated HTTP call to core-erp
  const isSimulatedFailure = Math.random() < 0.2; // 20% chance to fail
  if (isSimulatedFailure) {
    console.error(`[Activity: initializeLedger] FAILED!`);
    throw new Error('Ledger Initialization Failed');
  }
  console.log(`[Activity: initializeLedger] Success.`);
  return true;
}

// Compensating Action
export async function deleteTenantRecord(tenantId: string): Promise<void> {
  console.warn(`[Activity: COMPENSATE deleteTenantRecord] Removing tenant ${tenantId} due to Saga failure...`);
  // Mock deletion
}
