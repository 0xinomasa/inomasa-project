import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveBusinessGenesisIdentity } from '../src/app/api/product/businesses/request-identity.ts';

const input = {
  displayName: 'Signal Forge',
  principalId: 'usr_owner' as `usr_${string}`,
  slug: 'signal-forge',
  summary: 'A deterministic data service.',
  templateId: 'api-data-compute',
};

test('replayed equivalent BUILD requests reuse one genesis identity', () => {
  const first = deriveBusinessGenesisIdentity(input);
  const replay = deriveBusinessGenesisIdentity({ ...input });
  assert.deepEqual(replay, first);
  assert.match(first.businessId, /^biz_signal_forge_[0-9a-f]{16}$/);
  assert.ok(first.businessId.length <= 80);
  assert.ok(first.genesisRequestId.length <= 96);
});

test('genesis identity is scoped to principal and submitted semantics', () => {
  const first = deriveBusinessGenesisIdentity(input);
  const otherPrincipal = deriveBusinessGenesisIdentity({ ...input, principalId: 'usr_other' });
  const otherSummary = deriveBusinessGenesisIdentity({ ...input, summary: 'A different service.' });
  assert.notEqual(otherPrincipal.genesisRequestId, first.genesisRequestId);
  assert.notEqual(otherSummary.genesisRequestId, first.genesisRequestId);
});
