'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';

import {
  clearBrowserEconomicIntent,
  getOrCreateBrowserEconomicIntent,
} from '../_commerce/browser-intent.ts';

interface CommerceOfferView {
  readonly amountUsdc: string;
  readonly createdByProduct: boolean;
  readonly description: string;
  readonly displayName: string;
  readonly kind: 'ERC8183_JOB' | 'X402_PURCHASE';
  readonly offerId: string;
  readonly providerDisplayName: string;
  readonly transactionShape: string;
}

interface CommerceRequestView {
  readonly agentPrincipalId: string | null;
  readonly amountMicroUsdc: string;
  readonly deliverySourceReference: string | null;
  readonly deliveryState: string | null;
  readonly gatewayFundingState: string | null;
  readonly jobId: string | null;
  readonly jobOperations: readonly {
    readonly leg: string;
    readonly providerState: string | null;
    readonly state: string;
    readonly transactionHash: string | null;
  }[];
  readonly jobProtocolId: string | null;
  readonly jobStatus: string | null;
  readonly kind: 'ERC8183_JOB' | 'X402_PURCHASE';
  readonly obligationId: string;
  readonly offerCapabilityId: string;
  readonly offerDescription: string;
  readonly offerId: string;
  readonly paymentId: string | null;
  readonly paymentProviderReference: string | null;
  readonly paymentProviderState: string | null;
  readonly paymentState: string | null;
  readonly providerDisplayName: string;
  readonly requestId: string;
  readonly requestedAt: string;
  readonly settlementState: string;
  readonly settlementTransactionHash: string | null;
}

interface PurchaseAgentView {
  readonly agentPrincipalId: string;
  readonly capabilities: readonly string[];
  readonly displayName: string;
  readonly identityState: string | null;
  readonly runtimeClass: string;
  readonly status: string;
}

type ActionState = { readonly kind: 'error' | 'success'; readonly message: string } | null;

async function resultJson(response: Response): Promise<Record<string, unknown>> {
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof result['error'] === 'string' ? result['error'] : 'The economic operation did not complete.');
  }
  return result;
}

function exactUsdc(microUsdc: string): string {
  const amount = BigInt(microUsdc);
  return `${amount / 1_000_000n}.${(amount % 1_000_000n).toString().padStart(6, '0')} USDC`;
}

function readable(value: string): string {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function currentState(request: CommerceRequestView): string {
  if (request.kind === 'X402_PURCHASE') {
    if (
      request.paymentState === 'COMPLETE' &&
      (request.gatewayFundingState === 'APPROVAL_SUBMITTED' ||
        request.gatewayFundingState === 'DEPOSIT_SUBMITTED' ||
        request.gatewayFundingState === 'OUTCOME_UNKNOWN')
    ) return 'RAIL_RECONCILIATION';
    if (request.deliveryState === 'COMPLETE') return 'COMPLETE';
    if (request.paymentState === 'OUTCOME_UNKNOWN') return 'OUTCOME_UNKNOWN';
    if (request.gatewayFundingState === 'FAILED') return 'FAILED';
    if (request.gatewayFundingState === 'OUTCOME_UNKNOWN') return 'RAIL_OUTCOME_UNKNOWN';
    return request.paymentState ?? 'PREPARED';
  }
  if (request.deliveryState === 'COMPLETE') return 'COMPLETE';
  const unresolved = request.jobOperations.find(({ state }) => state === 'OUTCOME_UNKNOWN' || state === 'FAILED');
  return unresolved?.state ?? request.jobStatus ?? 'PREPARED';
}

function stateTone(state: string): string {
  if (state === 'COMPLETE' || state === 'COMPLETED') return 'complete';
  if (state === 'FAILED') return 'failed';
  if (state.includes('OUTCOME_UNKNOWN')) return 'unknown';
  return 'pending';
}

export function EconomicOperations({
  agents,
  businessSlug,
  offers,
  providerConfigured,
  requests,
}: {
  readonly agents: readonly PurchaseAgentView[];
  readonly businessSlug: string;
  readonly offers: readonly CommerceOfferView[];
  readonly providerConfigured: boolean;
  readonly requests: readonly CommerceRequestView[];
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>(null);
  const purchaseAgents = agents.filter((agent) =>
    agent.status === 'ACTIVE' &&
    agent.runtimeClass === 'OPERATOR_INVOKED' &&
    agent.capabilities.includes('purchase-service') &&
    agent.identityState === 'VERIFIED',
  );
  const endpoint = `/api/product/businesses/${encodeURIComponent(businessSlug)}/commerce`;

  async function prepare(event: FormEvent<HTMLFormElement>, offer: CommerceOfferView): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const key = `prepare:${offer.offerId}`;
    const agentPrincipalId = offer.kind === 'X402_PURCHASE'
      ? String(form.get('agentPrincipalId') ?? '')
      : null;
    const intent = getOrCreateBrowserEconomicIntent(
      window.localStorage,
      {
        agentPrincipalId,
        businessSlug,
        kind: offer.kind,
        offerId: offer.offerId,
      },
      () => crypto.randomUUID(),
    );
    setPendingKey(key);
    setActionState(null);
    try {
      const result = await resultJson(await fetch(endpoint, {
        body: JSON.stringify({
          action: 'PREPARE',
          ...(offer.kind === 'X402_PURCHASE' ? { agentPrincipalId } : {}),
          kind: offer.kind,
          offerId: offer.offerId,
          requestId: intent.requestId,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }));
      setActionState({
        kind: 'success',
        message: typeof result['message'] === 'string' ? result['message'] : 'Economic confirmation persisted.',
      });
      clearBrowserEconomicIntent(window.localStorage, intent);
      startRefresh(() => router.refresh());
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : 'Economic confirmation failed.';
      setActionState({ kind: 'error', message: `${detail} Retry this unchanged confirmation to recover the same request; Inomasa will not create a new intent automatically.` });
    } finally {
      setPendingKey(null);
    }
  }

  async function advance(requestId: string): Promise<void> {
    const key = `advance:${requestId}`;
    setPendingKey(key);
    setActionState(null);
    try {
      const result = await resultJson(await fetch(endpoint, {
        body: JSON.stringify({ action: 'ADVANCE', requestId }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }));
      setActionState({
        kind: 'success',
        message: typeof result['message'] === 'string' ? result['message'] : 'Existing operation advanced.',
      });
      startRefresh(() => router.refresh());
    } catch (error: unknown) {
      setActionState({ kind: 'error', message: error instanceof Error ? error.message : 'Economic operation failed.' });
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <section className="economic-operations" aria-label="Commerce and jobs">
      <div className="commerce-offer-grid">
        {offers.map((offer) => {
          const unavailableAgent = offer.kind === 'X402_PURCHASE' && purchaseAgents.length === 0;
          return (
            <article className="commerce-offer" key={offer.offerId}>
              <div className="commerce-offer__heading">
                <span>{offer.kind === 'X402_PURCHASE' ? 'Instant purchase' : 'Evaluated job'}</span>
                <strong>{offer.amountUsdc} USDC</strong>
              </div>
              <h3>{readable(offer.displayName)}</h3>
              <p>{offer.description}</p>
              <small>{offer.providerDisplayName}{offer.createdByProduct ? ' · activated from Products & Services' : ''}</small>
              <form onSubmit={(event) => void prepare(event, offer)}>
                {offer.kind === 'X402_PURCHASE' ? (
                  <div className="field">
                    <label htmlFor={`agent-${offer.offerId}`}>Bounded purchase Agent</label>
                    <select disabled={unavailableAgent} id={`agent-${offer.offerId}`} name="agentPrincipalId" required>
                      {purchaseAgents.length === 0 ? <option value="">Activate onchain identity for a purchase Agent first</option> : null}
                      {purchaseAgents.map((agent) => <option key={agent.agentPrincipalId} value={agent.agentPrincipalId}>{agent.displayName}</option>)}
                    </select>
                  </div>
                ) : null}
                <label className="economic-confirmation">
                  <input name="confirmed" required type="checkbox" />
                  <span>I confirm exact {offer.amountUsdc} Arc Testnet USDC with common-control test provenance.</span>
                </label>
                <button className="button button--primary" disabled={!providerConfigured || unavailableAgent || pendingKey !== null || isRefreshing} type="submit">
                  {pendingKey === `prepare:${offer.offerId}` ? 'Confirming…' : offer.kind === 'X402_PURCHASE' ? 'Confirm purchase' : 'Confirm job'}
                </button>
              </form>
              <details><summary>Protocol context</summary><p>{offer.transactionShape}. Exact payment, settlement, delivery, and Evidence stay on the accepted kernel path.</p><code>{offer.offerId}</code></details>
            </article>
          );
        })}
      </div>

      {!providerConfigured ? <div className="operational-notice"><strong>Economic provider unavailable.</strong><p>Offers and prior History remain readable, but no provider action can be submitted. No payment or job failure is inferred.</p></div> : null}
      {actionState === null ? null : <p aria-live="polite" className={`operation-message operation-message--${actionState.kind}`}>{actionState.message}</p>}

      <div className="economic-request-list">
        <div className="panel-heading">
          <div><p className="eyebrow">Confirmed activity</p><h3>Persisted operations and outcomes.</h3></div>
          <span>{requests.length} requests</span>
        </div>
        {requests.length === 0 ? <p className="operational-empty">No purchase or funded job has been confirmed from this Business yet.</p> : requests.map((request) => {
          const state = currentState(request);
          const x402Unknown = request.kind === 'X402_PURCHASE' && state === 'OUTCOME_UNKNOWN';
          const railFailed = request.kind === 'X402_PURCHASE' && request.gatewayFundingState === 'FAILED';
          const railUnknown = request.kind === 'X402_PURCHASE' && request.gatewayFundingState === 'OUTCOME_UNKNOWN';
          const railReconciliation = request.kind === 'X402_PURCHASE' && state === 'RAIL_RECONCILIATION';
          const terminal = state === 'FAILED' || state === 'COMPLETE' || state === 'COMPLETED' || x402Unknown;
          const actionLabel = pendingKey === `advance:${request.requestId}`
            ? 'Working…'
            : state === 'COMPLETE' || state === 'COMPLETED'
              ? 'Completed'
              : state === 'FAILED'
                ? 'Failed'
                : x402Unknown
                  ? 'Manual review required'
                  : (request.kind === 'ERC8183_JOB' && state === 'OUTCOME_UNKNOWN') || railUnknown || railReconciliation
                    ? 'Reconcile existing transaction'
                    : 'Continue operation';
          return (
            <article className="economic-request" key={request.requestId}>
              <div className="economic-request__summary">
                <div>
                  <div className="operational-row__title"><strong>{readable(request.offerCapabilityId)}</strong><span className={`economic-state economic-state--${stateTone(state)}`}>{readable(state)}</span></div>
                  <p>{exactUsdc(request.amountMicroUsdc)} · {request.providerDisplayName}</p>
                  <small>{new Date(request.requestedAt).toLocaleString()} · common-control test</small>
                </div>
                <button className="button button--primary" disabled={terminal || pendingKey !== null || isRefreshing || !providerConfigured} onClick={() => void advance(request.requestId)} type="button">
                  {actionLabel}
                </button>
              </div>
              {x402Unknown ? <div className="operation-unknown"><strong>Settlement outcome unknown.</strong><p>The signed exact payment is retained. Inomasa will not submit another settlement blindly.</p></div> : null}
              {railFailed ? <div className="operation-unknown operation-unknown--failed"><strong>Rail preparation failed.</strong><p>Settlement was not attempted and no Revenue or delivery was recorded. Fund the Treasury sufficiently, then confirm a new operation.</p></div> : null}
              <div className="economic-request__facts">
                <div><span>Settlement</span><strong>{readable(request.settlementState)}</strong></div>
                <div><span>{request.kind === 'X402_PURCHASE' ? 'x402 payment' : 'ERC-8183 job'}</span><strong>{readable(request.paymentState ?? request.jobStatus ?? 'prepared')}</strong></div>
                <div><span>Delivery</span><strong>{readable(request.deliveryState ?? 'waiting')}</strong></div>
                <div><span>Rail preparation</span><strong>{readable(request.gatewayFundingState ?? 'not applicable')}</strong></div>
              </div>
              <details className="economic-proof"><summary>Operation and proof details</summary>
                <dl>
                  <div><dt>Obligation</dt><dd><code>{request.obligationId}</code></dd></div>
                  {request.paymentId === null ? null : <div><dt>Payment</dt><dd><code>{request.paymentId}</code></dd></div>}
                  {request.paymentProviderReference === null ? null : <div><dt>Gateway receipt</dt><dd><code>{request.paymentProviderReference}</code></dd></div>}
                  {request.jobId === null ? null : <div><dt>Job</dt><dd><code>{request.jobId}{request.jobProtocolId === null ? '' : ` · Arc job ${request.jobProtocolId}`}</code></dd></div>}
                  {request.settlementTransactionHash === null ? null : <div><dt>Arc settlement</dt><dd><a href={`https://testnet.arcscan.app/tx/${request.settlementTransactionHash}`} rel="noreferrer" target="_blank">View verified transaction ↗</a></dd></div>}
                  {request.deliverySourceReference === null ? null : <div><dt>Delivery source</dt><dd><code>{request.deliverySourceReference}</code></dd></div>}
                </dl>
                {request.jobOperations.length === 0 ? null : <ol className="job-lifecycle">{request.jobOperations.map((operation) => <li key={operation.leg}><span>{readable(operation.leg)}</span><strong>{readable(operation.state)}</strong>{operation.transactionHash === null ? null : <a href={`https://testnet.arcscan.app/tx/${operation.transactionHash}`} rel="noreferrer" target="_blank">ArcScan ↗</a>}</li>)}</ol>}
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
