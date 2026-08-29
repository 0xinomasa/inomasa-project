import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  productSessionCookie,
  verifyProductSession,
  type ProductSession,
} from '../../platform/auth/session.ts';

export async function getProductSession(): Promise<ProductSession | null> {
  const cookieStore = await cookies();
  return verifyProductSession(cookieStore.get(productSessionCookie)?.value);
}

export async function requireProductSession(nextPath = '/app'): Promise<ProductSession> {
  const session = await getProductSession();
  if (session === null) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return session;
}
