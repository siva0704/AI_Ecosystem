import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';

export async function runWorker() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'finance-task-queue',
  });

  console.log('👷‍♂️ Starting Temporal Worker for Core ERP (Finance)...');
  await worker.run();
}

// Allow running standalone for debugging if called directly
if (require.main === module) {
  runWorker().catch((err) => {
    console.error('Fatal worker error', err);
    process.exit(1);
  });
}
