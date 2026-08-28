import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkpointGAgents,
  checkpointGBusinesses,
} from '../src/modules/reference-economy/fixtures.ts';
import { alphaServiceCatalog } from '../src/modules/commerce/service-catalog.ts';

test('reference economy spans all four generic templates under explicit common-control fixtures', () => {
  assert.equal(checkpointGBusinesses.length, 4);
  assert.equal(new Set(checkpointGBusinesses.map(({ businessId }) => businessId)).size, 4);
  assert.equal(new Set(checkpointGBusinesses.map(({ controllerId }) => controllerId)).size, 4);
  assert.deepEqual(
    new Set(checkpointGBusinesses.map(({ templateId }) => templateId)),
    new Set(['api-data-compute', 'saas-micro-saas', 'agent-as-a-service', 'web3-native-digital']),
  );
  assert.equal(checkpointGAgents.length, 4);
  for (const agent of checkpointGAgents) {
    assert.equal(agent.businessId, agent.providerOfRecordPrincipalId);
    assert.ok(checkpointGBusinesses.some(({ businessId }) => businessId === agent.businessId));
  }
});

test('reference economy composes x402, ERC-8183, and later direct Capital use without conflating offers', () => {
  const capabilities = [
    alphaServiceCatalog.referenceMachineResource,
    alphaServiceCatalog.referenceEvaluatedWork,
    alphaServiceCatalog.referenceCapitalUse,
  ];
  assert.equal(alphaServiceCatalog.referenceMachineResource.protocol, 'X402');
  assert.equal(alphaServiceCatalog.referenceEvaluatedWork.protocol, 'ERC8183');
  assert.equal(alphaServiceCatalog.referenceCapitalUse.protocol, 'ARC_USDC');
  assert.deepEqual(
    new Set(capabilities.map(({ offer }) => offer.offerId)).size,
    3,
  );
  assert.ok(
    capabilities.every(
      ({ offer }) => offer.providerBusinessId === 'biz_reference_signal',
    ),
  );
});
