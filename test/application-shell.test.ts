import assert from 'node:assert/strict';
import test from 'node:test';

import { productPaths } from '../src/app/_shell/model.ts';

test('the application shell keeps the three entry paths distinct', () => {
  assert.deepEqual(
    productPaths.map(({ label, status }) => ({ label, status })),
    [
      { label: 'BUILD', status: 'ALPHA' },
      { label: 'MIGRATE', status: 'LOCKED' },
      { label: 'CAPITAL', status: 'NEXT' },
    ],
  );
});

test('the application shell exposes unique structural anchors', () => {
  const anchors = productPaths.map(({ href }) => href);

  assert.equal(new Set(anchors).size, anchors.length);
  assert.ok(anchors.every((anchor) => anchor.startsWith('#')));
});
