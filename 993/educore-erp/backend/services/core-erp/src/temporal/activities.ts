import { Context } from '@temporalio/activity';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://educore_app:educore_app_dev_password@localhost:5432/educore'
});

export async function createProfile(tenantId: string, data: any): Promise<string> {
  console.log(`[Activity: createProfile] Starting for tenant ${tenantId}...`);
  // Mock DB insert
  const studentId = `STU-${Date.now()}`;
  console.log(`[Activity: createProfile] Success. Created student: ${studentId}`);
  return studentId;
}

export async function captureFee(tenantId: string, studentId: string, amount: number): Promise<string> {
  console.log(`[Activity: captureFee] Capturing fee of ${amount} for student ${studentId}...`);
  const txId = `TX-${Date.now()}`;
  
  // Here we would strictly interact with the immutable fee_transactions ledger.
  // Mocking the success:
  console.log(`[Activity: captureFee] Success. Transaction ID: ${txId}`);
  return txId;
}

export async function allocateResource(tenantId: string, studentId: string, resourceId: string): Promise<boolean> {
  console.log(`[Activity: allocateResource] Allocating resource ${resourceId} for student ${studentId}...`);
  
  // Simulated failure rate to demonstrate Temporal Sagas compensating actions.
  // In a real scenario, this could fail if the library book is taken or the hostel bed is full.
  const shouldFail = Math.random() < 0.5; // 50% chance to fail
  
  if (shouldFail) {
    console.error(`[Activity: allocateResource] FAILED! Resource ${resourceId} is unavailable.`);
    throw new Error('ResourceAllocationFailed');
  }

  console.log(`[Activity: allocateResource] Success. Resource allocated.`);
  return true;
}

// ==========================================
// COMPENSATING ACTIONS
// ==========================================

export async function cancelFeeCapture(tenantId: string, txId: string): Promise<void> {
  console.warn(`[Activity: COMPENSATE cancelFeeCapture] Reversing transaction ${txId} for tenant ${tenantId}. Executing refund/void...`);
  // Mocking refund logic
}

export async function deleteProfile(tenantId: string, studentId: string): Promise<void> {
  console.warn(`[Activity: COMPENSATE deleteProfile] Deleting profile ${studentId} for tenant ${tenantId}...`);
  // Mocking deletion logic
}
