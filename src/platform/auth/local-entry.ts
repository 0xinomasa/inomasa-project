import { createHash, randomBytes } from 'node:crypto';

export const accountSessionCookie = 'inomasa_account_session';
export const accountSessionLifetimeMs = 8 * 60 * 60 * 1000;

export function localEntryEnabled(): boolean {
  return process.env['INOMASA_ENV'] === 'LOCAL_DEVELOPMENT'
    && process.env['INOMASA_LOCAL_ENTRY_ENABLED'] === 'true';
}

// A selected server execution profile is required. Host/Origin alone never enable it.
export function localEntryRequestAllowed(request: Request): boolean {
  if (!localEntryEnabled()) return false;
  try {
    const target = new URL(request.url);
    const origin = new URL(request.headers.get('origin') ?? '');
    const host = request.headers.get('host');
    const permitted = new Set(['127.0.0.1', 'localhost', '[::1]']);
    return permitted.has(target.hostname) && permitted.has(origin.hostname)
      && origin.protocol === target.protocol && origin.protocol === 'http:'
      && origin.host === host && origin.port === target.port
      && (!request.headers.get('sec-fetch-site') || request.headers.get('sec-fetch-site') === 'same-origin');
  } catch { return false; }
}

export function normalizeEntryEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function newAccountSessionToken(): string { return randomBytes(32).toString('base64url'); }
export function accountSessionHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
export function validAccountSessionToken(token: string | undefined): token is string {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token);
}

export const accountSessionCookieOptions = {
  httpOnly: true, sameSite: 'strict' as const, path: '/', secure: false,
  maxAge: accountSessionLifetimeMs / 1000,
};
