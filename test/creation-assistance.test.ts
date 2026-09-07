import assert from 'node:assert/strict';
import test from 'node:test';

import { creationIdea, proposalDigest, validateCreationProposal, type CreationAssistance } from '../src/modules/business/creation-assistance.ts';
import { GeminiBusinessCreationAssistant, readGeminiConfig } from '../src/platform/ai/gemini.ts';
import { signCreationAssistance, verifyCreationAssistance } from '../src/platform/ai/proposal-proof.ts';
import { readBoundedJson } from '../src/platform/http/bounded-json.ts';

const proposal = {
  displayName: 'Catalog Analysis', summary: 'Useful catalog analysis for digital businesses.',
  templateId: 'api-data-compute', firstService: 'Deliver a current catalog summary.',
  economicReason: 'Sell the resource for exact USDC payment on Arc.', nextSteps: ['Connect the catalog source.'],
} as const;
const secret = 'test-only-proposal-signing-secret-000000';
const assistance: CreationAssistance = {
  generatedAt: '2026-09-06T00:00:00.000Z', inputSha256: 'a'.repeat(64),
  model: 'gemini-test', outputSha256: proposalDigest(proposal), proposal, provider: 'GEMINI',
};

test('AI proposal validation rejects authority fields, unsupported templates and oversized inputs', () => {
  assert.deepEqual(validateCreationProposal(proposal), proposal);
  assert.throws(() => validateCreationProposal({ ...proposal, transfer: { amount: '100' } }), /unsupported/);
  assert.throws(() => validateCreationProposal({ ...proposal, templateId: 'arbitrary-new-domain' }), /template/);
  assert.throws(() => validateCreationProposal({ ...proposal, nextSteps: [] }), /next steps/);
  assert.throws(() => creationIdea('a'.repeat(3001)), /3000/);
});

test('AI provenance cannot be tampered with, transferred between users, or accepted after expiry', () => {
  const signed = signCreationAssistance(assistance, 'usr_owner', secret, 1000);
  assert.deepEqual(verifyCreationAssistance(signed, 'usr_owner', secret, 1001), assistance);
  assert.throws(() => verifyCreationAssistance(signed, 'usr_other', secret, 1001), /another user/);
  assert.throws(() => verifyCreationAssistance(`${signed}.extra`, 'usr_owner', secret, 1001), /Invalid/);
  assert.throws(() => verifyCreationAssistance(`x${signed}`, 'usr_owner', secret, 1001), /Invalid/);
  assert.throws(() => verifyCreationAssistance(signed, 'usr_owner', secret, 3_601_000), /expired/);
});

test('Gemini adapter uses one bounded structured request and returns scoped provenance', async () => {
  let calls = 0;
  const config = readGeminiConfig({ INOMASA_ENV: 'AUTOMATED_TEST', GEMINI_API_KEY: 'unit-test-placeholder', INOMASA_AI_MODEL: 'gemini-test' });
  const assistant = new GeminiBusinessCreationAssistant(config, async (url, options) => {
    calls++;
    assert.equal(String(url), 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent');
    assert.equal(options?.redirect, 'error');
    assert.equal(new Headers(options?.headers).get('x-goog-api-key'), config.apiKey);
    const body = JSON.parse(String(options?.body));
    assert.equal(body.generationConfig.maxOutputTokens, 4096);
    assert.equal(body.generationConfig.responseMimeType, 'application/json');
    assert.equal(body.tools, undefined);
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(proposal) }] } }] });
  });
  const result = await assistant.propose('Help my Business sell catalog analysis.');
  assert.equal(calls, 1);
  assert.deepEqual(result.proposal, proposal);
  assert.equal(result.outputSha256, proposalDigest(proposal));
  assert.equal(JSON.stringify(result).includes(config.apiKey), false);
});

test('failed or incomplete AI response is not retried, fabricated or exposed as a provider error', async () => {
  for (const response of [
    Response.json({ secret: 'provider-private-context' }, { status: 429 }),
    Response.json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: JSON.stringify(proposal) }] } }] }),
    Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'not JSON' }] } }] }),
  ]) {
    let calls = 0;
    const assistant = new GeminiBusinessCreationAssistant({ apiKey: 'unit-test-placeholder', model: 'gemini-test' }, async () => { calls++; return response; });
    await assert.rejects(assistant.propose('A useful service'), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /No Business was created/);
      assert.equal(error.message.includes('provider-private-context'), false);
      return true;
    });
    assert.equal(calls, 1);
  }
  assert.throws(() => readGeminiConfig({ INOMASA_ENV: 'MAINNET', GEMINI_API_KEY: 'test', INOMASA_AI_MODEL: 'gemini-test' }), /controlled/);
  assert.throws(() => readGeminiConfig({ INOMASA_ENV: 'LOCAL_DEVELOPMENT' }), /not configured/);
});

test('bounded JSON reader rejects oversized streamed data without trusting Content-Length', async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) { controller.enqueue(new TextEncoder().encode('x'.repeat(128))); },
    cancel() { cancelled = true; },
  });
  await assert.rejects(readBoundedJson(new Response(body, { headers: { 'content-type': 'application/json' } }), 64), /too large/);
  assert.equal(cancelled, true);
});
