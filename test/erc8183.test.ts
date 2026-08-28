import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertErc8183Transition,
  erc8183StatusFromChain,
  erc8183TerminalEconomicEffect,
  isErc8183Terminal,
} from '../src/modules/commerce/erc8183.ts';
import {
  alphaServiceCatalog,
  selectCommerceProtocol,
  serviceCapabilityForOffer,
} from '../src/modules/commerce/service-catalog.ts';
import { canonicalJson } from '../src/shared/canonical-json.ts';

test('transaction shape selects x402 for instant resources and ERC-8183 for evaluated work', () => {
  assert.equal(selectCommerceProtocol({ requiresDeliverableEvaluation: false }), 'X402');
  assert.equal(selectCommerceProtocol({ requiresDeliverableEvaluation: true }), 'ERC8183');
  assert.equal(alphaServiceCatalog.capitalFundedArcSnapshot.protocol, 'ARC_USDC');
  assert.equal(alphaServiceCatalog.arcMarketSnapshotX402.protocol, 'X402');
  assert.equal(alphaServiceCatalog.commerceReadinessJob.protocol, 'ERC8183');
  assert.equal(
    serviceCapabilityForOffer('off_arc_snapshot_x402_v1')?.resourcePath,
    '/api/alpha/services/off_arc_snapshot_x402_v1',
  );
  assert.equal(
    serviceCapabilityForOffer('off_capital_funded_snapshot_v1')?.deliveryKind,
    'ARC_NETWORK_SNAPSHOT',
  );
  assert.equal(serviceCapabilityForOffer('off_unknown'), null);
});

test('ERC-8183 status mapping and transition rules reject replay after terminal state', () => {
  assert.equal(erc8183StatusFromChain(0), 'OPEN');
  assert.equal(erc8183StatusFromChain(5), 'EXPIRED');
  assert.throws(() => erc8183StatusFromChain(6), /Unknown/);

  assert.doesNotThrow(() => assertErc8183Transition('OPEN', 'FUNDED'));
  assert.doesNotThrow(() => assertErc8183Transition('FUNDED', 'SUBMITTED'));
  assert.doesNotThrow(() => assertErc8183Transition('SUBMITTED', 'COMPLETED'));
  assert.throws(() => assertErc8183Transition('COMPLETED', 'SUBMITTED'), /not admissible/);
  assert.throws(() => assertErc8183Transition('FUNDED', 'COMPLETED'), /not admissible/);
  assert.equal(isErc8183Terminal('COMPLETED'), true);
  assert.equal(isErc8183Terminal('SUBMITTED'), false);
});

test('ERC-8183 accounting recognizes payout once and treats rejection or expiry as refund', () => {
  assert.equal(erc8183TerminalEconomicEffect('OPEN'), 'NONE');
  assert.equal(erc8183TerminalEconomicEffect('FUNDED'), 'NONE');
  assert.equal(erc8183TerminalEconomicEffect('COMPLETED'), 'PAYOUT');
  assert.equal(erc8183TerminalEconomicEffect('REJECTED'), 'REFUND');
  assert.equal(erc8183TerminalEconomicEffect('EXPIRED'), 'REFUND');
});

test('service output canonical JSON survives PostgreSQL jsonb key reordering', () => {
  assert.equal(
    canonicalJson({ scope: 'brief', nested: { z: 1, a: 2 }, chainId: 5_042_002 }),
    canonicalJson({ chainId: 5_042_002, nested: { a: 2, z: 1 }, scope: 'brief' }),
  );
});
