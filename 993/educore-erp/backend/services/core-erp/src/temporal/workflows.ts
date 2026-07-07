import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { 
  createProfile, 
  captureFee, 
  allocateResource,
  deleteProfile,
  cancelFeeCapture
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

interface AdmissionSagaInput {
  tenantId: string;
  studentData: any;
  feeAmount: number;
  resourceId: string;
}

export async function admissionSaga(input: AdmissionSagaInput): Promise<string> {
  const { tenantId, studentData, feeAmount, resourceId } = input;
  
  // Track state for compensations
  let studentId: string | null = null;
  let txId: string | null = null;

  try {
    // Step 1: Create Profile
    studentId = await createProfile(tenantId, studentData);

    // Step 2: Capture Fee
    txId = await captureFee(tenantId, studentId, feeAmount);

    // Step 3: Allocate Resource
    await allocateResource(tenantId, studentId, resourceId);

    return `Admission completed successfully for ${studentId}. Transaction: ${txId}`;

  } catch (err) {
    // SAGA COMPENSATION: Execute in reverse order
    console.error(`[Saga] Encountered error. Executing compensation steps in reverse...`);
    
    if (txId) {
      // If fee was captured, refund/void it.
      await cancelFeeCapture(tenantId, txId);
    }
    
    if (studentId) {
      // If profile was created, delete it.
      await deleteProfile(tenantId, studentId);
    }

    throw new Error(`Admission Saga Failed and Compensated: ${(err as Error).message}`);
  }
}
