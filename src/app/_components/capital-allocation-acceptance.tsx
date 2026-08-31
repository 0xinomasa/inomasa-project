'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

type ActionState = { readonly kind: 'error' | 'success'; readonly message: string } | null;

export function CapitalAllocationAcceptance({
  allocationId,
  businessSlug,
}: {
  readonly allocationId: string;
  readonly businessSlug: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<ActionState>(null);

  async function accept(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setState(null);
    setPending(true);
    try {
      const response = await fetch(
        `/api/product/businesses/${encodeURIComponent(businessSlug)}/capital/${encodeURIComponent(allocationId)}/accept`,
        {
          body: JSON.stringify({ action: 'ACCEPT' }),
          headers: { 'content-type': 'application/json' },
          method: 'POST',
        },
      );
      const result = await response.json() as Record<string, unknown>;
      if (!response.ok) {
        throw new Error(typeof result['error'] === 'string' ? result['error'] : 'Capital acceptance did not complete.');
      }
      setState({
        kind: 'success',
        message: 'Allocation authorized. No provider transfer was submitted by this action.',
      });
      router.refresh();
    } catch (error: unknown) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Capital acceptance did not complete.',
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="capital-acceptance" onSubmit={(event) => void accept(event)}>
      <label className="economic-confirmation">
        <input name="confirmed" required type="checkbox" />
        <span>
          I authorize this exact controlled test allocation for this Business. This is Capital,
          not Revenue, and authorization does not imply settlement.
        </span>
      </label>
      <button className="button button--primary" disabled={pending} type="submit">
        {pending ? 'Authorizing…' : 'Authorize allocation'}
      </button>
      {state === null ? null : (
        <p className={`operation-message operation-message--${state.kind}`} role="status">{state.message}</p>
      )}
    </form>
  );
}
