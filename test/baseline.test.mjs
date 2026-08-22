import assert from 'node:assert/strict';
import test from 'node:test';

import { repositoryBaseline } from '../dist/index.js';

test('B1 repository baseline exposes its authority and runtime', () => {
  assert.deepEqual(repositoryBaseline, {
    architectureAuthority: 'Inomasa Canonical Architecture v1.0',
    phase: 'B1 Repository Bootstrap',
    runtime: 'Node.js 22',
    status: 'engineering-baseline-only',
  });
});
