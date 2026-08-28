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
  biz_reference_signal: {
    activeBindingId: 'tbn_reference_signal_active_v1',
    idempotencyKey: '79a5b3a7-4678-45fe-8d96-d59d9056319d',
  },
  biz_reference_workbench: {
    activeBindingId: 'tbn_reference_workbench_active_v1',
    idempotencyKey: '04c5b766-d93c-4dc1-8c4f-72e2d8bf8948',
  },
  biz_reference_agent_labs: {
    activeBindingId: 'tbn_reference_agent_labs_active_v1',
    idempotencyKey: '09a02ea8-e073-4798-bb8d-a07369e930db',
  },
  biz_reference_chain_studio: {
    activeBindingId: 'tbn_reference_chain_studio_active_v1',
    idempotencyKey: 'dd2af60b-2b4a-49b8-b7eb-5946cb4dfc35',
  },
} as const;

async function main(): Promise<void> {
  const referenceEconomy = process.argv.includes('--reference-economy');
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
    const allPendingBindings = await repository.listPendingTreasuryBindings();
    const pendingBindings = referenceEconomy
      ? allPendingBindings.filter(({ businessId }) => businessId.startsWith('biz_reference_'))
      : allPendingBindings;
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
