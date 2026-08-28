import assert from 'node:assert/strict';

import { productPaths } from '../src/app/_shell/model.ts';
import { businessTemplates } from '../src/modules/business/templates.ts';
import {
  activityStatuses,
  summarizeEconomicHistory,
} from '../src/modules/economic-history/model.ts';
import { checkpointGBusinesses } from '../src/modules/reference-economy/fixtures.ts';
import { arcTestnet } from '../src/platform/arc/config.ts';
import { readDatabaseConnectionConfig } from '../src/platform/persistence/config.ts';
import {
  applicationSchema,
  PostgresPersistence,
} from '../src/platform/persistence/database.ts';
import { PostgresEconomicHistoryRepository } from '../src/platform/persistence/economic-history-repository.ts';

function sum(values: readonly string[]): bigint {
  return values.reduce((total, value) => total + BigInt(value), 0n);
}

async function main(): Promise<void> {
  const config = readDatabaseConnectionConfig('runtime');
  if (config.environment !== 'PRIVATE_ARC_TESTNET') {
    throw new Error('Checkpoint H proof is restricted to PRIVATE_ARC_TESTNET.');
  }

  const persistence = new PostgresPersistence(config);
  try {
    const database = persistence.databaseForApplication.withSchema(applicationSchema);
    const history = new PostgresEconomicHistoryRepository(persistence);
    const [
      businesses,
      controls,
      sites,
      agents,
      identities,
      intents,
      obligations,
      settlements,
      x402Payments,
      jobs,
      jobOperations,
      economicEntries,
      providers,
      allocations,
      capitalUses,
      evidence,
      deliveries,
      activities,
    ] = await Promise.all([
      database.selectFrom('businesses').selectAll().execute(),
      database.selectFrom('business_controls').selectAll().where('status', '=', 'ACTIVE').execute(),
      database.selectFrom('business_sites').selectAll().execute(),
      database.selectFrom('agent_registrations').selectAll().execute(),
      database.selectFrom('erc8004_identity_operations').selectAll().execute(),
      database.selectFrom('action_intents').selectAll().execute(),
      database.selectFrom('obligations').selectAll().execute(),
      database.selectFrom('settlement_operations').selectAll().execute(),
      database.selectFrom('x402_payment_operations').selectAll().execute(),
      database.selectFrom('erc8183_jobs').selectAll().execute(),
      database.selectFrom('erc8183_job_operations').selectAll().execute(),
      database.selectFrom('economic_entries').selectAll().execute(),
      database.selectFrom('capital_providers').selectAll().execute(),
      database.selectFrom('capital_allocations').selectAll().execute(),
      database.selectFrom('capital_use_links').selectAll().execute(),
      database.selectFrom('evidence_facts').selectAll().execute(),
      database.selectFrom('service_executions').selectAll().execute(),
      history.listEconomicActivities(),
    ]);

    // System: generic population, generated sites, reusable capability, and locked MIGRATE boundary.
    assert.equal(businesses.length, 7);
    assert.equal(controls.length, businesses.length);
    assert.equal(sites.length, businesses.length);
    assert.ok(
      sites.every(
        ({ status, visibility }) => status === 'PUBLISHED' && visibility === 'PROTECTED_ALPHA',
      ),
    );
    assert.ok(businesses.every(({ entry_route }) => entry_route === 'BUILD'));
    assert.deepEqual(
      businessTemplates.map(({ templateId }) => templateId),
      ['api-data-compute', 'saas-micro-saas', 'agent-as-a-service', 'web3-native-digital'],
    );
    const referenceBusinesses = businesses.filter(({ business_id }) =>
      checkpointGBusinesses.some(({ businessId }) => businessId === business_id),
    );
    assert.equal(referenceBusinesses.length, 4);
    assert.equal(new Set(referenceBusinesses.map(({ template_id }) => template_id)).size, 4);
    assert.equal(
      new Set(
        controls
          .filter(({ business_id }) =>
            checkpointGBusinesses.some(({ businessId }) => businessId === business_id),
          )
          .map(({ controller_principal_id }) => controller_principal_id),
      ).size,
      4,
    );
    assert.equal(agents.length, 6);
    assert.ok(agents.every(({ business_id, provider_of_record_principal_id }) =>
      business_id === provider_of_record_principal_id,
    ));
    const migratePath = productPaths.find(({ label }) => label === 'MIGRATE');
    assert.equal(migratePath?.href, '#migrate');
    assert.equal(migratePath?.status, 'LOCKED');
    assert.match(migratePath?.summary ?? '', /every current creation request is rejected/);

    // Agentic Economy: each external primitive is complete and bound back to Business activity.
    assert.equal(identities.length, 2);
    assert.ok(identities.every(({ state }) => state === 'VERIFIED'));
    assert.ok(
      identities.every(({ identity_id }) =>
        intents.some(({ erc8004_identity_id }) => erc8004_identity_id === identity_id),
      ),
    );
    assert.equal(x402Payments.length, 3);
    assert.ok(x402Payments.every(({ amount_micro_usdc, protocol_version, scheme, state }) =>
      amount_micro_usdc === '10000' && protocol_version === 2 && scheme === 'exact' && state === 'COMPLETE',
    ));
    assert.equal(jobs.length, 2);
    assert.ok(jobs.every(({ budget_micro_usdc, protocol_status }) =>
      budget_micro_usdc === '50000' && protocol_status === 'COMPLETED',
    ));
    assert.equal(jobOperations.length, 12);
    assert.ok(jobOperations.every(({ state, transaction_hash }) =>
      state === 'COMPLETE' && /^0x[0-9a-f]{64}$/.test(transaction_hash ?? ''),
    ));
    assert.equal(new Set(jobOperations.map(({ transaction_hash }) => transaction_hash)).size, 12);

    // Product and observability: one reconstructable activity per economic source and all statuses remain modeled.
    assert.deepEqual(activityStatuses, ['COMPLETE', 'FAILED', 'PENDING', 'OUTCOME_UNKNOWN']);
    const summary = summarizeEconomicHistory(activities);
    assert.equal(summary.activityCount, 11);
    assert.equal(summary.commerceActivityCount, 9);
    assert.equal(summary.capitalActivityCount, 2);
    assert.equal(summary.statusCounts.COMPLETE, 11);
    assert.equal(summary.completedVolumeMicroUsdc, '680000');
    assert.equal(summary.completedCapitalVolumeMicroUsdc, '400000');
    assert.equal(summary.protocolCounts.X402, 3);
    assert.equal(summary.protocolCounts.ERC_8004, 2);
    assert.equal(summary.protocolCounts.ERC_8183, 2);
    assert.ok(activities.every(({ provenance }) => provenance === 'COMMON_CONTROL_TEST'));
    for (const activity of activities) {
      assert.ok(activity.proofs.length > 0);
      if (activity.activityKind === 'COMMERCE' && activity.protocols.includes('X402')) {
        assert.ok(activity.proofs.some(({ kind }) => kind === 'PROVIDER_RECEIPT'));
        assert.ok(
          !activity.proofs.some(
            ({ kind, scope }) => kind === 'ARC_TRANSACTION' && scope === 'SETTLEMENT_ONLY',
          ),
        );
      }
    }

    // Economics: exact effects, no duplicate posting, and Capital remains separate from Revenue.
    assert.equal(obligations.length, 9);
    assert.ok(obligations.every(({ state }) => state === 'SETTLED'));
    assert.equal(sum(obligations.map(({ amount_micro_usdc }) => amount_micro_usdc)), 680000n);
    assert.equal(settlements.length, obligations.length);
    assert.ok(settlements.every(({ state }) => state === 'COMPLETE'));
    assert.equal(economicEntries.length, 20);
    assert.equal(economicEntries.filter(({ category }) => category === 'REVENUE').length, 9);
    assert.equal(economicEntries.filter(({ category }) => category === 'SERVICE_COST').length, 9);
    assert.equal(economicEntries.filter(({ category }) => category === 'CAPITAL').length, 2);
    assert.equal(new Set(economicEntries.map(({ entry_id }) => entry_id)).size, economicEntries.length);
    for (const obligation of obligations) {
      const effects = economicEntries.filter(
        ({ obligation_id }) => obligation_id === obligation.obligation_id,
      );
      assert.deepEqual(
        effects
          .map(({ amount_micro_usdc, business_id, category, direction }) => ({
            amount_micro_usdc,
            business_id,
            category,
            direction,
          }))
          .sort((left, right) => left.category.localeCompare(right.category)),
        [
          {
            amount_micro_usdc: obligation.amount_micro_usdc,
            business_id: obligation.seller_business_id,
            category: 'REVENUE',
            direction: 'INFLOW',
          },
          {
            amount_micro_usdc: obligation.amount_micro_usdc,
            business_id: obligation.buyer_business_id,
            category: 'SERVICE_COST',
            direction: 'OUTFLOW',
          },
        ],
      );
    }
    assert.equal(providers.length, 4);
    assert.ok(providers.every(({ risk_bearer_classification }) =>
      risk_bearer_classification === 'PROVIDER_RISK_BEARER',
    ));
    assert.equal(allocations.length, 2);
    assert.ok(allocations.every(({ amount_micro_usdc, state }) =>
      amount_micro_usdc === '200000' && state === 'COMPLETE',
    ));
    assert.equal(capitalUses.length, 2);
    assert.ok(capitalUses.every(({ amount_micro_usdc }) => amount_micro_usdc === '100000'));
    for (const allocation of allocations) {
      assert.deepEqual(
        economicEntries
          .filter(({ capital_allocation_id }) => capital_allocation_id === allocation.allocation_id)
          .map(({ amount_micro_usdc, business_id, category, direction, obligation_id }) => ({
            amount_micro_usdc,
            business_id,
            category,
            direction,
            obligation_id,
          })),
        [
          {
            amount_micro_usdc: allocation.amount_micro_usdc,
            business_id: allocation.recipient_business_id,
            category: 'CAPITAL',
            direction: 'INFLOW',
            obligation_id: null,
          },
        ],
      );
    }

    // Safety evidence is completed by the adversarial suite and client-artifact proof.
    assert.ok(economicEntries.every(({ provenance }) => provenance === 'COMMON_CONTROL_TEST'));
    assert.ok(evidence.every(({ provenance }) => provenance === 'COMMON_CONTROL_TEST'));
    assert.ok(deliveries.every(({ provenance, state }) =>
      provenance === 'COMMON_CONTROL_TEST' && state === 'COMPLETE',
    ));
    assert.equal(evidence.length, 22);
    assert.equal(deliveries.length, 9);
    assert.equal(arcTestnet.chainId, 5_042_002);
    assert.equal(arcTestnet.usdc.address, '0x3600000000000000000000000000000000000000');
    assert.equal(arcTestnet.usdc.decimals, 6);

    console.log(
      [
        'checkpoint_h_matrix=PASS',
        'system=PASS',
        'agentic_economy=PASS',
        'product_data=PASS',
        'economics=PASS',
        'safety_data=PASS',
        'businesses=7',
        'agents=6',
        'providers=4',
        'activities=11',
        'commerce_volume_micro_usdc=680000',
        'capital_volume_micro_usdc=400000',
        'economic_entries=20',
        'evidence=22',
        'deliveries=9',
        'provenance=COMMON_CONTROL_TEST',
      ].join(' '),
    );
  } finally {
    await persistence.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Checkpoint H proof failed.');
  process.exitCode = 1;
});
