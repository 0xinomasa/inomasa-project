import assert from 'node:assert/strict';
import test from 'node:test';

import { createBusinessGenesis } from '../src/modules/business/model.ts';
import {
  acceptServiceOffer,
  authorizeSettlement,
  reconcileSettlement,
  recordSettlementSubmission,
  type ServiceOffer,
} from '../src/modules/commerce/model.ts';
import { formatUsdcAmount, parseUsdcAmount } from '../src/modules/commerce/money.ts';

const operator = {
  actorClassification: 'COMMON_CONTROL_TEST',
  displayName: 'Alpha Operator',
  environment: 'PRIVATE_ARC_TESTNET',
  principalId: 'usr_alpha_operator',
} as const;

function business(
  templateId: 'ops-pilot' | 'signal-forge',
  businessId: `biz_${string}`,
) {
  return createBusinessGenesis(
    {
      commonControlGroupId: 'ccg_alpha_operator',
      controller: operator,
      genesisRequestId: `genesis-${businessId}`,
      templateId,
    },
    {
      businessId,
      controlId: `ctl_${businessId}`,
      eventId: `evt_${businessId}`,
    },
    '2026-08-25T08:00:00.000Z',
  ).business;
}

test('USDC amounts preserve exact six-decimal economic quantities', () => {
  assert.equal(parseUsdcAmount('1.000001'), 1_000_001n);
  assert.equal(formatUsdcAmount(parseUsdcAmount('0.25')), '0.250000');
  assert.throws(() => parseUsdcAmount('0.0000001'), /at most 6/);
  assert.throws(() => parseUsdcAmount('-1'), /non-negative/);
});

test('common-control service purchase stays explicitly classified through settlement', () => {
  const provider = business('signal-forge', 'biz_signal_forge');
  const buyer = business('ops-pilot', 'biz_ops_pilot');
  const offer: ServiceOffer = {
    capabilityId: 'arc-market-snapshot',
    description: 'Deterministic Arc signal snapshot',
    offerId: 'off_arc_snapshot_v1',
    priceMicroUsdc: parseUsdcAmount('0.25'),
    providerBusinessId: provider.businessId,
    status: 'ACTIVE',
    termsVersion: 1,
  };
  const obligation = acceptServiceOffer({
    buyer,
    offer,
    obligationId: 'obl_snapshot_1',
    provider,
  });
  const authorized = authorizeSettlement({
    idempotencyKey: '8b132bd1-cf48-48d5-ae1b-f0c453f8bb0a',
    obligation,
    settlementId: 'set_snapshot_1',
  });
  const submitted = recordSettlementSubmission(authorized, 'circle-transaction-id');
  const completed = reconcileSettlement(submitted, {
    state: 'COMPLETE',
    transactionHash: `0x${'1'.repeat(64)}`,
  });

  assert.equal(obligation.provenance, 'COMMON_CONTROL_TEST');
  assert.equal(obligation.buyerBusinessId, buyer.businessId);
  assert.equal(obligation.sellerBusinessId, provider.businessId);
  assert.equal(completed.state, 'COMPLETE');
  assert.throws(
    () => recordSettlementSubmission(submitted, 'duplicate-provider-transaction'),
    /Only an authorized settlement/,
  );
});

test('an outcome-unknown settlement can later reconcile to the observed Arc fact', () => {
  const provider = business('signal-forge', 'biz_signal_forge');
  const buyer = business('ops-pilot', 'biz_ops_pilot');
  const offer: ServiceOffer = {
    capabilityId: 'arc-market-snapshot',
    description: 'Deterministic Arc signal snapshot',
    offerId: 'off_arc_snapshot_v1',
    priceMicroUsdc: parseUsdcAmount('0.25'),
    providerBusinessId: provider.businessId,
    status: 'ACTIVE',
    termsVersion: 1,
  };
  const obligation = acceptServiceOffer({
    buyer,
    offer,
    obligationId: 'obl_snapshot_unknown',
    provider,
  });
  const submitted = recordSettlementSubmission(
    authorizeSettlement({
      idempotencyKey: '22ff2567-b678-4552-968e-2c3d3fdb82bf',
      obligation,
      settlementId: 'set_snapshot_unknown',
    }),
    'circle-unknown-transaction',
  );
  const unknown = reconcileSettlement(submitted, { state: 'OUTCOME_UNKNOWN' });
  const recovered = reconcileSettlement(unknown, {
    state: 'COMPLETE',
    transactionHash: `0x${'2'.repeat(64)}`,
  });

  assert.equal(unknown.state, 'OUTCOME_UNKNOWN');
  assert.equal(recovered.state, 'COMPLETE');
});

test('self-dealing cannot be hidden as an ordinary Alpha service obligation', () => {
  const provider = business('signal-forge', 'biz_signal_forge');
  const offer: ServiceOffer = {
    capabilityId: 'arc-market-snapshot',
    description: 'Deterministic Arc signal snapshot',
    offerId: 'off_arc_snapshot_v1',
    priceMicroUsdc: parseUsdcAmount('0.25'),
    providerBusinessId: provider.businessId,
    status: 'ACTIVE',
    termsVersion: 1,
  };

  assert.throws(
    () =>
      acceptServiceOffer({
        buyer: provider,
        offer,
        obligationId: 'obl_self_deal',
        provider,
      }),
    /cannot create.*itself/,
  );
});
