import { formatUsdcAmount } from '../src/modules/commerce/money.ts';
import { readCircleDeveloperWalletConfig } from '../src/platform/circle/config.ts';
import { CircleCapitalExecutionAdapter } from '../src/platform/circle/developer-wallets.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresCapitalRepository } from '../src/platform/persistence/capital-repository.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';

async function main(): Promise<void> {
  const databaseConfig = readDatabaseConnectionConfig('runtime');
  const circleConfig = readCircleDeveloperWalletConfig();
  const persistence = new PostgresPersistence(databaseConfig);
  try {
    const repository = new PostgresCapitalRepository(persistence);
    const context = await repository.getAllocationExecutionContext('cal_ops_pilot_northstar_v1');
    const balance = await new CircleCapitalExecutionAdapter(circleConfig).getUsdcBalance(
      context.providerWalletId,
    );
    console.log(`allocation=${context.allocationId} source=${context.sourceAddress} usdc=${formatUsdcAmount(balance)}`);
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint F balance check failed.');
  process.exitCode = 1;
});
