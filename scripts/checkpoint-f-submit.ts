import { readCircleDeveloperWalletConfig } from '../src/platform/circle/config.ts';
import { CircleCapitalExecutionAdapter } from '../src/platform/circle/developer-wallets.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresCapitalRepository } from '../src/platform/persistence/capital-repository.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';

const allocationId = process.argv.includes('--reference-economy')
  ? 'cal_reference_workbench_seed_v1'
  : 'cal_ops_pilot_northstar_v1';

async function main(): Promise<void> {
  const databaseConfig = readDatabaseConnectionConfig('runtime');
  const circleConfig = readCircleDeveloperWalletConfig();
  if (
    databaseConfig.environment !== 'PRIVATE_ARC_TESTNET' ||
    circleConfig.environment !== 'PRIVATE_ARC_TESTNET'
  ) {
    throw new Error('Checkpoint F allocation submission is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(databaseConfig);
  try {
    const repository = new PostgresCapitalRepository(persistence);
    const adapter = new CircleCapitalExecutionAdapter(circleConfig);
    const context = await repository.getAllocationExecutionContext(allocationId);
    if (context.state !== 'AUTHORIZED' && context.state !== 'OUTCOME_UNKNOWN') {
      throw new Error(`Capital allocation cannot be submitted from ${context.state}.`);
    }
    if (context.providerTransactionId !== null) {
      throw new Error('Capital allocation has a Circle transaction ID; reconcile instead of retrying.');
    }
    const balance = await adapter.getUsdcBalance(context.providerWalletId);
    if (balance <= context.amountMicroUsdc) {
      throw new Error('Capital Provider account balance must exceed allocation amount for gas headroom.');
    }
    let submission;
    try {
      submission = await adapter.submitCapitalTransfer({
        amountMicroUsdc: context.amountMicroUsdc,
        destinationAddress: context.destinationAddress,
        idempotencyKey: context.idempotencyKey,
        referenceId: context.allocationId,
        sourceAddress: context.sourceAddress,
      });
    } catch (error) {
      await repository.recordOutcomeUnknown({
        allocationId,
        providerState: 'SUBMISSION_ERROR_UNCLASSIFIED',
      });
      throw error;
    }
    try {
      await repository.recordSubmitted({
        allocationId,
        providerTransactionId: submission.providerTransactionId,
      });
    } catch (error) {
      await repository.recordOutcomeUnknown({
        allocationId,
        providerState: 'SUBMITTED_PERSISTENCE_AMBIGUITY',
        providerTransactionId: submission.providerTransactionId,
      });
      throw error;
    }
    console.log(
      `allocation=${allocationId} state=SUBMITTED provider_transaction=${submission.providerTransactionId}`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint F allocation submission failed.');
  process.exitCode = 1;
});
