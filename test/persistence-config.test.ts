import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DatabaseConfigurationError,
  readDatabaseConnectionConfig,
} from '../src/platform/persistence/config.ts';

const localRuntimeEnvironment = {
  DATABASE_URL: 'postgresql://local-user@127.0.0.1:5432/inomasa_test',
  INOMASA_ENV: 'LOCAL_DEVELOPMENT',
};

test('runtime and administrative connections use distinct generic variables', () => {
  const environment = {
    ...localRuntimeEnvironment,
    DATABASE_DIRECT_URL: 'postgresql://admin-user@127.0.0.1:5432/inomasa_test',
  };

  assert.equal(
    readDatabaseConnectionConfig('runtime', environment).connectionString,
    environment['DATABASE_URL'],
  );
  assert.equal(
    readDatabaseConnectionConfig('administrative', environment).connectionString,
    environment['DATABASE_DIRECT_URL'],
  );
});

test('missing database configuration fails explicitly without exposing a URL', () => {
  assert.throws(
    () => readDatabaseConnectionConfig('runtime', { INOMASA_ENV: 'LOCAL_DEVELOPMENT' }),
    (error: unknown) => {
      assert.ok(error instanceof DatabaseConfigurationError);
      assert.match(error.message, /DATABASE_URL/);
      assert.doesNotMatch(error.message, /postgresql:\/\//);
      return true;
    },
  );
});

test('non-local database connections require secure transport', () => {
  assert.throws(
    () =>
      readDatabaseConnectionConfig('runtime', {
        DATABASE_URL: 'postgresql://runtime-user@database.example/inomasa_private',
        INOMASA_ENV: 'PRIVATE_ARC_TESTNET',
      }),
    /secure transport/,
  );

  assert.equal(
    readDatabaseConnectionConfig('runtime', {
      DATABASE_URL:
        'postgresql://runtime-user@database.example/inomasa_private?sslmode=require',
      INOMASA_ENV: 'PRIVATE_ARC_TESTNET',
    }).environment,
    'PRIVATE_ARC_TESTNET',
  );
});

test('pool size must be a positive integer when configured', () => {
  assert.throws(
    () =>
      readDatabaseConnectionConfig('runtime', {
        ...localRuntimeEnvironment,
        DATABASE_POOL_MAX: '0',
      }),
    /positive integer/,
  );

  assert.equal(
    readDatabaseConnectionConfig('runtime', {
      ...localRuntimeEnvironment,
      DATABASE_POOL_MAX: '4',
    }).maxConnections,
    4,
  );
});
