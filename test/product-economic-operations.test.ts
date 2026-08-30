import assert from 'node:assert/strict';
import test from 'node:test';

import {
  productCommerceSelectionForOffer,
  productCommerceSelections,
} from '../src/app/_commerce/catalog.ts';
import { createBusinessGenesis } from '../src/modules/business/model.ts';
import {
  assertProductEconomicRequestId,
  createProductErc8183Plan,
  createProductX402Plan,
  deriveProductOperationIdentity,
  productErc8183Legs,
} from '../src/modules/commerce/product-operations.ts';
import { alphaServiceCatalog } from '../src/modules/commerce/service-catalog.ts';

const controller = {
  actorClassification: 'COMMON_CONTROL_TEST',
  displayName: 'Product Controller',
  environment: 'PRIVATE_ARC_TESTNET',
  principalId: 'usr_product_controller',
} as const;

function business(templateId: 'ops-pilot' | 'signal-forge', businessId: `biz_${string}`) {
  return createBusinessGenesis({
    commonControlGroupId: 'ccg_product_test',
    controller,
    genesisRequestId: `genesis-${businessId}`,
    templateId,
  }, {
    businessId,
    controlId: `ctl_${businessId}`,
    eventId: `evt_${businessId}`,
  }, '2026-08-30T00:00:00.000Z').business;
}

const requestId = '7f1fc0c0-29cc-4f62-8b64-ec5aa46909bf';

test('product commerce mutation catalog matches the two surfaced controlled offers', () => {
  assert.deepEqual(
    productCommerceSelections.map(({ capability, kind }) => [capability.offer.offerId, kind]),
    [
      ['off_arc_snapshot_x402_v1', 'X402_PURCHASE'],
      ['off_commerce_readiness_8183_v1', 'ERC8183_JOB'],
    ],
  );
  assert.equal(
    productCommerceSelectionForOffer(alphaServiceCatalog.referenceMachineResource.offer.offerId),
    undefined,
  );
  assert.equal(
    productCommerceSelectionForOffer(alphaServiceCatalog.referenceEvaluatedWork.offer.offerId),
    undefined,
  );
});

test('human economic confirmation derives stable canonical IDs without becoming a second ledger', () => {
  const input = {
    buyerBusinessId: 'biz_product_buyer' as const,
    kind: 'X402_PURCHASE' as const,
    offerId: alphaServiceCatalog.arcMarketSnapshotX402.offer.offerId,
    requestId,
  };
  const identity = deriveProductOperationIdentity(input);
  assert.deepEqual(deriveProductOperationIdentity(input), identity);
  assert.match(identity.paymentId, /^pay_product_/);
  assert.match(identity.obligationId, /^obl_product_/);
  assert.match(identity.settlementIdempotencyKey, /^[0-9a-f-]{36}$/);
  assert.equal(new Set(Object.values(identity.erc8183Operations).map(({ operationId }) => operationId)).size, 6);
  assert.notEqual(
    deriveProductOperationIdentity({ ...input, kind: 'ERC8183_JOB' }).obligationId,
    identity.obligationId,
  );
  assert.equal(assertProductEconomicRequestId(requestId.toUpperCase()), requestId);
  assert.throws(() => assertProductEconomicRequestId('not-a-confirmation'), /UUID v4/);
});

test('product x402 plan grants exactly one bounded Agent action and one canonical obligation', () => {
  const buyer = business('ops-pilot', 'biz_product_buyer');
  const provider = business('signal-forge', 'biz_signal_forge');
  const identity = deriveProductOperationIdentity({
    buyerBusinessId: buyer.businessId,
    kind: 'X402_PURCHASE',
    offerId: alphaServiceCatalog.arcMarketSnapshotX402.offer.offerId,
    requestId,
  });
  const plan = createProductX402Plan({
    agentPrincipalId: 'agt_product_buyer',
    buyer,
    controllerPrincipalId: controller.principalId,
    identity,
    offer: alphaServiceCatalog.arcMarketSnapshotX402.offer,
    provider,
    requestedAt: '2026-08-30T10:00:00.000Z',
  });
  assert.equal(plan.grant.allowanceTotalMicroUsdc, plan.obligation.amountMicroUsdc);
  assert.equal(plan.grant.maxPerActionMicroUsdc, plan.obligation.amountMicroUsdc);
  assert.equal(plan.intent.requesterPrincipalId, 'agt_product_buyer');
  assert.equal(plan.obligation.executionAuthorizationId, identity.authorizationId);
  assert.equal(plan.obligation.provenance, 'COMMON_CONTROL_TEST');
  assert.equal(plan.settlement.provider, 'CIRCLE_GATEWAY_X402');
});

test('product ERC-8183 plan preserves funded-work commitment and ordered lifecycle', () => {
  const buyer = business('ops-pilot', 'biz_product_buyer');
  const provider = business('signal-forge', 'biz_signal_forge');
  const identity = deriveProductOperationIdentity({
    buyerBusinessId: buyer.businessId,
    kind: 'ERC8183_JOB',
    offerId: alphaServiceCatalog.commerceReadinessJob.offer.offerId,
    requestId,
  });
  const plan = createProductErc8183Plan({
    buyer,
    clientAddress: `0x${'1'.repeat(40)}`,
    identity,
    offer: alphaServiceCatalog.commerceReadinessJob.offer,
    provider,
    providerAddress: `0x${'2'.repeat(40)}`,
    requestedAt: '2026-08-30T10:00:00.000Z',
  });
  assert.equal(plan.commitment.jobId, identity.jobId);
  assert.equal(plan.commitment.budgetMicroUsdc, plan.obligation.amountMicroUsdc);
  assert.equal(plan.commitment.expiredAt, '2026-09-06T10:00:00.000Z');
  assert.equal(plan.settlement.provider, 'ERC8183');
  assert.deepEqual(productErc8183Legs(), ['CREATE', 'SET_BUDGET', 'APPROVE', 'FUND', 'SUBMIT', 'COMPLETE']);
});
