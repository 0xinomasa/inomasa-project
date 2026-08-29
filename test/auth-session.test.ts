import assert from 'node:assert/strict';
import test from 'node:test';

import {
  authenticateInvite,
  displayNameForEmail,
  principalIdForEmail,
  serializeProductSession,
  verifyProductSession,
} from '../src/platform/auth/session.ts';

const original = {
  env: process.env['INOMASA_ENV'],
  invites: process.env['INOMASA_ALPHA_INVITES'],
  secret: process.env['INOMASA_AUTH_SECRET'],
};

function setControlledAuth(): void {
  process.env['INOMASA_ENV'] = 'PRIVATE_ARC_TESTNET';
  process.env['INOMASA_ALPHA_INVITES'] = 'owner@example.com:alpha-code,second@example.com:second-code';
  process.env['INOMASA_AUTH_SECRET'] = '0123456789abcdef0123456789abcdef';
}

function restoreAuth(): void {
  for (const [key, value] of Object.entries({
    INOMASA_ENV: original.env,
    INOMASA_ALPHA_INVITES: original.invites,
    INOMASA_AUTH_SECRET: original.secret,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

test('invited email maps to a stable Human Principal and signed session', () => {
  setControlledAuth();
  try {
    const first = authenticateInvite('Owner@Example.com', 'alpha-code', 1_700_000_000_000);
    const second = authenticateInvite(' owner@example.com ', 'alpha-code', 1_700_000_001_000);
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (!first.ok || !second.ok) return;
    assert.equal(first.session.principalId, second.session.principalId);
    assert.equal(first.session.displayName, 'Owner');
    assert.equal(displayNameForEmail('owner@example.com'), 'Owner');
    assert.equal(first.session.environment, 'PRIVATE_ARC_TESTNET');
    const token = serializeProductSession(first.session);
    assert.deepEqual(verifyProductSession(token, 1_700_000_010_000), first.session);
  } finally {
    restoreAuth();
  }
});

test('different invited users receive different stable principals', () => {
  assert.notEqual(
    principalIdForEmail('owner@example.com'),
    principalIdForEmail('second@example.com'),
  );
});

test('tampered and expired sessions fail closed', () => {
  setControlledAuth();
  try {
    const result = authenticateInvite('owner@example.com', 'alpha-code', 1_700_000_000_000);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const token = serializeProductSession(result.session);
    const [payload, signature] = token.split('.');
    assert.equal(verifyProductSession(payload + '.tampered', 1_700_000_001_000), null);
    assert.equal(verifyProductSession(token, (result.session.expiresAt + 1) * 1000), null);
    assert.equal(signature?.length, 43);
  } finally {
    restoreAuth();
  }
});

test('session fails closed when the runtime environment changes', () => {
  setControlledAuth();
  try {
    const result = authenticateInvite('owner@example.com', 'alpha-code', 1_700_000_000_000);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const token = serializeProductSession(result.session);
    process.env['INOMASA_ENV'] = 'MAINNET';
    assert.equal(verifyProductSession(token, 1_700_000_001_000), null);
  } finally {
    restoreAuth();
  }
});

test('unconfigured or non-testnet authentication does not create a session', () => {
  delete process.env['INOMASA_AUTH_SECRET'];
  delete process.env['INOMASA_ALPHA_INVITES'];
  process.env['INOMASA_ENV'] = 'MAINNET';
  const result = authenticateInvite('owner@example.com', 'alpha-code');
  assert.deepEqual(result, { ok: false, reason: 'UNSUPPORTED_ENVIRONMENT' });
  restoreAuth();
});
