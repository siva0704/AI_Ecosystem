import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { 
  insertTenantRecord, 
  assignAcademicPolicy, 
  initializeLedger,
  deleteTenantRecord
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function onboardTenantSaga(tenantData: any, policyId: string): Promise<string> {
  let tenantId: string | null = null;

  try {
    // 1. Core Tenant Record
    tenantId = await insertTenantRecord(tenantData);

    // 2. Cross-Service: Academic Policy
    await assignAcademicPolicy(tenantId, policyId);

    // 3. Cross-Service: Finance Ledger
    await initializeLedger(tenantId);

    return `Successfully onboarded Tenant ${tenantId} across the ecosystem!`;
  } catch (err) {
    console.error(`[Saga] Onboarding failed. Triggering compensation...`);
    if (tenantId) {
      await deleteTenantRecord(tenantId);
    }
    throw new Error(`Onboarding Saga Failed and Compensated: ${(err as Error).message}`);
  }
}
