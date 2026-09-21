'use client';
import Link from 'next/link';
import styles from './account.module.css';
export default function AccountError({ reset }: { readonly reset: () => void }) {
  return <main className={styles['page']}><section className={styles['entry']}><h1>Your account is temporarily unavailable</h1><p>We could not load your session. Please try again.</p><button className={styles['primary']} onClick={reset}>Try again</button><p><Link href="/login">Return to sign in</Link></p></section></main>;
}
