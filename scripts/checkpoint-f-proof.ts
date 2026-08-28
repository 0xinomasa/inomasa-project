import assert from 'node:assert/strict';

import { summarizeEconomicHistory } from '../src/modules/economic-history/model.ts';
import { ArcTestnetRpc } from '../src/platform/arc/rpc.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import { PostgresCapitalRepository } from '../src/platform/persistence/capital-repository.ts';
import { applicationSchema, PostgresPersistence } from '../src/platform/persistence/database.ts';
import { PostgresEconomicHistoryRepository } from '../src/platform/persistence/economic-history-repository.ts';

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Checkpoint F proof is restricted to PRIVATE_ARC_TESTNET.');
  }
  const persistence = new PostgresPersistence(config);
  try {
    const capital = new PostgresCapitalRepository(persistence);
    const history = new PostgresEconomicHistoryRepository(persistence);
    const paths = await capital.listCapitalPaths();
    assert.equal(paths.length, 2);
    assert.equal(new Set(paths.map(({ materialSha256 }) => materialSha256)).size, 1);
    const approved = paths.find(({ outcome }) => outcome === 'APPROVED');
    const declined = paths.find(({ outcome }) => outcome === 'DECLINED');
    assert.ok(approved !== undefined);
    assert.ok(declined !== undefined);
    assert.equal(approved.providerId, 'cap_northstar_v1');
    assert.equal(declined.providerId, 'cap_independent_only_v1');
    assert.equal(approved.approvedMicroUsdc, '200000');
    assert.equal(approved.instrument, 'CONTROLLED_TEST_ALLOCATION');
    assert.equal(approved.returnProfile, 'NONE');
    assert.equal(approved.allocationState, 'COMPLETE');
    assert.match(approved.allocationTransactionHash ?? '', /^0x[0-9a-f]{64}$/);
    assert.equal(declined.approvedMicroUsdc, null);
    assert.equal(declined.allocationId, null);
    assert.equal(approved.uses.length, 1);
    assert.equal(approved.uses[0]?.amountMicroUsdc, '100000');
    assert.equal(approved.uses[0]?.obligationId, 'obl_capital_funded_snapshot_v1');
    assert.equal(approved.uses[0]?.settlementState, 'COMPLETE');

    const execution = await capital.getAllocationExecutionContext('cal_ops_pilot_northstar_v1');
    const chainProof = await new ArcTestnetRpc().verifyUsdcTransfer({
      amountMicroUsdc: execution.amountMicroUsdc,
      destinationAddress: execution.destinationAddress,
      sourceAddress: execution.sourceAddress,
      transactionHash: approved.allocationTransactionHash as `0x${string}`,
    });
    const database = persistence.databaseForApplication.withSchema(applicationSchema);
    const [allocationEntries, allocationEvidence, useObligation, useDelivery, allEntries] =
      await Promise.all([
        database
          .selectFrom('economic_entries')
          .select(['amount_micro_usdc', 'category', 'direction', 'settlement_id'])
          .where('capital_allocation_id', '=', 'cal_ops_pilot_northstar_v1')
          .execute(),
        database
          .selectFrom('evidence_facts')
          .select(['fact_type', 'source_reference', 'verification'])
          .where('subject_id', '=', 'cal_ops_pilot_northstar_v1')
          .execute(),
        database
          .selectFrom('obligations')
          .select(['amount_micro_usdc', 'state'])
          .where('obligation_id', '=', 'obl_capital_funded_snapshot_v1')
          .executeTakeFirstOrThrow(),
        database
          .selectFrom('service_executions')
          .select('state')
          .where('obligation_id', '=', 'obl_capital_funded_snapshot_v1')
          .executeTakeFirstOrThrow(),
        database.selectFrom('economic_entries').select('entry_id').execute(),
      ]);
    assert.deepEqual(allocationEntries, [
      { amount_micro_usdc: '200000', category: 'CAPITAL', direction: 'INFLOW', settlement_id: null },
    ]);
    assert.deepEqual(allocationEvidence, [
      {
        fact_type: 'CAPITAL_ALLOCATION_FINALIZED',
        source_reference: approved.allocationTransactionHash,
        verification: 'CHAIN_VERIFIED',
      },
    ]);
    assert.deepEqual(useObligation, { amount_micro_usdc: '100000', state: 'SETTLED' });
    assert.equal(useDelivery.state, 'COMPLETE');
    assert.equal(allEntries.length, 13);

    const [activities, inventory] = await Promise.all([
      history.listEconomicActivities(),
      history.loadInventory(),
    ]);
    const summary = summarizeEconomicHistory(activities);
    assert.equal(summary.activityCount, 7);
    assert.equal(summary.commerceActivityCount, 6);
    assert.equal(summary.capitalActivityCount, 1);
    assert.equal(summary.completedVolumeMicroUsdc, '520000');
    assert.equal(summary.completedCapitalVolumeMicroUsdc, '200000');
    assert.equal(summary.statusCounts.COMPLETE, 7);
    assert.deepEqual(inventory, {
      agentCount: 2,
      businessCount: 3,
      capitalProviderCount: 2,
      evidenceCount: 14,
      serviceDeliveryCount: 6,
    });
    console.log(
      `checkpoint_f=PASS providers=2 approved=1 declined=1 allocation_micro_usdc=200000 allocation_tx=${chainProof.transactionHash} capital_entries=1 later_use_micro_usdc=100000 commerce_volume_micro_usdc=${summary.completedVolumeMicroUsdc} capital_volume_micro_usdc=${summary.completedCapitalVolumeMicroUsdc}`,
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint F proof failed.');
  process.exitCode = 1;
});
