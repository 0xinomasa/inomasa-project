'use client';
import { useState } from 'react';
import styles from './account.module.css';
export function SignOut() {
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true); setError(false);
    try {
      const response = await fetch('/api/auth/account/logout', { method: 'POST' });
      if (!response.ok) { setError(true); return; }
      window.location.assign('/login');
    } catch { setError(true); } finally { setBusy(false); }
  }
  return <div><button className={styles['secondary']} disabled={busy} onClick={signOut}>{busy ? 'Signing out…' : 'Sign out'}</button>{error && <p role="alert">Could not sign out. Please try again.</p>}</div>;
}
