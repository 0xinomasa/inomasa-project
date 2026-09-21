import assert from 'node:assert/strict';
import test from 'node:test';
import { localEntryEnabled, localEntryRequestAllowed, normalizeEntryEmail, newAccountSessionToken, accountSessionHash, validAccountSessionToken } from '../src/platform/auth/local-entry.ts';

 test('local entry requires explicit local profile and same loopback origin', () => {
  const previous = { environment: process.env['INOMASA_ENV'], enabled: process.env['INOMASA_LOCAL_ENTRY_ENABLED'] };
  try {
    process.env['INOMASA_ENV'] = 'LOCAL_DEVELOPMENT';
    process.env['INOMASA_LOCAL_ENTRY_ENABLED'] = 'true';
    const request = (origin = 'http://127.0.0.1:3000', host = '127.0.0.1:3000', site = 'same-origin') => new Request('http://127.0.0.1:3000/api/auth/entry', { headers: {origin,host,'sec-fetch-site':site} });
    assert.equal(localEntryEnabled(), true);
    assert.equal(localEntryRequestAllowed(request()), true);
    assert.equal(localEntryRequestAllowed(request('https://evil.example')), false);
    assert.equal(localEntryRequestAllowed(request('http://localhost:4000')), false);
    assert.equal(localEntryRequestAllowed(request(undefined, undefined, 'cross-site')), false);
    assert.equal(localEntryRequestAllowed(new Request('http://127.0.0.1:3000/api/auth/entry')), false);
    process.env['INOMASA_ENV'] = 'PRIVATE_ARC_TESTNET';
    assert.equal(localEntryRequestAllowed(request()), false);
    process.env['INOMASA_ENV'] = 'LOCAL_DEVELOPMENT';
    delete process.env['INOMASA_LOCAL_ENTRY_ENABLED'];
    assert.equal(localEntryRequestAllowed(request()), false);
  } finally {
    if (previous.environment === undefined) delete process.env['INOMASA_ENV']; else process.env['INOMASA_ENV'] = previous.environment;
    if (previous.enabled === undefined) delete process.env['INOMASA_LOCAL_ENTRY_ENABLED']; else process.env['INOMASA_LOCAL_ENTRY_ENABLED'] = previous.enabled;
  }
});

test('entry rejects invalid email and uses unguessable opaque sessions, not email-derived identities', () => {
  assert.equal(normalizeEntryEmail('  User@Example.com '), 'user@example.com');
  for (const value of [null, {}, '', 'a@b', 'a b@example.com', 'a'.repeat(255)+'@example.com']) assert.equal(normalizeEntryEmail(value), null);
  const first = newAccountSessionToken();
  assert.equal(validAccountSessionToken(first), true);
  assert.notEqual(first, newAccountSessionToken());
  assert.equal(accountSessionHash(first).length, 64);
  assert.notEqual(accountSessionHash(first), first);
  assert.equal(validAccountSessionToken('usr_email'), false);
});
