import assert from 'node:assert/strict';
import test from 'node:test';
import { hasSameProductOrigin } from '../src/platform/http/request-origin.ts';

test('local product requests use the browser-facing Host when Next internally uses localhost', () => {
  const url = 'http://localhost:3000/api/product/connections';
  assert.equal(hasSameProductOrigin(new Request(url, { headers: { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' } })), true);
  assert.equal(hasSameProductOrigin(new Request(url, { headers: { host: 'localhost:3000', origin: 'http://localhost:3000' } })), true);
  assert.equal(hasSameProductOrigin(new Request('https://inomasa.example/api', { headers: { host: 'inomasa.example', origin: 'https://inomasa.example' } })), true);
});

test('origin checks reject cross-site, different port/protocol, missing and forged hosts', () => {
  const url = 'http://localhost:3000/api/product/connections';
  for (const origin of ['https://other.example', 'http://localhost:4000', 'https://localhost:3000', 'null', 'http://localhost:3000/path']) {
    assert.equal(hasSameProductOrigin(new Request(url, { headers: { host: 'localhost:3000', origin } })), false);
  }
  assert.equal(hasSameProductOrigin(new Request(url)), false);
  for (const host of ['user@localhost:3000', 'localhost:3000/path', 'localhost:3000,other.example']) {
    assert.equal(hasSameProductOrigin(new Request(url, { headers: { host, origin: 'http://localhost:3000' } })), false);
  }
  assert.equal(hasSameProductOrigin(new Request(url, { headers: { host: 'localhost:3000', origin: 'https://other.example', 'x-forwarded-host': 'other.example' } })), false);
});
