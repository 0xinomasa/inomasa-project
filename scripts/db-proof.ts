import {
  DatabaseConfigurationError,
  readDatabaseConnectionConfig,
} from '../src/platform/persistence/config.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';
import { runEngineeringPersistenceProof } from '../src/platform/persistence/engineering-proof.ts';
import { runOperationalWorkspacePersistenceProof } from '../src/platform/persistence/operational-workspace-proof.ts';

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  const persistence = new PostgresPersistence(config);

  try {
    await persistence.verifyConnection();
    console.log(`database_connection=PASS environment=${config.environment}`);

    const proof = await runEngineeringPersistenceProof(persistence);
    if (!proof.valueVerified || !proof.rollbackVerified) {
      throw new Error('The B3 persistence proof did not satisfy all assertions.');
    }

    console.log('database_write_read=PASS');
    console.log('database_transaction_rollback=PASS');

    const operationalProof = await runOperationalWorkspacePersistenceProof(persistence);
    if (Object.values(operationalProof).some((verified) => !verified)) {
      throw new Error('The Work 2 Operational Workspace persistence proof did not satisfy all assertions.');
    }
    console.log('work_2_offer_idempotency=PASS');
    console.log('work_2_agent_idempotency=PASS');
    console.log('work_2_tenant_isolation=PASS');
    console.log('work_2_treasury_isolation=PASS');
    console.log('work_2_transaction_rollback=PASS');
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  const stage =
    error instanceof DatabaseConfigurationError
      ? error.message
      : 'Database persistence proof failed.';
  console.error(`${stage} Connection details were not logged.`);
  process.exitCode = 1;
});
