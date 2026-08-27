import assert from 'node:assert/strict';
import test from 'node:test';

import {
  agentRegistry,
  buildErc8004RegistrationFile,
  encodeRegistrationDataUri,
  erc8004ReconciliationLeg,
} from '../src/modules/agent/erc8004.ts';
import { validateBusinessAgent, type BusinessAgent } from '../src/modules/agent/model.ts';
import { arcErc8004 } from '../src/platform/arc/erc8004.ts';
import { erc8004EvidenceId } from '../src/platform/persistence/erc8004-repository.ts';

const agent: BusinessAgent = {
  agentPrincipalId: 'agt_example',
  businessId: 'biz_example',
  capabilities: ['purchase-service'],
  displayName: 'Example Agent',
  environment: 'PRIVATE_ARC_TESTNET',
  providerOfRecordPrincipalId: 'biz_example',
  role: 'BUYER_AGENT',
  runtimeClass: 'OPERATOR_INVOKED',
  softwareVersion: 'example@1',
  status: 'ACTIVE',
};

test('generic Agent preserves Business relationship without collapsing identity or runtime', () => {
  assert.equal(validateBusinessAgent(agent), agent);
  assert.throws(
    () => validateBusinessAgent({ ...agent, providerOfRecordPrincipalId: 'biz_other' }),
    /related Business/,
  );
  assert.throws(
    () => validateBusinessAgent({ ...agent, capabilities: ['purchase-service', 'purchase-service'] }),
    /unique/,
  );
});

test('ERC-8004 ambiguous outcomes reconcile the persisted transaction leg without resubmission', () => {
  assert.equal(
    erc8004ReconciliationLeg({ hasMetadataSubmission: false, state: 'OUTCOME_UNKNOWN' }),
    'REGISTRATION',
  );
  assert.equal(
    erc8004ReconciliationLeg({ hasMetadataSubmission: true, state: 'OUTCOME_UNKNOWN' }),
    'METADATA',
  );
  assert.equal(
    erc8004ReconciliationLeg({ hasMetadataSubmission: true, state: 'VERIFIED' }),
    null,
  );
});

test('ERC-8004 Evidence IDs preserve the schema length bound', () => {
  const identityId = `aid_${'a'.repeat(76)}` as const;
  const evidenceId = erc8004EvidenceId(identityId);
  assert.equal(evidenceId.length, 80);
  assert.equal(evidenceId.startsWith('evi_'), true);
});

test('ERC-8004 registration data URI binds the portable registry pair back to the Agent', () => {
  const registry = agentRegistry(arcErc8004);
  const file = buildErc8004RegistrationFile({
    agent,
    identity: { ...arcErc8004, agentId: 42n, agentRegistry: registry },
    image: 'data:image/svg+xml;base64,PHN2Zy8+',
    serviceEndpoint: 'inomasa://agent/agt_example',
    x402Support: true,
  });
  const uri = encodeRegistrationDataUri(file);
  const decoded = JSON.parse(Buffer.from(uri.split(',')[1] as string, 'base64').toString()) as {
    readonly registrations: readonly { readonly agentId: number; readonly agentRegistry: string }[];
    readonly supportedTrust: readonly string[];
    readonly x402Support: boolean;
  };

  assert.equal(decoded.registrations[0]?.agentId, 42);
  assert.equal(decoded.registrations[0]?.agentRegistry, registry);
  assert.equal(decoded.x402Support, true);
  assert.deepEqual(decoded.supportedTrust, ['reputation']);
});
