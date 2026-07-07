import { FastifyInstance } from 'fastify';
import { Connection, Client } from '@temporalio/client';
import { onboardTenantSaga } from '../temporal/workflows';
import crypto from 'crypto';

export async function onboardingRoutes(fastify: FastifyInstance) {
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

  fastify.post('/tenants/onboard', async (request, reply) => {
    const { name, policyId } = request.body as { name: string, policyId: string };

    if (!name || !policyId) {
      return reply.status(400).send({ success: false, error: 'Missing name or policyId.' });
    }

    try {
      const temporalClient = await getTemporalClient();
      const workflowId = `onboard-tenant-${crypto.randomUUID()}`;

      await temporalClient.workflow.start(onboardTenantSaga, {
        taskQueue: 'platform-task-queue',
        workflowId,
        args: [{ name }, policyId],
      });

      fastify.log.info(`Started Onboarding Saga with Workflow ID: ${workflowId}`);

      return {
        success: true,
        message: 'Provisioning Started. Temporal Saga is orchestrating the cross-service setup.',
        workflowId
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}
