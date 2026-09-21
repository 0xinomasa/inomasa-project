import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { accountSessionCookie, localEntryEnabled } from '../../platform/auth/local-entry.ts';
import { withAccountRepository } from '../_auth/account';
import { SignOut } from './sign-out';
import styles from './account.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your account · Inomasa' };
export default async function AccountPage() {
  if (!localEntryEnabled()) notFound();
  const token = (await cookies()).get(accountSessionCookie)?.value;
  const access = await withAccountRepository(repository => repository.access(token));
  if (!access) redirect('/login');
  return <main className={styles['page']}>
    <header className={styles['header']}><Link className={styles['brand']} href="/">inomasa</Link><div className={styles['identity']}><span>Your account</span><span>{access.email}</span></div><SignOut /></header>
    <div className={styles['heading']}><div><p className={styles['eyebrow']}>YOUR ACCOUNT</p><h1>Your businesses</h1></div><button className={styles['primary']} disabled aria-describedby="build-requirement">Build a business</button></div>
    <div className={styles['grid']}>
      <section className={styles['card']}><h2>Continue to your account</h2><p>Connect your wallet to access your account and its businesses.</p><p className={styles['muted']}>Entering an email does not unlock an existing account.</p><div className={styles['divider']} /><h3>Already have an Alpha business?</h3><p>Your existing access is still available while account connection is being prepared.</p><Link className={styles['link']} href="/login?legacy=1">Open existing Alpha access →</Link></section>
      <aside className={styles['wallet']}><p className={styles['eyebrow']}>PERSONAL WALLET</p><h2>Not connected</h2><p>Wallet connection is not available in this build yet. You can sign out and return later.</p><p className={styles['muted']}>Recovery will require proof that you control the same wallet account.</p><p id="build-requirement">A ready Personal Wallet is needed before building a business. A zero balance can still be ready.</p></aside>
    </div>
  </main>;
}
