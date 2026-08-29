import { NextResponse } from 'next/server';

import {
  authenticateInvite,
  productSessionCookie,
  productSessionCookieOptions,
  serializeProductSession,
} from '../../../../platform/auth/session.ts';

export const dynamic = 'force-dynamic';

function safeNextPath(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/app';
}

export async function POST(request: Request): Promise<Response> {
  let input: { readonly email?: unknown; readonly code?: unknown; readonly next?: unknown };
  try {
    input = (await request.json()) as typeof input;
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const result = authenticateInvite(
    typeof input.email === 'string' ? input.email : '',
    typeof input.code === 'string' ? input.code : '',
  );
  if (!result.ok) {
    const messages = {
      AUTH_NOT_CONFIGURED: 'Product authentication is not configured for this environment.',
      INVALID_CODE: 'The invite code is incorrect.',
      INVALID_EMAIL: 'Enter a valid invited email address.',
      INVITE_NOT_FOUND: 'This email is not invited to the protected Alpha.',
      UNSUPPORTED_ENVIRONMENT: 'Product authentication is limited to the controlled testnet environment.',
    } as const;
    return Response.json({ error: messages[result.reason], reason: result.reason }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, next: safeNextPath(
    typeof input.next === 'string' ? input.next : null,
  ) });
  response.cookies.set(
    productSessionCookie,
    serializeProductSession(result.session),
    productSessionCookieOptions,
  );
  return response;
}
