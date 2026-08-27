import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Mark } from '../../../../_components/mark';
import { loadBusinessAgent, loadBusinessSite } from '../../../../_business/site';
import { formatUsdcAmount, type UsdcMicroAmount } from '../../../../../modules/commerce/money';
import { arcTestnet } from '../../../../../platform/arc/config';

export const dynamic = 'force-dynamic';

type AgentPageProps = {
  readonly params: Promise<{ agentId: string; businessSlug: string }>;
};

function compact(value: string | null): string {
  return value === null ? 'NOT RECORDED' : `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const { agentId, businessSlug } = await params;
  const agent = await loadBusinessAgent(businessSlug, agentId);
  return agent === undefined
    ? { title: 'Agent not found · Inomasa' }
    : { title: `${agent.displayName} · Inomasa` };
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { agentId, businessSlug } = await params;
  const [agent, site] = await Promise.all([
    loadBusinessAgent(businessSlug, agentId),
    loadBusinessSite(businessSlug),
  ]);
  if (agent === undefined || site === undefined) notFound();

  return (
    <main className="business-site agent-site">
      <header className="site-header">
        <Link aria-label="Inomasa home" className="brand" href="/">
          <Mark />
          <span>INOMASA</span>
        </Link>
        <span className="phase-badge">PROTECTED AGENT DETAIL</span>
      </header>

      <section className="agent-site__hero">
        <div>
          <p className="eyebrow">
            {agent.role.replaceAll('_', ' ')} · {agent.status}
          </p>
          <h1>{agent.displayName}</h1>
          <p>
            A distinct Agent principal related to {site.displayName}. Its execution account is
            platform-controlled infrastructure, not the Agent or Business identity.
          </p>
        </div>
        <dl>
          <div><dt>Agent principal</dt><dd>{agent.agentPrincipalId}</dd></div>
          <div><dt>Business</dt><dd>{agent.businessId}</dd></div>
          <div><dt>Runtime</dt><dd>{agent.runtimeClass.replaceAll('_', ' ')}</dd></div>
          <div><dt>Software</dt><dd>{agent.softwareVersion}</dd></div>
        </dl>
      </section>

      <section className="business-site__section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Capabilities</p>
            <h2>Explicit operating scope.</h2>
          </div>
          <p>Economic permission remains bounded by separate versioned authority grants.</p>
        </div>
        <div className="agent-site__capabilities">
          {agent.capabilities.map((capability) => <span key={capability}>{capability}</span>)}
        </div>
      </section>

      <section className="business-site__section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ERC-8004 Identity</p>
            <h2>Portable identifier, not a custody claim.</h2>
          </div>
          <p>
            Registry state is independently read from Arc Testnet. Common-control provenance is
            retained and no universal reputation score is inferred.
          </p>
        </div>
        {agent.identity === null ? (
          <article className="activity-empty">
            <span>NOT REGISTERED</span>
            <p>This Agent currently uses only its internal Inomasa principal.</p>
          </article>
        ) : (
          <dl className="agent-site__identity">
            <div><dt>Status</dt><dd>{agent.identity.state}</dd></div>
            <div><dt>Agent ID</dt><dd>{agent.identity.agentId ?? 'PENDING'}</dd></div>
            <div><dt>Agent registry</dt><dd>{agent.identity.agentRegistry ?? 'PENDING'}</dd></div>
            <div><dt>Owner / execution account</dt><dd>{compact(agent.identity.ownerAddress)}</dd></div>
            <div><dt>Identity registry</dt><dd>{compact(agent.identity.identityRegistryAddress)}</dd></div>
            <div><dt>Reputation registry</dt><dd>{compact(agent.identity.reputationRegistryAddress)}</dd></div>
            <div><dt>Provenance</dt><dd>{agent.identity.provenance.replaceAll('_', ' ')}</dd></div>
            <div>
              <dt>Registration transaction</dt>
              <dd>
                {agent.identity.registrationTransactionHash === null ? 'PENDING' : (
                  <a href={`${arcTestnet.explorerUrl}/tx/${agent.identity.registrationTransactionHash}`}>
                    {compact(agent.identity.registrationTransactionHash)}
                  </a>
                )}
              </dd>
            </div>
            <div>
              <dt>Metadata transaction</dt>
              <dd>
                {agent.identity.metadataTransactionHash === null ? 'PENDING' : (
                  <a href={`${arcTestnet.explorerUrl}/tx/${agent.identity.metadataTransactionHash}`}>
                    {compact(agent.identity.metadataTransactionHash)}
                  </a>
                )}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section className="business-site__section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Economic & reputation context</p>
            <h2>Activity first, interpretation later.</h2>
          </div>
          <p>
            Only actions explicitly bound to this ERC-8004 identity appear here. External feedback
            is not fabricated by the common-control operator.
          </p>
        </div>
        <div className="agent-site__actions">
          {agent.recentEconomicActions.length === 0 ? (
            <article className="activity-empty">
              <span>NO IDENTITY-BOUND ACTION</span>
              <p>There is no completed activity eligible for later reputation context.</p>
            </article>
          ) : (
            agent.recentEconomicActions.map((action) => (
              <article key={action.intentId}>
                <span>{action.settlementState ?? 'NOT SETTLED'}</span>
                <strong>
                  {formatUsdcAmount(BigInt(action.amountMicroUsdc) as UsdcMicroAmount)} USDC
                </strong>
                <p>{action.intentId}</p>
                <small>{action.paymentId ?? 'NO PAYMENT'} · {action.provenance}</small>
                <em>External ERC-8004 feedback: NONE RECORDED</em>
              </article>
            ))
          )}
        </div>
      </section>

      <footer>
        <Link className="brand" href={`/business/${businessSlug}`}>
          <Mark />
          <span>BACK TO {site.displayName.toUpperCase()}</span>
        </Link>
        <p>Controlled Alpha · Arc Testnet · Common-control disclosed</p>
      </footer>
    </main>
  );
}
