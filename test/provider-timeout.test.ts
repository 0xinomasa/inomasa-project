import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ExternalOperationTimeoutError,
  externalProviderTimeoutMs,
  externalReadTimeoutMs,
  withExternalOperationTimeout,
} from '../src/platform/provider-timeout.ts';

test('external call timeout is bounded below the product route duration', () => {
  assert.ok(externalReadTimeoutMs > 0);
  assert.ok(externalProviderTimeoutMs > externalReadTimeoutMs);
  assert.ok(externalProviderTimeoutMs < 60_000);
});

test('external timeout never invents a terminal outcome', async () => {
  await assert.rejects(
    withExternalOperationTimeout(new Promise<never>(() => undefined), 'Provider proof', 5),
    (error: unknown) =>
      error instanceof ExternalOperationTimeoutError &&
      /no terminal external outcome was inferred/.test(error.message),
  );
});

test('completed external call clears its timeout path', async () => {
  assert.equal(await withExternalOperationTimeout(Promise.resolve('COMPLETE'), 'Provider proof', 50), 'COMPLETE');
});
