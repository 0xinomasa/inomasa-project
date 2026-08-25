import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CircleConfigurationError,
  readCircleDeveloperWalletConfig,
} from '../src/platform/circle/config.ts';

test('Circle wallet configuration is explicit and testnet-bound', () => {
  const config = readCircleDeveloperWalletConfig({
    CIRCLE_API_KEY: 'TEST_API_KEY_PLACEHOLDER',
    CIRCLE_ENTITY_SECRET: 'TEST_ENTITY_SECRET_PLACEHOLDER',
    CIRCLE_WALLET_SET_ID: 'TEST_WALLET_SET_ID',
    INOMASA_ENV: 'PRIVATE_ARC_TESTNET',
  });

  assert.equal(config.environment, 'PRIVATE_ARC_TESTNET');
  assert.equal(config.walletSetId, 'TEST_WALLET_SET_ID');
});

test('Circle wallet configuration rejects mainnet and missing secrets', () => {
  assert.throws(
    () =>
      readCircleDeveloperWalletConfig({
        CIRCLE_API_KEY: 'key',
        CIRCLE_ENTITY_SECRET: 'secret',
        CIRCLE_WALLET_SET_ID: 'set',
        INOMASA_ENV: 'MAINNET',
      }),
    CircleConfigurationError,
  );

  assert.throws(
    () =>
      readCircleDeveloperWalletConfig({
        CIRCLE_WALLET_SET_ID: 'set',
        INOMASA_ENV: 'PRIVATE_ARC_TESTNET',
      }),
    /CIRCLE_API_KEY/,
  );
});
