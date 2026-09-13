'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';

import { formatUsdcAmount, type UsdcMicroAmount } from '../../modules/commerce/money.ts';

interface OfferView {
  readonly alphaShared?: boolean;
  readonly capabilityId: string;
  readonly commerceProtocol: string;
  readonly createdByProduct: boolean;
  readonly description: string;
  readonly offerId: string;
  readonly priceMicroUsdc: string;
  readonly status: string;
}

interface AgentView {
  readonly agentPrincipalId: string;
  readonly capabilities: readonly string[];
  readonly displayName: string;
  readonly identityId: string | null;
  readonly identityState: string | null;
  readonly role: string;
  readonly runtimeClass: string;
  readonly status: string;
}

interface TreasuryView {
  readonly accountAssurance: string;
  readonly accountType: string;
  readonly address: string | null;
  readonly blockchain: string;
  readonly custodyModel: string;
  readonly provider: string;
  readonly status: string;
}

type ActionState = { readonly kind: 'error' | 'success'; readonly message: string } | null;

function usdc(value: string): string {
  return formatUsdcAmount(BigInt(value) as UsdcMicroAmount) + ' USDC';
}

async function resultJson(response: Response): Promise<Record<string, unknown>> {
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof result['error'] === 'string' ? result['error'] : 'The operation did not complete.');
  }
  return result;
}

export function OperationalWorkspace({
  agents,
  businessSlug,
  offers,
  providerConfigured,
  treasury,
}: {
  readonly agents: readonly AgentView[];
  readonly businessSlug: string;
  readonly offers: readonly OfferView[];
  readonly providerConfigured: boolean;
  readonly treasury: TreasuryView | null;
}) {
  const router = useRouter();
  const [productState, setProductState] = useState<ActionState>(null);
  const [agentState, setAgentState] = useState<ActionState>(null);
  const [treasuryState, setTreasuryState] = useState<ActionState>(null);
  const [productPending, setProductPending] = useState(false);
  const [agentPending, setAgentPending] = useState(false);
  const [treasuryPending, setTreasuryPending] = useState(false);
  const [productRefreshing, startProductRefresh] = useTransition();
  const [agentRefreshing, startAgentRefresh] = useTransition();
  const [treasuryRefreshing, startTreasuryRefresh] = useTransition();
  const [balance, setBalance] = useState<null | { readonly fundingState: string; readonly value: string }>(null);
  const endpoint = `/api/product/businesses/${encodeURIComponent(businessSlug)}`;

  async function createProduct(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formElement = event.currentTarget;
    setProductPending(true);
    setProductState(null);
    const form = new FormData(formElement);
    try {
      const result = await resultJson(await fetch(`${endpoint}/offers`, {
        body: JSON.stringify({
          description: form.get('description'),
          name: form.get('name'),
          price: form.get('price'),
          protocol: form.get('protocol'),
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }));
      setProductState({
        kind: 'success',
        message: result['created'] === true
          ? 'Draft created. Its delivery path is selected but economic activation remains a later explicit step.'
          : 'This exact draft already exists; no duplicate was created.',
      });
      formElement.reset();
      startProductRefresh(() => router.refresh());
    } catch (error: unknown) {
      setProductState({ kind: 'error', message: error instanceof Error ? error.message : 'Draft creation failed.' });
    } finally {
      setProductPending(false);
    }
  }

  async function manageOffer(offerId: string, action: 'ACTIVATE' | 'RETIRE' | 'SHARE' | 'WITHDRAW'): Promise<void> {
    setProductPending(true);
    setProductState(null);
    try {
      const result = await resultJson(await fetch(`${endpoint}/offers`, {
        body: JSON.stringify({ action, offerId }),
        headers: { 'content-type': 'application/json' },
        method: 'PATCH',
      }));
      setProductState({
        kind: 'success',
        message: action === 'SHARE' ? 'Offer shared with invited Alpha Businesses. Private work remains private.' : action === 'WITHDRAW' ? 'Sharing withdrawn for new purchases. Existing purchases remain deliverable.' : action === 'ACTIVATE'
          ? result['result'] === 'ALREADY_ACTIVE'
            ? 'This offer is already active; no duplicate activation occurred.'
            : 'Offer activated. It is now available to another Business you control through the selected canonical commerce path.'
          : result['result'] === 'ALREADY_RETIRED'
            ? 'Draft was already retired.'
            : 'Draft retired.',
      });
      startProductRefresh(() => router.refresh());
    } catch (error: unknown) {
      setProductState({ kind: 'error', message: error instanceof Error ? error.message : 'Draft update failed.' });
    } finally {
      setProductPending(false);
    }
  }

  async function createAgent(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formElement = event.currentTarget;
    setAgentPending(true);
    setAgentState(null);
    const form = new FormData(formElement);
    try {
      const result = await resultJson(await fetch(`${endpoint}/agents`, {
        body: JSON.stringify({
          capability: form.get('capability'),
          displayName: form.get('displayName'),
          role: form.get('role'),
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }));
      setAgentState({
        kind: 'success',
        message: result['created'] === true
          ? 'Bounded Agent created with operator-invoked runtime. No intelligence provider or wallet authority was implied.'
          : 'This exact bounded Agent already exists; no duplicate was created.',
      });
      formElement.reset();
      startAgentRefresh(() => router.refresh());
    } catch (error: unknown) {
      setAgentState({ kind: 'error', message: error instanceof Error ? error.message : 'Agent creation failed.' });
    } finally {
      setAgentPending(false);
    }
  }

  async function operateAgentIdentity(agent: AgentView): Promise<void> {
    setAgentPending(true);
    setAgentState(null);
    const action = agent.identityId === null ? 'PREPARE_IDENTITY' : 'ADVANCE_IDENTITY';
    try {
      const result = await resultJson(await fetch(`${endpoint}/agents`, {
        body: JSON.stringify({ action, agentPrincipalId: agent.agentPrincipalId }),
        headers: { 'content-type': 'application/json' },
        method: 'PATCH',
      }));
      setAgentState({
        kind: 'success',
        message: typeof result['message'] === 'string' ? result['message'] : 'Agent identity state updated.',
      });
      startAgentRefresh(() => router.refresh());
    } catch (error: unknown) {
      setAgentState({ kind: 'error', message: error instanceof Error ? error.message : 'Agent identity operation failed.' });
    } finally {
      setAgentPending(false);
    }
  }

  function identityLabel(agent: AgentView): string {
    if (agent.identityState === 'VERIFIED') return 'Onchain identity: Active';
    if (agent.identityState === 'OUTCOME_UNKNOWN') return 'Onchain identity: Outcome unknown';
    if (agent.identityState === null) return 'Onchain identity: Not active';
    if (agent.identityState === 'REGISTER_AUTHORIZED') return 'Onchain identity: Prepared';
    return 'Onchain identity: Activation in progress';
  }

  async function operateTreasury(action: 'CHECK_BALANCE' | 'PROVISION'): Promise<void> {
    setTreasuryPending(true);
    setTreasuryState(null);
    try {
      const result = await resultJson(await fetch(`${endpoint}/treasury`, {
        body: JSON.stringify({ action }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }));
      const value = typeof result['balanceUsdc'] === 'string' ? result['balanceUsdc'] : '0.000000';
      const fundingState = typeof result['fundingState'] === 'string' ? result['fundingState'] : 'UNKNOWN';
      setBalance({ fundingState, value });
      setTreasuryState({
        kind: 'success',
        message: fundingState === 'FUNDED'
          ? `Treasury has ${value} Arc Testnet USDC.`
          : 'Treasury is connected and waiting for Arc Testnet USDC. No funding success was inferred.',
      });
      startTreasuryRefresh(() => router.refresh());
    } catch (error: unknown) {
      setTreasuryState({ kind: 'error', message: error instanceof Error ? error.message : 'Treasury operation failed.' });
    } finally {
      setTreasuryPending(false);
    }
  }

  async function copyAddress(): Promise<void> {
    if (treasury?.address === null || treasury?.address === undefined) return;
    try {
      await navigator.clipboard.writeText(treasury.address);
      setTreasuryState({ kind: 'success', message: 'Treasury address copied.' });
    } catch {
      setTreasuryState({ kind: 'error', message: 'Copy was unavailable. Select the address manually.' });
    }
  }

  const activeOffers = offers.filter(({ status }) => status !== 'RETIRED');
  const activeAgents = agents.filter(({ status }) => status === 'ACTIVE');

  return (
    <section className="operational-stack" aria-label="Operational Workspace">
      <article className="workspace-panel operational-panel" id="products">
        <div className="panel-heading">
          <div><p className="eyebrow">Products & Services</p><h2>Define what this Business offers.</h2></div>
          <span>{productRefreshing ? 'Updating…' : `${activeOffers.length} current`}</span>
        </div>
        <p className="panel-description">Create a priced draft, then activate it explicitly. An active offer becomes available to another Business you control through the selected canonical testnet commerce path; creation alone never makes it purchasable. You can explicitly share an active instant resource with other invited Alpha Businesses.</p>
        <div className="operational-list">
          {productRefreshing ? <p aria-live="polite" className="operational-empty">Updating Products &amp; Services…</p> : offers.length === 0 ? <p className="operational-empty">No Product or Service draft exists yet.</p> : offers.map((offer) => (
            <div className="operational-row" key={offer.offerId}>
              <div>
                <div className="operational-row__title"><strong>{offer.capabilityId.replaceAll('-', ' ')}</strong><span>{offer.status}</span></div>
                <p>{offer.description}</p>
                <small>{usdc(offer.priceMicroUsdc)} · {offer.commerceProtocol === 'X402' ? 'Instant resource' : offer.commerceProtocol === 'ERC8183' ? 'Evaluated work' : 'Direct settlement'}</small>
              </div>
              {offer.createdByProduct && offer.status==='ACTIVE' && offer.commerceProtocol==='X402'?<button type="button" className="button button--secondary" disabled={productPending||productRefreshing} onClick={()=>void manageOffer(offer.offerId,offer.alphaShared?'WITHDRAW':'SHARE')}>{offer.alphaShared?'Withdraw Alpha sharing':'Share with Alpha Businesses'}</button>:null}
              {offer.createdByProduct && offer.status === 'DRAFT' ? (
                <div className="operational-row__actions">
                  <button className="button button--primary" disabled={productPending || productRefreshing} onClick={() => void manageOffer(offer.offerId, 'ACTIVATE')} type="button">Activate offer</button>
                  <button className="button button--quiet" disabled={productPending || productRefreshing} onClick={() => void manageOffer(offer.offerId, 'RETIRE')} type="button">Retire draft</button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <details className="operational-create">
          <summary>Add Product or Service</summary>
          <form onSubmit={(event) => void createProduct(event)}>
            <div className="form-fields form-fields--compact">
              <div className="field"><label htmlFor="offer-name">Name</label><input id="offer-name" maxLength={120} name="name" placeholder="Commerce readiness brief" required /></div>
              <div className="field"><label htmlFor="offer-description">What is delivered?</label><textarea id="offer-description" maxLength={500} name="description" placeholder="A scoped brief with a reviewable deliverable." required /></div>
              <div className="operational-field-grid">
                <div className="field"><label htmlFor="offer-price">Price in USDC</label><input id="offer-price" inputMode="decimal" name="price" pattern="[0-9]+(?:\.[0-9]{1,6})?" placeholder="0.050000" required /></div>
                <div className="field"><label htmlFor="offer-protocol">Delivery shape</label><select defaultValue="X402" id="offer-protocol" name="protocol"><option value="X402">Instant resource</option><option value="ERC8183">Evaluated work</option></select></div>
              </div>
            </div>
            {productState === null ? null : <p aria-live="polite" className={`operation-message operation-message--${productState.kind}`}>{productState.message}</p>}
            <div className="form-submit-row"><p>Saved to the existing canonical offer catalog as a controller-attributable draft.</p><button className="button button--primary" disabled={productPending || productRefreshing} type="submit">{productPending ? 'Saving…' : productRefreshing ? 'Updating…' : 'Create draft'}</button></div>
          </form>
        </details>
      </article>

      <article className="workspace-panel operational-panel" id="agents">
        <div className="panel-heading">
          <div><p className="eyebrow">Agents</p><h2>Add bounded operating capacity.</h2></div>
          <span>{agentRefreshing ? 'Updating…' : `${activeAgents.length} active`}</span>
        </div>
        <p className="panel-description">Create an Agent for one clear role and capability. It runs only when you invoke it; identity, intelligence, money access, and broader authority are not added automatically.</p>
        <div className="operational-list">
          {agentRefreshing ? <p aria-live="polite" className="operational-empty">Updating Agents…</p> : agents.length === 0 ? <p className="operational-empty">No Agent is assigned to this Business.</p> : agents.map((agent) => (
            <div className="operational-row" key={agent.agentPrincipalId}>
              <div>
                <div className="operational-row__title"><strong>{agent.displayName}</strong><span>{agent.status}</span></div>
                <p>{agent.role.replaceAll('_', ' ').toLowerCase()} · {agent.capabilities.join(' · ')}</p>
                <small>{agent.runtimeClass.replaceAll('_', ' ')} · {identityLabel(agent)} · Intelligence not configured</small>
                {agent.identityId === null ? null : <details className="agent-identity-detail"><summary>Identity details</summary><code>{agent.identityId}</code><span>ERC-8004 · Arc Testnet · execution account remains separate</span></details>}
              </div>
              {agent.capabilities.includes('purchase-service') && agent.identityState !== 'VERIFIED' && agent.identityState !== 'FAILED' ? (
                <button className="button button--quiet" disabled={agentPending || agentRefreshing || treasury?.status !== 'ACTIVE'} onClick={() => void operateAgentIdentity(agent)} type="button">
                  {agent.identityId === null ? 'Prepare onchain identity' : agent.identityState === 'OUTCOME_UNKNOWN' ? 'Review identity outcome' : 'Continue identity activation'}
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <details className="operational-create">
          <summary>Add bounded Agent</summary>
          <form onSubmit={(event) => void createAgent(event)}>
            <div className="form-fields form-fields--compact">
              <div className="field"><label htmlFor="agent-name">Agent name</label><input id="agent-name" maxLength={120} name="displayName" placeholder="Research Operator" required /></div>
              <div className="operational-field-grid">
                <div className="field"><label htmlFor="agent-role">Business role</label><select defaultValue="OPERATIONS_AGENT" id="agent-role" name="role"><option value="OPERATIONS_AGENT">Operations</option><option value="COMMERCE_AGENT">Commerce</option><option value="RESEARCH_AGENT">Research</option></select></div>
                <div className="field"><label htmlFor="agent-capability">One bounded capability</label><select defaultValue="operate-service" id="agent-capability" name="capability"><option value="operate-service">Operate service</option><option value="deliver-service">Deliver service</option><option value="research">Research</option><option value="purchase-service">Purchase service</option></select></div>
              </div>
            </div>
            {agentState === null ? null : <p aria-live="polite" className={`operation-message operation-message--${agentState.kind}`}>{agentState.message}</p>}
            <div className="form-submit-row"><p>This action creates the bounded Agent only. It does not grant a wallet, spending authority, hosted runtime, or intelligence provider.</p><button className="button button--primary" disabled={agentPending || agentRefreshing} type="submit">{agentPending ? 'Creating…' : agentRefreshing ? 'Updating…' : 'Create Agent'}</button></div>
          </form>
        </details>
      </article>

      <article className="workspace-panel operational-panel" id="treasury">
        <div className="panel-heading">
          <div><p className="eyebrow">Treasury & funding</p><h2>Connect the Business execution account.</h2></div>
          <span>{treasuryRefreshing ? 'UPDATING…' : treasury?.status ?? 'UNBOUND'}</span>
        </div>
        <div className="treasury-separation">
          <div><span>Business Treasury</span><strong>{treasury?.provider ?? 'Not connected'} · {treasury?.accountType ?? 'No account'}</strong></div>
          <div><span>Custody / assurance</span><strong>{treasury === null ? 'Not configured' : `${treasury.custodyModel.replaceAll('_', ' ')} · ${treasury.accountAssurance.replaceAll('_', ' ')}`}</strong></div>
          <div><span>Agent execution account</span><strong>Not granted</strong></div>
          <div><span>Customer / Capital accounts</span><strong>Separate</strong></div>
        </div>
        {treasury?.address === null || treasury?.address === undefined ? null : (
          <div className="treasury-address"><span>Arc Testnet address</span><code>{treasury.address}</code><button className="button button--quiet" onClick={() => void copyAddress()} type="button">Copy address</button></div>
        )}
        {balance === null ? null : <div className="funding-balance"><span>Observed balance</span><strong>{balance.value} USDC</strong><small>{balance.fundingState.replaceAll('_', ' ')}</small></div>}
        {!providerConfigured ? (
          <div className="operational-notice"><strong>Circle provider not configured.</strong><p>The Business and pending Treasury binding remain valid. Provisioning and balance checks are unavailable; no wallet failure is claimed.</p></div>
        ) : treasury?.status === 'PENDING' ? (
          <div className="funding-actions"><div><strong>Step 1 · Provision Treasury</strong><p>Create the reviewed Circle Developer-Controlled EOA binding for this Business. The provider call is idempotent.</p></div><button className="button button--primary" disabled={treasuryPending || treasuryRefreshing} onClick={() => void operateTreasury('PROVISION')} type="button">{treasuryPending ? 'Connecting…' : treasuryRefreshing ? 'Updating…' : 'Connect Treasury'}</button></div>
        ) : (
          <div className="funding-actions"><div><strong>Fund with Arc Testnet USDC</strong><p>Use the copied address with an approved testnet source, then check the exact provider-observed balance. Testnet value is never represented as Production funds.</p><a className="text-link" href="https://docs.arc.network/app-kit/quickstarts/bridge-tokens-across-blockchains" rel="noreferrer" target="_blank">Official Arc testnet funding guide ↗</a></div><button className="button button--primary" disabled={treasuryPending || treasuryRefreshing} onClick={() => void operateTreasury('CHECK_BALANCE')} type="button">{treasuryPending ? 'Checking…' : treasuryRefreshing ? 'Updating…' : 'Check balance'}</button></div>
        )}
        {treasuryState === null ? null : <p aria-live="polite" className={`operation-message operation-message--${treasuryState.kind}`}>{treasuryState.message}</p>}
      </article>
    </section>
  );
}
