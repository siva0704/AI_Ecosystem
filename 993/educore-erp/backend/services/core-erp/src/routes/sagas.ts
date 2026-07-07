import { FastifyInstance } from 'fastify';
import { Connection, Client } from '@temporalio/client';
import { admissionSaga } from '../temporal/workflows';
import crypto from 'crypto';

export async function sagaRoutes(fastify: FastifyInstance) {
  // Initialize Temporal Client once for this module
  let client: Client | null = null;
  
  async function getTemporalClient() {
    if (!client) {
      const connection = await Connection.connect({ 
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233' 
      });
      client = new Client({ connection });
    }
    return client;
  }

  fastify.post('/admission/start', async (request, reply) => {
    const { tenant_id, student_data, fee_amount, resource_id } = request.body as any;

    if (!tenant_id || !fee_amount || !resource_id) {
      return reply.status(400).send({ success: false, error: 'Missing required parameters.' });
    }

    try {
      const temporalClient = await getTemporalClient();
      const workflowId = `admission-saga-${tenant_id}-${crypto.randomUUID()}`;

      // Start the workflow asynchronously (don't await result, let it run in background)
      const handle = await temporalClient.workflow.start(admissionSaga, {
        taskQueue: 'finance-task-queue',
        workflowId,
        args: [{ 
          tenantId: tenant_id, 
          studentData: student_data || {}, 
          feeAmount: fee_amount, 
          resourceId: resource_id 
        }],
      });

      fastify.log.info(`Started Admission Saga with Workflow ID: ${workflowId}`);

      return {
        success: true,
        message: 'Admission Saga initiated successfully. Sagas are processing asynchronously.',
        workflowId
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}
