import assert from 'node:assert/strict';
import test from 'node:test';

import {
  productCommerceSelectionForOffer,
  productCommerceSelections,
} from '../src/app/_commerce/catalog.ts';
import {
  clearBrowserEconomicIntent,
  getOrCreateBrowserEconomicIntent,
} from '../src/app/_commerce/browser-intent.ts';
import { currentProductEconomicState } from '../src/app/_commerce/presentation.ts';
import { createBusinessGenesis } from '../src/modules/business/model.ts';
import {
  assertProductEconomicRequestId,
  createProductErc8183Plan,
  createProductX402Plan,
  deriveProductOperationIdentity,
  providerHandoffDisposition,
  productErc8183Legs,
} from '../src/modules/commerce/product-operations.ts';
import {
  alphaServiceCatalog,
  supportsAlphaSnapshotExecution,
} from '../src/modules/commerce/service-catalog.ts';

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

test('an activated controller-created offer enters the same canonical commerce selection', () => {
  const selection = productCommerceSelectionForOffer('off_product_custom', [{
    capabilityId: 'custom-controlled-service',
    commerceProtocol: 'ERC8183',
    createdByProduct: true,
    description: 'A controller-created service used by the canonical job rail.',
    offerId: 'off_product_custom',
    priceMicroUsdc: '25000',
    providerBusinessId: 'biz_product_provider',
    providerDisplayName: 'Product provider',
    providerSlug: 'product-provider',
    status: 'ACTIVE',
    termsVersion: 1,
  }]);
  assert.equal(selection?.kind, 'ERC8183_JOB');
  assert.equal(selection?.capability.offer.offerId, 'off_product_custom');
  assert.equal(selection?.capability.offer.priceMicroUsdc, 25_000n);
  assert.equal(selection?.createdByProduct, true);
});

test('activated controller-created x402 offers use the existing deterministic Alpha executor', () => {
  assert.equal(supportsAlphaSnapshotExecution({
    commerceProtocol: 'X402',
    createdByPrincipalId: 'usr_product_controller',
    offerId: 'off_product_custom',
    status: 'ACTIVE',
  }), true);
  assert.equal(supportsAlphaSnapshotExecution({
    commerceProtocol: 'X402',
    createdByPrincipalId: 'usr_product_controller',
    offerId: 'off_product_custom',
    status: 'DRAFT',
  }), false);
  assert.equal(supportsAlphaSnapshotExecution({
    commerceProtocol: 'ERC8183',
    createdByPrincipalId: 'usr_product_controller',
    offerId: 'off_product_custom',
    status: 'ACTIVE',
  }), false);
  assert.equal(supportsAlphaSnapshotExecution({
    commerceProtocol: 'X402',
    createdByPrincipalId: null,
    offerId: 'off_unknown',
    status: 'ACTIVE',
  }), false);
});

test('completed x402 payment remains actionable until delivery is complete', () => {
  const request = {
    deliveryState: null,
    gatewayFundingState: 'DEPOSIT_COMPLETE',
    jobOperations: [],
    jobStatus: null,
    kind: 'X402_PURCHASE' as const,
    paymentState: 'COMPLETE',
  };
  assert.equal(currentProductEconomicState(request), 'DELIVERY_PENDING');
  assert.equal(currentProductEconomicState({ ...request, deliveryState: 'COMPLETE' }), 'COMPLETE');
  assert.equal(
    currentProductEconomicState({ ...request, gatewayFundingState: 'DEPOSIT_SUBMITTED' }),
    'RAIL_RECONCILIATION',
  );
});

test('lost browser response reuses the unresolved request ID and canonical obligation', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => { values.delete(key); },
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  const action = {
    agentPrincipalId: 'agt_product_buyer',
    businessSlug: 'product-buyer',
    kind: 'X402_PURCHASE' as const,
    offerId: 'off_product_custom',
  };
  const first = getOrCreateBrowserEconomicIntent(storage, action, () => requestId);
  const firstCanonical = deriveProductOperationIdentity({
    buyerBusinessId: 'biz_product_buyer',
    kind: first.kind,
    offerId: first.offerId as `off_${string}`,
    requestId: first.requestId,
  });

  // The server succeeded, but the response never reached the browser, so the
  // unresolved intent deliberately remains in browser storage.
  const recovered = getOrCreateBrowserEconomicIntent(
    storage,
    action,
    () => '1c209c94-d40a-47b6-b142-acf3298fb938',
  );
  const recoveredCanonical = deriveProductOperationIdentity({
    buyerBusinessId: 'biz_product_buyer',
    kind: recovered.kind,
    offerId: recovered.offerId as `off_${string}`,
    requestId: recovered.requestId,
  });
  assert.equal(recovered.requestId, first.requestId);
  assert.equal(recoveredCanonical.obligationId, firstCanonical.obligationId);

  clearBrowserEconomicIntent(storage, recovered);
  const nextIntent = getOrCreateBrowserEconomicIntent(
    storage,
    action,
    () => '1c209c94-d40a-47b6-b142-acf3298fb938',
  );
  assert.notEqual(nextIntent.requestId, first.requestId);
});

test('ambiguous provider handoff never authorizes blind resubmission', () => {
  assert.equal(
    providerHandoffDisposition({ providerTransactionId: null, state: 'OUTCOME_UNKNOWN' }),
    'HOLD',
  );
  assert.equal(
    providerHandoffDisposition({ providerTransactionId: 'provider-transaction', state: 'OUTCOME_UNKNOWN' }),
    'RECONCILE',
  );
  assert.equal(
    providerHandoffDisposition({ providerTransactionId: null, state: 'AUTHORIZED' }),
    'SUBMIT',
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
    erc8004IdentityId: 'aid_product_buyer',
    identity,
    offer: alphaServiceCatalog.arcMarketSnapshotX402.offer,
    provider,
    requestedAt: '2026-08-30T10:00:00.000Z',
  });
  assert.equal(plan.grant.allowanceTotalMicroUsdc, plan.obligation.amountMicroUsdc);
  assert.equal(plan.grant.maxPerActionMicroUsdc, plan.obligation.amountMicroUsdc);
  assert.equal(plan.intent.requesterPrincipalId, 'agt_product_buyer');
  assert.equal(plan.intent.erc8004IdentityId, 'aid_product_buyer');
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
