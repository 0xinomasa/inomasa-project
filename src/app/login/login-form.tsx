'use client';

import { useState } from 'react';

type LoginFormProps = {
  readonly nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        body: JSON.stringify({ code, email, next: nextPath }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
      const result = (await response.json()) as { readonly error?: string; readonly next?: string };
      if (!response.ok) {
        setError(result.error ?? 'Sign-in could not be completed.');
        return;
      }
      window.location.assign(result.next ?? '/app');
    } catch {
      setError('Sign-in is temporarily unavailable. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="email">Invited email</label>
        <input
          autoComplete="email"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </div>
      <div className="field">
        <label htmlFor="code">Invite code</label>
        <input
          autoComplete="one-time-code"
          id="code"
          onChange={(event) => setCode(event.target.value)}
          placeholder="Provided by the operator"
          required
          type="password"
          value={code}
        />
      </div>
      {error === null ? null : <p aria-live="polite" className="form-error">{error}</p>}
      <button className="button button--primary" disabled={submitting} type="submit">
        {submitting ? 'Checking access…' : 'Enter Inomasa'}
      </button>
      <p className="form-note">
        This is invited access to the controlled Alpha. Your session is mapped to a
        stable Human Principal; it does not grant production or mainnet authority.
      </p>
    </form>
  );
}
