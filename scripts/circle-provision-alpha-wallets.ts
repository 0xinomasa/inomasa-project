import {
  activateCircleTreasuryBinding,
  type TreasuryBinding,
} from '../src/modules/business/treasury.ts';
import { readCircleDeveloperWalletConfig } from '../src/platform/circle/config.ts';
import { CircleDeveloperWalletAdapter } from '../src/platform/circle/developer-wallets.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresAlphaBusinessRepository } from '../src/platform/persistence/alpha-business-repository.ts';
import { PostgresPersistence } from '../src/platform/persistence/database.ts';

const provisioningProfiles = {
  biz_ops_pilot: {
    activeBindingId: 'tbn_ops_pilot_2',
    idempotencyKey: '86afbb56-1436-43de-aa35-27896f8af00a',
  },
  biz_signal_forge: {
    activeBindingId: 'tbn_signal_forge_2',
    idempotencyKey: 'ddccfbfd-d3b9-4c6c-83ef-28e5082fce89',
  },
} as const;

async function main(): Promise<void> {
  const databaseConfig = readDatabaseConnectionConfig('runtime');
  const circleConfig = readCircleDeveloperWalletConfig();
  if (
    databaseConfig.environment !== 'PRIVATE_ARC_TESTNET' ||
    circleConfig.environment !== 'PRIVATE_ARC_TESTNET'
  ) {
    throw new Error('Circle Alpha provisioning is restricted to PRIVATE_ARC_TESTNET.');
  }

  const persistence = new PostgresPersistence(databaseConfig);
  const repository = new PostgresAlphaBusinessRepository(persistence);
  const walletAdapter = new CircleDeveloperWalletAdapter(circleConfig);

  try {
    const pendingBindings = await repository.listPendingTreasuryBindings();
    for (const pending of pendingBindings) {
      const profile = provisioningProfiles[pending.businessId as keyof typeof provisioningProfiles];
      if (profile === undefined) {
        throw new Error(`No reviewed Circle provisioning profile exists for ${pending.businessId}.`);
      }

      const wallet = await walletAdapter.provisionWallet({
        businessId: pending.businessId,
        displayName: pending.displayName,
        idempotencyKey: profile.idempotencyKey,
      });
      const pendingBinding: TreasuryBinding = {
        accountAssurance: 'PLATFORM_CONTROLLED_EXTERNAL',
        accountType: 'EOA',
        bindingId: pending.bindingId,
        bindingVersion: 1,
        blockchain: 'ARC-TESTNET',
        businessId: pending.businessId,
        custodyModel: 'DEVELOPER_CONTROLLED',
        environment: databaseConfig.environment,
        provider: 'CIRCLE',
        status: 'PENDING',
      };
      const activeBinding = activateCircleTreasuryBinding(
        pendingBinding,
        profile.activeBindingId,
        wallet.providerWalletId,
        wallet.address,
      );

      await repository.activateTreasuryBinding({
        activeBinding,
        occurredAt: new Date().toISOString(),
        pendingBindingId: pending.bindingId,
      });

      console.log(
        `business=${pending.businessId} circle_wallet=${wallet.providerWalletId} address=${wallet.address} treasury=ACTIVE`,
      );
    }

    if (pendingBindings.length === 0) {
      console.log('circle_wallet_provisioning=ALREADY_CURRENT');
    }
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Circle wallet provisioning failed.');
  process.exitCode = 1;
});
