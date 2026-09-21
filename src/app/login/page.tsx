import type { Metadata } from 'next';
import Link from 'next/link';

import { Mark } from '../_components/mark';
import { localEntryEnabled } from '../../platform/auth/local-entry.ts';
import { LocalEntryForm } from './local-entry-form';
import styles from '../account/account.module.css';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  description: 'Controlled Alpha sign-in for the Inomasa protected Preview.',
  title: 'Sign in · Inomasa',
};

type LoginPageProps = {
  readonly searchParams: Promise<{ next?: string; legacy?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  if (localEntryEnabled() && params.legacy !== '1' && !params.next) {
    return <main className={styles['page']}><header className={styles['header']}><Link className={styles['brand']} href="/">inomasa</Link></header><section className={styles['entry']}><p className={styles['eyebrow']}>GET STARTED</p><h1>Welcome to Inomasa</h1><p>Start with your email.</p><div className={styles['card']}><LocalEntryForm /></div></section></main>;
  }
  const nextPath = params.next?.startsWith('/') && !params.next.startsWith('//')
    ? params.next
    : '/app';

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link aria-label="Inomasa home" className="brand" href="/">
          <Mark />
          <span>INOMASA</span>
        </Link>
        <span className="phase-badge">PROTECTED PREVIEW</span>
      </header>
      <section className="auth-layout">
        <div className="auth-intro">
          <p className="eyebrow">Authenticated product area</p>
          <h1>Bring a real operator into the economy.</h1>
          <p>
            Sign in with an invited email to enter BUILD and manage the Businesses you control.
            Product authentication is separate from Vercel deployment protection.
          </p>
          <Link className="text-link" href="/">Read the product overview →</Link>
        </div>
        <div className="auth-card">
          <div className="auth-card__heading">
            <span className="status-dot" />
            <span>Controlled Alpha access</span>
          </div>
          <LoginForm nextPath={nextPath} />
        </div>
      </section>
    </main>
  );
}
