import { createHmac, timingSafeEqual } from 'node:crypto';

import { proposalDigest, validateCreationProposal, type CreationAssistance } from '../../modules/business/creation-assistance.ts';

function signature(payload: string, secret: string): string {
  if (secret.length < 32) throw new Error('Proposal verification is not configured.');
  return createHmac('sha256', secret).update('inomasa-creation-v1\0').update(payload).digest('base64url');
}

export function signCreationAssistance(assistance: CreationAssistance, principalId: string, secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ assistance, principalId, expiresAt: now + 60 * 60 * 1000 })).toString('base64url');
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyCreationAssistance(token: unknown, principalId: string, secret: string, now = Date.now()): CreationAssistance {
  if (typeof token !== 'string' || token.length > 20_000) throw new Error('Invalid AI proposal proof.');
  const [payload, signed, extra] = token.split('.');
  if (!payload || !signed || extra !== undefined) throw new Error('Invalid AI proposal proof.');
  const expected = Buffer.from(signature(payload, secret));
  const actual = Buffer.from(signed);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Invalid AI proposal proof.');
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
    assistance: CreationAssistance; expiresAt: number; principalId: string;
  };
  if (decoded.principalId !== principalId || !Number.isSafeInteger(decoded.expiresAt) || decoded.expiresAt <= now) {
    throw new Error('AI proposal proof expired or belongs to another user.');
  }
  const proposal = validateCreationProposal(decoded.assistance.proposal);
  if (proposalDigest(proposal) !== decoded.assistance.outputSha256) throw new Error('AI proposal proof does not match its content.');
  return { ...decoded.assistance, proposal };
}
