import assert from 'node:assert/strict';
import test from 'node:test';

import { connectionIdentity, externalManifestDigest } from '../src/modules/business/external-connection.ts';
import { createBusinessGenesis } from '../src/modules/business/model.ts';
import { observeBusinessSource, readBusinessSources, readConnectedResource, sourceForController, sourceUrl } from '../src/platform/http/business-source.ts';

const controller = { principalId: 'usr_owner', actorClassification: 'COMMON_CONTROL_TEST', environment: 'PRIVATE_ARC_TESTNET', displayName: 'Owner' } as const;
const source = { sourceId: 'catalog', label: 'Catalog source', controllerPrincipalId: controller.principalId, manifestUrl: 'https://business.example/inomasa.json', resourceUrl: 'https://business.example/catalog.json' };
const manifest = { version: 1, externalBusinessId: 'external-1', displayName: 'Existing Business', summary: 'An existing catalog Business.', templateId: 'api-data-compute' } as const;

test('CONNECT configuration scopes sources to the configured principal and disables unconfigured entry', () => {
  const sources = readBusinessSources({ INOMASA_ENV: 'PRIVATE_ARC_TESTNET', INOMASA_CONNECT_SOURCES: JSON.stringify([source]) });
  assert.deepEqual(sourceForController(sources, 'catalog', 'usr_owner'), source);
  assert.throws(() => sourceForController(sources, 'catalog', 'usr_other'), /authorized/);
  assert.throws(() => sourceForController([], 'catalog', 'usr_owner'), /authorized/);
  assert.throws(() => readBusinessSources({ INOMASA_ENV: 'MAINNET', INOMASA_CONNECT_SOURCES: JSON.stringify([source]) }), /controlled/);
  assert.throws(() => readBusinessSources({ INOMASA_ENV: 'PRIVATE_ARC_TESTNET', INOMASA_CONNECT_SOURCES: JSON.stringify([source, source]) }), /unique/);
});

test('source URLs reject secret-bearing URLs and require explicit loopback testing', () => {
  assert.throws(() => sourceUrl('http://example.com/resource', false), /HTTPS/);
  assert.throws(() => sourceUrl('https://example.com/resource?key=secret', false), /credentials/);
  assert.throws(() => sourceUrl('https://user:pass@example.com/resource', false), /credentials/);
  assert.throws(() => sourceUrl('http://127.0.0.1:4100/data', false), /HTTPS/);
  assert.equal(sourceUrl('http://127.0.0.1:4100/data', true), 'http://127.0.0.1:4100/data');
});

test('connected origin retains external provenance in the same Business genesis with stable replay identity', async () => {
  const connection = await observeBusinessSource(source, async () => Response.json({ ...manifest, revenue: 'unverified claim' }));
  assert.deepEqual(connection.manifest, manifest);
  assert.equal(connection.manifestSha256, externalManifestDigest(manifest));
  const identity = connectionIdentity(connection);
  assert.deepEqual(connectionIdentity({ ...connection, observedAt: new Date().toISOString() }), identity);
  const input = { controller, commonControlGroupId: 'ccg_test', entryRoute: 'MIGRATE' as const, externalConnection: connection, ...manifest, genesisRequestId: identity.genesisRequestId, slug: identity.slug };
  const genesis = createBusinessGenesis(input, identity, connection.observedAt);
  assert.equal(genesis.business.entryRoute, 'MIGRATE');
  assert.equal(genesis.externalConnection?.provenance, 'EXTERNAL_SOURCE');
  assert.equal(genesis.control.controllerPrincipalId, controller.principalId);
  assert.throws(() => createBusinessGenesis({ ...input, controller: { ...controller, principalId: 'usr_other' } }, identity, connection.observedAt), /scoped/);
  assert.throws(() => createBusinessGenesis({ ...input, entryRoute: 'BUILD' }, identity, connection.observedAt), /cannot be labeled/);
  assert.throws(() => createBusinessGenesis({ ...input, summary: 'changed context' }, identity, connection.observedAt), /match/);
});

test('connected resource uses GET without redirects and keeps external data separate from its observation', async () => {
  const connection = await observeBusinessSource(source, async () => Response.json(manifest));
  let reads = 0;
  const result = await readConnectedResource(connection, [source], async (url, options) => {
    reads++;
    assert.equal(String(url), source.resourceUrl);
    assert.equal(options?.method, 'GET');
    assert.equal(options?.redirect, 'error');
    return Response.json({ items: [{ sku: 'service-1', available: true }] });
  });
  assert.equal(reads, 1);
  assert.equal(result.output.provenance, 'EXTERNAL_SOURCE');
  assert.deepEqual(result.output.data, { items: [{ sku: 'service-1', available: true }] });
  assert.match(result.sourceReference, /^external:catalog:[0-9a-f]{64}$/);
  await assert.rejects(readConnectedResource(connection, [{ ...source, resourceUrl: 'https://other.example/data' }]), /retargeted/);
  await assert.rejects(readConnectedResource(connection, [], async () => { throw new Error('must not call'); }), /authorized/);
});
