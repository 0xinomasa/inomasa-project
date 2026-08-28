import assert from 'node:assert/strict';

import {
  summarizeEconomicHistory,
  type CommerceEconomicActivity,
} from '../src/modules/economic-history/model.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import {
  applicationSchema,
  PostgresPersistence,
} from '../src/platform/persistence/database.ts';
import { PostgresEconomicHistoryRepository } from '../src/platform/persistence/economic-history-repository.ts';

const expectedAmounts = ['10000', '10000', '50000', '100000', '250000'];
const expectedProtocolCounts = {
  ARC_USDC: 5,
  ERC_8004: 1,
  ERC_8183: 1,
  X402: 2,
} as const;
const acceptedBaselineObligationIds = new Set([
  'obl_arc_snapshot_agent_v1',
  'obl_arc_snapshot_v1',
  'obl_arc_snapshot_x402_8004_v1',
  'obl_arc_snapshot_x402_v1',
  'obl_commerce_readiness_8183_v1',
]);

function assertExactEconomicEffects(activity: CommerceEconomicActivity): void {
  assert.equal(activity.economicEffects.length, 2);
  assert.deepEqual(
    activity.economicEffects
      .map(({ amountMicroUsdc, category, direction }) => ({
        amountMicroUsdc,
        category,
        direction,
      }))
      .sort((left, right) => left.category.localeCompare(right.category)),
    [
      {
        amountMicroUsdc: activity.amountMicroUsdc,
        category: 'REVENUE',
        direction: 'INFLOW',
      },
      {
        amountMicroUsdc: activity.amountMicroUsdc,
        category: 'SERVICE_COST',
        direction: 'OUTFLOW',
      },
    ],
  );
}

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Checkpoint E proof is restricted to PRIVATE_ARC_TESTNET.');
  }

  const persistence = new PostgresPersistence(config);
  try {
    const repository = new PostgresEconomicHistoryRepository(persistence);
    const [allActivities, inventory] = await Promise.all([
      repository.listActivities(),
      repository.loadInventory(),
    ]);
    const activities = allActivities.filter(({ activityId }) =>
      acceptedBaselineObligationIds.has(activityId),
    );
    const summary = summarizeEconomicHistory(activities);

    assert.equal(activities.length, 5);
    assert.equal(new Set(activities.map(({ activityId }) => activityId)).size, activities.length);
    assert.deepEqual(
      activities.map(({ amountMicroUsdc }) => amountMicroUsdc).sort((left, right) =>
        Number(left) - Number(right)),
      expectedAmounts,
    );
    assert.ok(activities.every(({ provenance }) => provenance === 'COMMON_CONTROL_TEST'));
    assert.ok(activities.every(({ status }) => status === 'COMPLETE'));
    activities.forEach(assertExactEconomicEffects);

    assert.equal(summary.activityCount, 5);
    assert.equal(summary.completedVolumeMicroUsdc, '420000');
    assert.deepEqual(summary.statusCounts, {
      COMPLETE: 5,
      FAILED: 0,
      OUTCOME_UNKNOWN: 0,
      PENDING: 0,
    });
    assert.deepEqual(summary.protocolCounts, expectedProtocolCounts);
    assert.deepEqual(summary.economicCategoryCounts, {
      REVENUE: 5,
      SERVICE_COST: 5,
    });
    assert.ok(inventory.agentCount >= 2);
    assert.ok(inventory.businessCount >= 3);
    assert.ok(inventory.evidenceCount >= 11);
    assert.ok(inventory.serviceDeliveryCount >= 5);

    const x402Activities = activities.filter(({ protocols }) => protocols.includes('X402'));
    assert.equal(x402Activities.length, 2);
    assert.ok(
      x402Activities.every(
        ({ proofs, settlement }) =>
          settlement.provider === 'CIRCLE_GATEWAY_X402' &&
          proofs.some(
            ({ kind, scope, verification }) =>
              kind === 'PROVIDER_RECEIPT' &&
              scope === 'SETTLEMENT_ONLY' &&
              verification === 'PROVIDER_REPORTED',
          ) &&
          !proofs.some(
            ({ kind, scope }) => kind === 'ARC_TRANSACTION' && scope === 'SETTLEMENT_ONLY',
          ),
      ),
    );

    const erc8183Activity = activities.find(({ protocols }) => protocols.includes('ERC_8183'));
    assert.ok(erc8183Activity !== undefined);
    assert.equal(erc8183Activity.work?.protocolJobId, '182088');
    assert.equal(
      new Set(
        erc8183Activity.proofs
          .filter(({ kind }) => kind === 'ARC_TRANSACTION')
          .map(({ reference }) => reference),
      ).size,
      6,
    );

    const database = persistence.databaseForApplication.withSchema(applicationSchema);
    const businesses = await database
      .selectFrom('businesses')
      .select(['business_id', 'slug'])
      .execute();
    const activityCountsByBusiness = Object.fromEntries(
      await Promise.all(
        businesses.map(async ({ business_id: businessId, slug }) => [
          slug,
          (
            await repository.listActivities({ businessId: businessId as `biz_${string}` })
          ).filter(({ activityId }) => acceptedBaselineObligationIds.has(activityId)).length,
        ]),
      ),
    );
    assert.deepEqual(activityCountsByBusiness, {
      'checkpoint-b-api-proof': 0,
      'ops-pilot': 5,
      'signal-forge': 5,
    });

    console.log(
      [
        'checkpoint_e=PASS',
        `activities=${summary.activityCount}`,
        `completed_volume_micro_usdc=${summary.completedVolumeMicroUsdc}`,
        `status_complete=${summary.statusCounts.COMPLETE}`,
        `protocol_arc_usdc=${summary.protocolCounts.ARC_USDC}`,
        `protocol_x402=${summary.protocolCounts.X402}`,
        `protocol_erc8004=${summary.protocolCounts.ERC_8004}`,
        `protocol_erc8183=${summary.protocolCounts.ERC_8183}`,
        `businesses=${inventory.businessCount}`,
        `agents=${inventory.agentCount}`,
        `evidence=${inventory.evidenceCount}`,
        `deliveries=${inventory.serviceDeliveryCount}`,
        'provenance=COMMON_CONTROL_TEST',
      ].join(' '),
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint E proof failed.');
  process.exitCode = 1;
});
