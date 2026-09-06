import assert from 'node:assert/strict';

import { productPaths } from '../src/app/_shell/model.ts';
import { assertBusinessEntryRouteOpen } from '../src/modules/business/model.ts';
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

const kernelBusinessIds = [
  'biz_signal_forge',
  'biz_ops_pilot',
  'biz_checkpoint_b_api_proof_a9f2e7fabf34',
  ...checkpointGBusinesses.map(({ businessId }) => businessId),
] as const;
const kernelAgentIds = [
  'agt_ops_pilot_buyer_v1',
  'agt_ops_pilot_observer_v1',
  'agt_reference_workbench_buyer_v1',
  'agt_reference_signal_service_v1',
  'agt_reference_agent_labs_operator_v1',
  'agt_reference_chain_studio_observer_v1',
] as const;
const kernelIdentityIds = [
  'aid_ops_pilot_buyer_arc_8004_v1',
  'aid_reference_workbench_buyer_arc_8004_v1',
] as const;
const kernelPaymentIds = [
  'pay_arc_snapshot_x402_8004_v1',
  'pay_arc_snapshot_x402_v1',
  'pay_reference_arc_snapshot_x402_v1',
] as const;
const kernelJobIds = [
  'job_commerce_readiness_8183_v1',
  'job_reference_economy_8183_v1',
] as const;
const kernelObligationIds = [
  'obl_arc_snapshot_agent_v1',
  'obl_arc_snapshot_v1',
  'obl_arc_snapshot_x402_8004_v1',
  'obl_arc_snapshot_x402_v1',
  'obl_capital_funded_snapshot_v1',
  'obl_commerce_readiness_8183_v1',
  'obl_reference_arc_snapshot_x402_v1',
  'obl_reference_capital_use_v1',
  'obl_reference_economy_8183_v1',
] as const;
const kernelProviderIds = [
  'cap_independent_only_v1',
  'cap_northstar_v1',
  'cap_reference_independent_v1',
  'cap_reference_seed_v1',
] as const;
const kernelAllocationIds = [
  'cal_ops_pilot_northstar_v1',
  'cal_reference_workbench_seed_v1',
] as const;
const kernelActivityIds = new Set<string>([
  ...kernelObligationIds,
  ...kernelAllocationIds,
]);
const kernelEvidenceIds = [
  'evi_cal_ops_pilot_northstar_v1_arc',
  'evi_cal_reference_workbench_seed_v1_arc',
  'evi_job_commerce_readiness_8183_v1_complete',
  'evi_job_reference_economy_8183_v1_complete',
  'evi_ops_pilot_buyer_arc_8004_v1',
  'evi_reference_workbench_buyer_arc_8004_v1',
  'evi_set_arc_snapshot_agent_v1_arc',
  'evi_set_arc_snapshot_v1_arc',
  'evi_set_arc_snapshot_x402_8004_v1_x402',
  'evi_set_arc_snapshot_x402_v1_x402',
  'evi_set_capital_funded_snapshot_v1_arc',
  'evi_set_commerce_readiness_8183_v1_erc8183',
  'evi_set_reference_arc_snapshot_x402_v1_x402',
  'evi_set_reference_capital_use_v1_arc',
  'evi_set_reference_economy_8183_v1_erc8183',
  'evi_svc_arc_snapshot_agent_v1_delivery',
  'evi_svc_arc_snapshot_v1_delivery',
  'evi_svc_arc_snapshot_x402_8004_v1_delivery',
  'evi_svc_arc_snapshot_x402_v1_delivery',
  'evi_svc_capital_funded_snapshot_v1_delivery',
  'evi_svc_reference_arc_snapshot_x402_v1_delivery',
  'evi_svc_reference_capital_use_v1_delivery',
] as const;

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
      database.selectFrom('businesses').selectAll().where('business_id', 'in', kernelBusinessIds).execute(),
      database.selectFrom('business_controls').selectAll().where('business_id', 'in', kernelBusinessIds).where('status', '=', 'ACTIVE').execute(),
      database.selectFrom('business_sites').selectAll().where('business_id', 'in', kernelBusinessIds).execute(),
      database.selectFrom('agent_registrations').selectAll().where('agent_principal_id', 'in', kernelAgentIds).execute(),
      database.selectFrom('erc8004_identity_operations').selectAll().where('identity_id', 'in', kernelIdentityIds).execute(),
      database.selectFrom('action_intents').selectAll().execute(),
      database.selectFrom('obligations').selectAll().where('obligation_id', 'in', kernelObligationIds).execute(),
      database.selectFrom('settlement_operations').selectAll().where('obligation_id', 'in', kernelObligationIds).execute(),
      database.selectFrom('x402_payment_operations').selectAll().where('payment_id', 'in', kernelPaymentIds).execute(),
      database.selectFrom('erc8183_jobs').selectAll().where('job_id', 'in', kernelJobIds).execute(),
      database.selectFrom('erc8183_job_operations').selectAll().where('job_id', 'in', kernelJobIds).execute(),
      database.selectFrom('economic_entries').selectAll().where((expression) => expression.or([
        expression('obligation_id', 'in', kernelObligationIds),
        expression('capital_allocation_id', 'in', kernelAllocationIds),
      ])).execute(),
      database.selectFrom('capital_providers').selectAll().where('provider_id', 'in', kernelProviderIds).execute(),
      database.selectFrom('capital_allocations').selectAll().where('allocation_id', 'in', kernelAllocationIds).execute(),
      database.selectFrom('capital_use_links').selectAll().where('allocation_id', 'in', kernelAllocationIds).execute(),
      database.selectFrom('evidence_facts').selectAll().where('evidence_id', 'in', kernelEvidenceIds).execute(),
      database.selectFrom('service_executions').selectAll().where('obligation_id', 'in', kernelObligationIds).execute(),
      history.listEconomicActivities().then((rows) =>
        rows.filter(({ activityId }) => kernelActivityIds.has(activityId)),
      ),
    ]);

    const [allBusinesses, allControls, allSites, allAgents] = await Promise.all([
      database.selectFrom('businesses').selectAll().execute(),
      database.selectFrom('business_controls').selectAll().where('status', '=', 'ACTIVE').execute(),
      database.selectFrom('business_sites').selectAll().execute(),
      database.selectFrom('agent_registrations').selectAll().execute(),
    ]);

    // System: generic population, generated sites, reusable capability, and locked MIGRATE boundary.
    assert.equal(businesses.length, 7);
    assert.equal(controls.length, businesses.length);
    assert.equal(sites.length, businesses.length);
    assert.ok(allBusinesses.length >= businesses.length);
    assert.equal(allControls.length, allBusinesses.length);
    assert.equal(allSites.length, allBusinesses.length);
    assert.ok(
      allSites.every(
        ({ status, visibility }) => status === 'PUBLISHED' && visibility === 'PROTECTED_ALPHA',
      ),
    );
    assert.ok(allBusinesses.every(({ entry_route, status }) =>
      entry_route === 'BUILD' && status === 'ACTIVE',
    ));
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
    assert.ok(allAgents.every(({ business_id, provider_of_record_principal_id }) =>
      business_id === provider_of_record_principal_id,
    ));
    const migratePath = productPaths.find(({ id }) => id === 'migrate');
    assert.equal(migratePath?.href, '#migrate');
    // The owner opened only configured CONNECT sources after H. Generic entry
    // without external provenance remains fail-closed; historical H evidence is unchanged.
    assert.equal(migratePath?.route, '/connect');
    assert.throws(() => assertBusinessEntryRouteOpen('MIGRATE'), /LOCKED/);

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
        `kernel_businesses=${businesses.length}`,
        `product_businesses=${allBusinesses.length}`,
        `kernel_agents=${agents.length}`,
        `product_agents=${allAgents.length}`,
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
