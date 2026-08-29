import assert from 'node:assert/strict';
import test from 'node:test';

import { liveEconomyLabel } from '../src/app/_live-economy/data.ts';

test('Live Economy labels preserve terminal status semantics', () => {
  assert.equal(liveEconomyLabel({ activityKind: 'COMMERCE', hasJob: false, hasPayment: true, status: 'COMPLETE' }), 'USDC payment settled');
  assert.equal(liveEconomyLabel({ activityKind: 'COMMERCE', hasJob: false, hasPayment: true, status: 'PENDING' }), 'USDC payment pending');
  assert.equal(liveEconomyLabel({ activityKind: 'COMMERCE', hasJob: true, hasPayment: true, status: 'FAILED' }), 'Job failed');
  assert.equal(liveEconomyLabel({ activityKind: 'COMMERCE', hasJob: true, hasPayment: true, status: 'OUTCOME_UNKNOWN' }), 'Job outcome unknown');
  assert.equal(liveEconomyLabel({ activityKind: 'CAPITAL', hasJob: false, hasPayment: false, status: 'FAILED' }), 'Capital allocation failed');
});
