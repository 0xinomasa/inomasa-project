import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { withAccountRepository } from '../../../_auth/account';
import { accountSessionCookie, accountSessionCookieOptions, localEntryRequestAllowed, normalizeEntryEmail } from '../../../../platform/auth/local-entry.ts';

export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  if (!localEntryRequestAllowed(request)) return NextResponse.json({ error: 'Local entry is unavailable.' }, { status: 403, headers });
  let email: string | null;
  try { email = normalizeEntryEmail((await request.json() as { email?: unknown }).email); }
  catch { return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400, headers }); }
  if (email === null) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400, headers });
  try {
    const previous = (await cookies()).get(accountSessionCookie)?.value;
    const token = await withAccountRepository(repository => repository.openEntry(email, previous));
    const response = NextResponse.json({ next: '/account' }, { headers });
    response.cookies.set(accountSessionCookie, token, accountSessionCookieOptions);
    return response;
  } catch { return NextResponse.json({ error: 'Entry is temporarily unavailable. Please try again.' }, { status: 503, headers }); }
}
