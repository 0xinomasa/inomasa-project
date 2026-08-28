import { readCircleDeveloperWalletConfig } from '../src/platform/circle/config.ts';
import { CircleCapitalExecutionAdapter } from '../src/platform/circle/developer-wallets.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresCapitalRepository } from '../src/platform/persistence/capital-repository.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';

async function main(): Promise<void> {
  const databaseConfig = readDatabaseConnectionConfig('runtime');
  const circleConfig = readCircleDeveloperWalletConfig();
  if (
    databaseConfig.environment !== 'PRIVATE_ARC_TESTNET' ||
    circleConfig.environment !== 'PRIVATE_ARC_TESTNET'
  ) {
    throw new Error('Checkpoint F provisioning is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(databaseConfig);
  try {
    const repository = new PostgresCapitalRepository(persistence);
    const adapter = new CircleCapitalExecutionAdapter(circleConfig);
    const pending = await repository.listPendingAccounts();
    for (const account of pending) {
      const wallet = await adapter.provisionCapitalAccount({
        displayName: account.displayName,
        idempotencyKey: 'bc09a0a7-6a7f-4b98-8531-828d191b6e94',
        providerId: account.providerId,
      });
      await repository.activateProviderAccount({
        address: wallet.address,
        providerAccountId: account.providerAccountId,
        providerWalletId: wallet.providerWalletId,
      });
      console.log(
        `provider=${account.providerId} account=${account.providerAccountId} address=${wallet.address} state=ACTIVE`,
      );
    }
    if (pending.length === 0) console.log('capital_provider_accounts=ALREADY_ACTIVE');
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint F provisioning failed.');
  process.exitCode = 1;
});
