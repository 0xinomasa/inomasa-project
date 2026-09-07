import assert from 'node:assert/strict';
import test from 'node:test';

import { productPaths } from '../src/app/_shell/model.ts';

test('the application shell keeps the three entry paths distinct', () => {
  assert.deepEqual(
    productPaths.map(({ label, status }) => ({ label, status })),
    [
      { label: 'BUILD', status: 'ALPHA' },
      { label: 'CONNECT', status: 'ALPHA' },
      { label: 'CAPITAL', status: 'ALPHA' },
    ],
  );
});

test('the application shell exposes unique internal destinations', () => {
  const destinations = productPaths.map(({ href }) => href);

  assert.equal(new Set(destinations).size, destinations.length);
  assert.ok(destinations.every((destination) => destination.startsWith('#') || destination.startsWith('/')));
});
