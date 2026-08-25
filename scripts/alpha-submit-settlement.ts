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
    throw new Error('Alpha settlement submission is restricted to PRIVATE_ARC_TESTNET.');
  }

  const persistence = new PostgresPersistence(databaseConfig);
  const commerce = new PostgresAlphaCommerceRepository(persistence);
  const walletAdapter = new CircleDeveloperWalletAdapter(circleConfig);

  try {
    const context = await commerce.getSettlementExecutionContext(settlementId);
    if (context.state !== 'AUTHORIZED' && context.state !== 'OUTCOME_UNKNOWN') {
      throw new Error(`Settlement ${settlementId} cannot be submitted from state ${context.state}.`);
    }
    if (context.providerTransactionId !== null) {
      throw new Error('Settlement already has a Circle transaction ID; reconcile it instead of retrying.');
    }

    const balance = await walletAdapter.getUsdcBalance(context.sourceProviderWalletId);
    if (balance <= context.amountMicroUsdc) {
      throw new Error('Buyer Treasury balance must exceed the service amount to preserve gas headroom.');
    }

    let submission;
    try {
      submission = await walletAdapter.submitTransfer({
        amountMicroUsdc: context.amountMicroUsdc,
        destinationAddress: context.destinationAddress,
        idempotencyKey: context.idempotencyKey,
        referenceId: context.obligationId,
        sourceAddress: context.sourceAddress,
      });
    } catch (error) {
      await commerce.recordOutcomeUnknown({
        providerState: 'SUBMISSION_ERROR_UNCLASSIFIED',
        settlementId,
      });
      throw error;
    }

    try {
      await commerce.recordSubmitted({
        providerTransactionId: submission.providerTransactionId,
        settlementId,
      });
      console.log(
        `settlement=${settlementId} state=SUBMITTED provider_transaction=${submission.providerTransactionId}`,
      );
    } catch (error) {
      await commerce.recordOutcomeUnknown({
        providerState: 'SUBMITTED_PERSISTENCE_AMBIGUITY',
        providerTransactionId: submission.providerTransactionId,
        settlementId,
      });
      throw error;
    }
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Alpha settlement submission failed.');
  process.exitCode = 1;
});
