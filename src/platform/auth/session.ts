import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import type { InomasaEnvironment } from '../../shared/environment.ts';

export const productSessionCookie = 'inomasa_product_session';
const sessionLifetimeSeconds = 60 * 60 * 8;

export interface ProductSession {
  readonly email: string;
  readonly displayName: string;
  readonly principalId: `usr_${string}`;
  readonly actorClassification: 'COMMON_CONTROL_TEST';
  readonly environment: InomasaEnvironment;
  readonly issuedAt: number;
  readonly expiresAt: number;
}

export type LoginFailure =
  | 'AUTH_NOT_CONFIGURED'
  | 'INVALID_EMAIL'
  | 'INVITE_NOT_FOUND'
  | 'INVALID_CODE'
  | 'UNSUPPORTED_ENVIRONMENT';

export type LoginResult =
  | { readonly ok: true; readonly session: ProductSession }
  | { readonly ok: false; readonly reason: LoginFailure };

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function emailLooksValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function configuredEnvironment(): InomasaEnvironment | null {
  const value = process.env['INOMASA_ENV']?.trim();
  return value === 'LOCAL_DEVELOPMENT' || value === 'PRIVATE_ARC_TESTNET' ? value : null;
}

function inviteEntries(): ReadonlyMap<string, string> {
  const configured = process.env['INOMASA_ALPHA_INVITES']?.trim();
  if (!configured) return new Map();

  return new Map(
    configured
      .split(',')
      .map((entry) => entry.trim().split(':', 2))
      .filter(([email, code]) => Boolean(email && code))
      .map(([email, code]) => [normalizeEmail(email as string), code as string]),
  );
}

function sessionSecret(): string | null {
  const value = process.env['INOMASA_AUTH_SECRET']?.trim();
  return value && value.length >= 32 ? value : null;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function principalIdForEmail(email: string): `usr_${string}` {
  const digest = createHash('sha256').update(normalizeEmail(email)).digest('hex').slice(0, 32);
  return `usr_${digest}`;
}

export function displayNameForEmail(email: string): string {
  const localPart = normalizeEmail(email).split('@')[0] ?? 'Inomasa user';
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Inomasa user';
}

export function authenticateInvite(emailInput: string, codeInput: string, now = Date.now()): LoginResult {
  const email = normalizeEmail(emailInput);
  const code = codeInput.trim();
  const environment = configuredEnvironment();
  const secret = sessionSecret();

  if (!emailLooksValid(email)) return { ok: false, reason: 'INVALID_EMAIL' };
  if (environment === null) return { ok: false, reason: 'UNSUPPORTED_ENVIRONMENT' };
  if (secret === null || inviteEntries().size === 0) {
    return { ok: false, reason: 'AUTH_NOT_CONFIGURED' };
  }

  const expectedCode = inviteEntries().get(email);
  if (expectedCode === undefined) return { ok: false, reason: 'INVITE_NOT_FOUND' };
  if (!code || !safeEqual(code, expectedCode)) return { ok: false, reason: 'INVALID_CODE' };

  const issuedAt = Math.floor(now / 1000);
  const session: ProductSession = {
    actorClassification: 'COMMON_CONTROL_TEST',
    displayName: displayNameForEmail(email),
    email,
    environment,
    expiresAt: issuedAt + sessionLifetimeSeconds,
    issuedAt,
    principalId: principalIdForEmail(email),
  };
  return { ok: true, session };
}

function encode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decode(value: string): string | null {
  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

export function serializeProductSession(session: ProductSession): string {
  const secret = sessionSecret();
  if (secret === null) throw new Error('INOMASA_AUTH_SECRET is not configured.');
  const payload = encode(JSON.stringify(session));
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyProductSession(token: string | undefined, now = Date.now()): ProductSession | null {
  if (!token) return null;
  const secret = sessionSecret();
  if (secret === null) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  const decoded = decode(payload);
  if (decoded === null) return null;

  try {
    const session = JSON.parse(decoded) as ProductSession;
    if (
      typeof session.email !== 'string' ||
      typeof session.displayName !== 'string' ||
      typeof session.principalId !== 'string' ||
      !session.principalId.startsWith('usr_') ||
      session.actorClassification !== 'COMMON_CONTROL_TEST' ||
      (session.environment !== 'LOCAL_DEVELOPMENT' &&
        session.environment !== 'PRIVATE_ARC_TESTNET') ||
      !Number.isSafeInteger(session.expiresAt) ||
      session.expiresAt <= Math.floor(now / 1000)
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export const productSessionCookieOptions = {
  httpOnly: true,
  maxAge: sessionLifetimeSeconds,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env['NODE_ENV'] === 'production' && process.env['INOMASA_ENV'] !== 'LOCAL_DEVELOPMENT',
};
