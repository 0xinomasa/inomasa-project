import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { withAccountRepository } from '../../../../_auth/account';
import { accountSessionCookie, accountSessionCookieOptions, localEntryRequestAllowed } from '../../../../../platform/auth/local-entry.ts';

export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  if (!localEntryRequestAllowed(request)) return NextResponse.json({ error: 'Local entry is unavailable.' }, { status: 403, headers });
  try {
    const token = (await cookies()).get(accountSessionCookie)?.value;
    await withAccountRepository(repository => repository.logout(token));
    const response = NextResponse.json({ next: '/login' }, { headers });
    response.cookies.set(accountSessionCookie, '', { ...accountSessionCookieOptions, maxAge: 0 });
    return response;
  } catch { return NextResponse.json({ error: 'Sign-out could not be completed. Please try again.' }, { status: 503, headers }); }
}
