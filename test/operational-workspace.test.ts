import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createOperationalAgent,
  createProductOfferDraft,
  deriveTreasuryProvisioningIdentity,
  normalizeCapabilityId,
} from '../src/modules/business/operational-workspace.ts';

const baseOffer = {
  businessId: 'biz_work_2' as const,
  controllerPrincipalId: 'usr_work_2' as const,
  description: 'A bounded machine-readable resource.',
  name: 'Market Signal Resource',
  price: '0.010000',
  protocol: 'X402' as const,
};

test('Product or Service draft identity is stable across an exact replay', () => {
  const first = createProductOfferDraft(baseOffer);
  const replay = createProductOfferDraft(baseOffer);
  assert.deepEqual(replay, first);
  assert.equal(first.status, 'DRAFT');
  assert.equal(first.commerceProtocol, 'X402');
  assert.match(first.idempotencyKey, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('Product draft semantics change its identity and remain economically bounded', () => {
  const instant = createProductOfferDraft(baseOffer);
  const evaluated = createProductOfferDraft({ ...baseOffer, protocol: 'ERC8183' });
  assert.notEqual(instant.offerId, evaluated.offerId);
  assert.throws(() => createProductOfferDraft({ ...baseOffer, price: '0' }), /greater than 0/);
  assert.throws(() => createProductOfferDraft({ ...baseOffer, price: '10.000001' }), /at most 10/);
  assert.equal(normalizeCapabilityId('  Research / Analysis  '), 'research-analysis');
});

test('Operational Agent is operator-invoked and receives no implicit identity or wallet authority', () => {
  const agent = createOperationalAgent({
    businessId: 'biz_work_2',
    capability: 'research',
    displayName: 'Research Operator',
    environment: 'PRIVATE_ARC_TESTNET',
    role: 'RESEARCH_AGENT',
  });
  assert.equal(agent.runtimeClass, 'OPERATOR_INVOKED');
  assert.deepEqual(agent.capabilities, ['research']);
  assert.equal(agent.providerOfRecordPrincipalId, agent.businessId);
  assert.throws(
    () => createOperationalAgent({ ...agent, capability: 'unrestricted-wallet', role: 'OPERATIONS_AGENT' }),
    /supported bounded Agent capability/,
  );
});

test('Treasury provisioning uses a stable provider idempotency boundary per controller and binding', () => {
  const input = {
    businessId: 'biz_work_2' as const,
    controllerPrincipalId: 'usr_work_2' as const,
    pendingBindingId: 'tbn_work_2' as const,
  };
  const first = deriveTreasuryProvisioningIdentity(input);
  assert.deepEqual(deriveTreasuryProvisioningIdentity(input), first);
  assert.notDeepEqual(
    deriveTreasuryProvisioningIdentity({ ...input, controllerPrincipalId: 'usr_intruder' }),
    first,
  );
});
