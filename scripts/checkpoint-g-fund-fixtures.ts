import { setTimeout as delay } from 'node:timers/promises';

import { parseUsdcAmount } from '../src/modules/commerce/money.ts';
import { ArcTestnetRpc } from '../src/platform/arc/rpc.ts';
import { readCircleDeveloperWalletConfig } from '../src/platform/circle/config.ts';
import { CircleDeveloperWalletAdapter } from '../src/platform/circle/developer-wallets.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { applicationSchema, PostgresPersistence } from '../src/platform/persistence/database.ts';

async function main(): Promise<void> {
  const databaseConfig = readDatabaseConnectionConfig('runtime');
  const circleConfig = readCircleDeveloperWalletConfig();
  if (databaseConfig.environment !== 'PRIVATE_ARC_TESTNET' || circleConfig.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Reference fixture funding is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(databaseConfig);
  try {
    const database = persistence.databaseForApplication.withSchema(applicationSchema);
    const source = await database
      .selectFrom('capital_provider_accounts')
      .select(['address', 'provider_wallet_id'])
      .where('provider_account_id', '=', 'cpa_northstar_v1')
      .where('status', '=', 'ACTIVE')
      .executeTakeFirstOrThrow();
    if (source.address === null || source.provider_wallet_id === null) {
      throw new Error('Accepted Northstar setup source account is not active.');
    }
    const bindings = await database
      .selectFrom('treasury_bindings')
      .select(['address', 'business_id'])
      .where('business_id', 'in', ['biz_reference_workbench', 'biz_reference_signal'])
      .where('status', '=', 'ACTIVE')
      .execute();
    const capitalAccount = await database
      .selectFrom('capital_provider_accounts')
      .select(['address'])
      .where('provider_account_id', '=', 'cpa_reference_seed_v1')
      .where('status', '=', 'ACTIVE')
      .executeTakeFirstOrThrow();
    const targets = [
      {
        amount: parseUsdcAmount('0.60'),
        destination: bindings.find(({ business_id }) => business_id === 'biz_reference_workbench')?.address,
        idempotencyKey: '4b24dc6a-c07e-45fd-8d19-31bcdcf59fd9',
        referenceId: 'setup-reference-workbench-v1',
      },
      {
        amount: parseUsdcAmount('0.10'),
        destination: bindings.find(({ business_id }) => business_id === 'biz_reference_signal')?.address,
        idempotencyKey: 'dc5a0d04-b6fb-44f4-94f6-ee1c9a80193c',
        referenceId: 'setup-reference-signal-v1',
      },
      {
        amount: parseUsdcAmount('0.50'),
        destination: capitalAccount.address,
        idempotencyKey: '712780ea-c507-4e37-a7f4-ef52b4ada1b7',
        referenceId: 'setup-reference-capital-provider-v1',
      },
    ] as const;
    const adapter = new CircleDeveloperWalletAdapter(circleConfig);
    const sourceBalance = await adapter.getUsdcBalance(source.provider_wallet_id);
    if (sourceBalance <= targets.reduce((sum, target) => sum + target.amount, 0n)) {
      throw new Error('Northstar setup source lacks the bounded fixture funding amount plus gas headroom.');
    }
    const rpc = new ArcTestnetRpc();
    for (const target of targets) {
      if (target.destination === null || target.destination === undefined || !/^0x[0-9a-fA-F]{40}$/.test(target.destination)) {
        throw new Error(`${target.referenceId} destination account is unavailable.`);
      }
      const destination = target.destination as `0x${string}`;
      const submission = await adapter.submitTransfer({
        amountMicroUsdc: target.amount,
        destinationAddress: destination,
        idempotencyKey: target.idempotencyKey,
        referenceId: target.referenceId,
        sourceAddress: source.address as `0x${string}`,
      });
      let outcome = await adapter.observeTransfer(submission.providerTransactionId);
      for (let attempt = 0; attempt < 90 && outcome.state === 'PENDING'; attempt += 1) {
        await delay(2_000);
        outcome = await adapter.observeTransfer(submission.providerTransactionId);
      }
      if (outcome.state !== 'COMPLETE') {
        throw new Error(`${target.referenceId} fixture funding outcome is ${outcome.state}.`);
      }
      const proof = await rpc.verifyUsdcTransfer({
        amountMicroUsdc: target.amount,
        destinationAddress: destination,
        sourceAddress: source.address as `0x${string}`,
        transactionHash: outcome.transactionHash,
      });
      console.log(
        `fixture_funding=${target.referenceId} amount_micro_usdc=${target.amount} provider_transaction=${submission.providerTransactionId} tx=${outcome.transactionHash} block=${proof.blockNumber} classification=OPERATIONAL_TEST_SETUP`,
      );
    }
    console.log('checkpoint_g_fixture_funding=PASS classification=OPERATIONAL_TEST_SETUP provenance=COMMON_CONTROL_TEST');
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint G fixture funding failed.');
  process.exitCode = 1;
});
