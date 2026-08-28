import assert from 'node:assert/strict';
import test from 'node:test';

import {
  deriveActivityOutcome,
  deriveActivityProtocols,
  deriveActivityStatus,
  summarizeEconomicHistory,
  type EconomicActivity,
} from '../src/modules/economic-history/model.ts';

const completedActivity: EconomicActivity = {
  activityId: 'obl_history_1',
  agent: null,
  amountMicroUsdc: '100000',
  asset: 'USDC',
  buyer: {
    businessId: 'biz_buyer',
    displayName: 'Buyer',
    slug: 'buyer',
  },
  economicEffects: [
    {
      amountMicroUsdc: '100000',
      businessId: 'biz_buyer',
      category: 'SERVICE_COST',
      direction: 'OUTFLOW',
    },
    {
      amountMicroUsdc: '100000',
      businessId: 'biz_seller',
      category: 'REVENUE',
      direction: 'INFLOW',
    },
  ],
  environment: 'PRIVATE_ARC_TESTNET',
  occurredAt: new Date('2026-08-28T00:00:00.000Z'),
  offer: {
    capabilityId: 'proof-service',
    description: 'Proof service',
    offerId: 'off_history_1',
    termsVersion: 1,
  },
  outcome: 'SERVICE_DELIVERED',
  proofs: [],
  protocols: ['ARC_USDC'],
  provenance: 'COMMON_CONTROL_TEST',
  seller: {
    businessId: 'biz_seller',
    displayName: 'Seller',
    slug: 'seller',
  },
  settlement: {
    provider: 'CIRCLE_DEVELOPER_WALLETS',
    settlementId: 'set_history_1',
    state: 'COMPLETE',
  },
  status: 'COMPLETE',
  work: null,
};

test('activity status preserves pending, failed, and ambiguous external outcomes', () => {
  assert.equal(
    deriveActivityStatus({
      deliveryState: 'COMPLETE',
      jobOperationStates: [],
      jobStatus: null,
      paymentState: null,
      settlementState: 'COMPLETE',
    }),
    'COMPLETE',
  );
  assert.equal(
    deriveActivityStatus({
      deliveryState: null,
      jobOperationStates: [],
      jobStatus: null,
      paymentState: 'COMPLETE',
      settlementState: 'COMPLETE',
    }),
    'PENDING',
  );
  assert.equal(
    deriveActivityStatus({
      deliveryState: null,
      jobOperationStates: ['OUTCOME_UNKNOWN'],
      jobStatus: 'FUNDED',
      paymentState: null,
      settlementState: 'SUBMITTED',
    }),
    'OUTCOME_UNKNOWN',
  );
  assert.equal(
    deriveActivityStatus({
      deliveryState: null,
      jobOperationStates: ['FAILED'],
      jobStatus: 'OPEN',
      paymentState: null,
      settlementState: 'FAILED',
    }),
    'FAILED',
  );
});

test('refunded rejected work is terminal context without becoming a successful delivery', () => {
  const input = {
    deliveryState: null,
    jobOperationStates: ['COMPLETE'],
    jobStatus: 'REJECTED',
    paymentState: null,
    settlementState: 'REFUNDED',
  } as const;
  assert.equal(deriveActivityStatus(input), 'COMPLETE');
  assert.equal(deriveActivityOutcome(input), 'REJECTED');
});

test('dynamic protocol participation includes only primitives linked to the activity', () => {
  assert.deepEqual(
    deriveActivityProtocols({
      hasArcUsdcSettlement: true,
      hasErc8004Identity: true,
      hasErc8183Job: false,
      hasX402Payment: true,
    }),
    ['ARC_USDC', 'X402', 'ERC_8004'],
  );
  assert.deepEqual(
    deriveActivityProtocols({
      hasArcUsdcSettlement: true,
      hasErc8004Identity: false,
      hasErc8183Job: true,
      hasX402Payment: false,
    }),
    ['ARC_USDC', 'ERC_8183'],
  );
  assert.deepEqual(
    deriveActivityProtocols({
      hasArcUsdcSettlement: false,
      hasErc8004Identity: false,
      hasErc8183Job: false,
      hasX402Payment: false,
    }),
    [],
  );
});

test('economic summary counts one obligation once instead of doubling buyer and seller entries', () => {
  const summary = summarizeEconomicHistory([completedActivity]);
  assert.equal(summary.activityCount, 1);
  assert.equal(summary.completedVolumeMicroUsdc, '100000');
  assert.equal(summary.statusCounts.COMPLETE, 1);
  assert.equal(summary.economicCategoryCounts['REVENUE'], 1);
  assert.equal(summary.economicCategoryCounts['SERVICE_COST'], 1);
  assert.equal(summary.protocolCounts.ARC_USDC, 1);
});
