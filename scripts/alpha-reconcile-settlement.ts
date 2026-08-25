import { ArcTestnetRpc } from '../src/platform/arc/rpc.ts';
import { readCircleDeveloperWalletConfig } from '../src/platform/circle/config.ts';
import { CircleDeveloperWalletAdapter } from '../src/platform/circle/developer-wallets.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresAlphaCommerceRepository } from '../src/platform/persistence/alpha-commerce-repository.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';

const settlementId = 'set_arc_snapshot_v1' as const;

async function main(): Promise<void> {
  const databaseConfig = readDatabaseConnectionConfig('runtime');
  const circleConfig = readCircleDeveloperWalletConfig();
  if (
    databaseConfig.environment !== 'PRIVATE_ARC_TESTNET' ||
    circleConfig.environment !== 'PRIVATE_ARC_TESTNET'
  ) {
    throw new Error('Alpha settlement reconciliation is restricted to PRIVATE_ARC_TESTNET.');
  }

  const persistence = new PostgresPersistence(databaseConfig);
  const commerce = new PostgresAlphaCommerceRepository(persistence);
  const walletAdapter = new CircleDeveloperWalletAdapter(circleConfig);
  const arcRpc = new ArcTestnetRpc();

  try {
    const context = await commerce.getSettlementExecutionContext(settlementId);
    if (context.providerTransactionId === null) {
      throw new Error('Settlement has no Circle transaction ID to reconcile.');
    }

    const outcome = await walletAdapter.observeTransfer(context.providerTransactionId);
    if (outcome.state === 'COMPLETE') {
      await arcRpc.verifyUsdcTransfer({
        amountMicroUsdc: context.amountMicroUsdc,
        destinationAddress: context.destinationAddress,
        sourceAddress: context.sourceAddress,
        transactionHash: outcome.transactionHash,
      });
    }

    await commerce.recordObservedOutcome({
      observedAt: new Date().toISOString(),
      outcome,
      settlementId,
    });
    console.log(
      `settlement=${settlementId} state=${outcome.state} provider_state=${outcome.providerState}${
        outcome.state === 'COMPLETE' ? ` tx_hash=${outcome.transactionHash}` : ''
      }`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Alpha settlement reconciliation failed.');
  process.exitCode = 1;
});
