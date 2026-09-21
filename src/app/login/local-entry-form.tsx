'use client';
import { useState } from 'react';
import styles from '../account/account.module.css';

export function LocalEntryForm() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');
    setBusy(true); setError(null);
    try {
      const response = await fetch('/api/auth/entry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) { setError(result.error ?? 'Entry could not be completed.'); return; }
      window.location.assign('/account');
    } catch { setError('Entry is temporarily unavailable. Please try again.'); }
    finally { setBusy(false); }
  }
  return <form className={styles['form']} onSubmit={submit}>
    <label htmlFor="entry-email">Email</label>
    <input autoComplete="email" id="entry-email" name="email" type="email" maxLength={254} required placeholder="you@example.com" />
    {error && <p role="alert">{error}</p>}
    <button className={styles['primary']} disabled={busy} type="submit">{busy ? 'Opening…' : 'Continue'}</button>
    <p className={styles['muted']}>No invitation or email code is needed to enter. Connecting or recovering your wallet requires authentication.</p>
  </form>;
}
