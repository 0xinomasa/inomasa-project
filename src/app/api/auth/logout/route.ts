import { NextResponse } from 'next/server';

import {
  productSessionCookie,
  productSessionCookieOptions,
} from '../../../../platform/auth/session.ts';

export async function POST(): Promise<Response> {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(productSessionCookie, '', {
    ...productSessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
