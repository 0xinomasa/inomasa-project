import { ArcTestnetRpc } from '../src/platform/arc/rpc.ts';
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
  const persistence = new PostgresPersistence(databaseConfig);
  try {
    const repository = new PostgresCapitalRepository(persistence);
    const context = await repository.getAllocationExecutionContext(allocationId);
    if (context.providerTransactionId === null) {
      throw new Error('Capital allocation has no Circle transaction ID to reconcile.');
    }
    const outcome = await new CircleCapitalExecutionAdapter(circleConfig).observeTransfer(
      context.providerTransactionId,
    );
    let blockNumber: bigint | undefined;
    if (outcome.state === 'COMPLETE') {
      const proof = await new ArcTestnetRpc().verifyUsdcTransfer({
        amountMicroUsdc: context.amountMicroUsdc,
        destinationAddress: context.destinationAddress,
        sourceAddress: context.sourceAddress,
        transactionHash: outcome.transactionHash,
      });
      blockNumber = proof.blockNumber;
    }
    await repository.recordObservedOutcome({
      allocationId,
      ...(blockNumber === undefined ? {} : { blockNumber }),
      observedAt: new Date().toISOString(),
      outcome,
    });
    console.log(
      `allocation=${allocationId} state=${outcome.state} provider_state=${outcome.providerState}${
        outcome.state === 'COMPLETE' ? ` tx_hash=${outcome.transactionHash} block=${blockNumber}` : ''
      }`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint F reconciliation failed.');
  process.exitCode = 1;
});
