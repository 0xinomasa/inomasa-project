import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireProductSession } from '../../../_auth/server';
import { loadBusinessAgents, loadBusinessSite } from '../../../_business/site';
import { loadBusinessEconomicHistory } from '../../../_economic-history/data';
import { EconomicActivityList } from '../../../_components/economic-activity-list';
import { ProductShell } from '../../../_components/product-shell';
import { formatUsdcAmount, type UsdcMicroAmount } from '../../../../modules/commerce/money';

export const dynamic = 'force-dynamic';

type WorkspaceProps = { readonly params: Promise<{ businessSlug: string }> };

function displayUsdc(value: string): string {
  return formatUsdcAmount(BigInt(value) as UsdcMicroAmount) + ' USDC';
}

function statusText(label: string, value: string): string {
  const readable = value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return `${label}: ${readable}`;
}

export async function generateMetadata({ params }: WorkspaceProps): Promise<Metadata> {
  await params;
  return { title: 'Business Workspace · Inomasa' };
}

export default async function BusinessWorkspacePage({ params }: WorkspaceProps) {
  const { businessSlug } = await params;
  const session = await requireProductSession('/app/businesses/' + businessSlug);
  const [site, agents, history] = await Promise.all([
    loadBusinessSite(businessSlug, session.principalId),
    loadBusinessAgents(businessSlug, session.principalId),
    loadBusinessEconomicHistory(businessSlug, session.principalId),
  ]);
  if (site === undefined) notFound();
  const activeOfferCount = site.offers.filter((offer) => offer.status === 'ACTIVE').length;
  const activeAgentCount = agents.filter((agent) => agent.status === 'ACTIVE').length;

  return (
    <ProductShell active="businesses" businessSlug={businessSlug} session={session}>
      <main className="workspace-page workspace-page--business">
        <header className="workspace-header workspace-header--business">
          <div>
            <Link className="quiet-link" href="/app/businesses">← Back to Businesses</Link>
            <p className="eyebrow">{site.entryRoute} · {site.templateId.replaceAll('-', ' ')}</p>
            <h1>{site.displayName}</h1>
            <p>{site.siteDescription}</p>
          </div>
          <div className="workspace-status"><span className="status-dot" /> Workspace active</div>
        </header>

        <section className="workspace-card business-overview-card">
          <div>
            <p className="eyebrow">Overview</p>
            <h2>One place to understand this Business.</h2>
            <p>Products, Agents, Treasury, Commerce & Jobs, History, Capital, Site, and Settings belong to this Business context. Work 1 keeps each area honest about what is available now.</p>
          </div>
          <div className="business-facts">
            <div><span>Control</span><strong>YOU</strong></div>
            <div><span>Treasury</span><strong>{statusText('Treasury', site.treasuryStatus)}</strong></div>
            <div><span>Site</span><strong>{statusText('Site', site.siteStatus)}</strong></div>
            <div><span>Visibility</span><strong>{site.visibility.replaceAll('_', ' ')}</strong></div>
          </div>
        </section>

        <section className="workspace-section-grid">
          <article className="workspace-panel" id="products">
            <div className="panel-heading"><div><p className="eyebrow">Products & Services</p><h2>What this Business offers.</h2></div><span>{activeOfferCount} active</span></div>
            {site.offers.length === 0 ? (
              <div className="panel-empty"><strong>No product or service yet.</strong><p>Product and service management is not available in this Business Alpha slice.</p><span>Not available yet</span></div>
            ) : site.offers.map((offer) => (
              <div className="offer-row" key={offer.offerId}><div><strong>{offer.capabilityId.replaceAll('-', ' ')}</strong><p>{offer.description}</p></div><span>{displayUsdc(offer.priceMicroUsdc)}</span></div>
            ))}
          </article>

          <article className="workspace-panel" id="agents">
            <div className="panel-heading"><div><p className="eyebrow">Agents</p><h2>Bounded capability.</h2></div><span>{activeAgentCount} active</span></div>
            {agents.length === 0 ? (
              <div className="panel-empty"><strong>No Agent assigned yet.</strong><p>Agent management is not available in this Business Alpha slice. Identity and authority remain separate.</p><span>Not available yet</span></div>
            ) : agents.map((agent) => <div className="agent-row" key={agent.agentPrincipalId}><div><strong>{agent.displayName}</strong><p>{agent.capabilities.join(' · ')}</p></div><span>{agent.identityState ?? 'OFFCHAIN ONLY'}</span></div>)}
          </article>

          <article className="workspace-panel" id="treasury">
            <div className="panel-heading"><div><p className="eyebrow">Treasury</p><h2>Money stays attributable.</h2></div><span>{statusText('Treasury', site.treasuryStatus)}</span></div>
            <div className="treasury-state"><strong>{site.treasuryAddress === null ? 'Treasury: Pending' : 'Treasury: Connected'}</strong><p>Business identity is not a wallet. Customer wallet, Agent execution account, and Capital Provider account remain separate.</p><Link className="text-link" href="/capital">View Capital context →</Link></div>
          </article>

          <article className="workspace-panel" id="commerce">
            <div className="panel-heading"><div><p className="eyebrow">Commerce & Jobs</p><h2>Operate through existing rails.</h2></div><span>Kernel connected</span></div>
            <div className="panel-empty"><strong>Commerce and job actions are not available yet.</strong><p>This workspace keeps the existing economic rails visible without claiming an operation that this slice does not provide.</p><span>Not available yet</span></div>
          </article>
        </section>

        <section className="workspace-panel history-panel" id="history">
          <div className="panel-heading"><div><p className="eyebrow">Economic History</p><h2>What happened in this Business context.</h2></div><span>{history.summary.activityCount} activities</span></div>
          <p className="panel-description">Activities are reconstructed from the accepted kernel. One obligation is counted once; proof remains progressively disclosed.</p>
          <EconomicActivityList activities={history.activities} businessId={site.businessId} emptyMessage="No economic activity exists for this Business yet." />
        </section>
        <section className="workspace-section-grid workspace-section-grid--secondary">
          <article className="workspace-panel" id="site">
            <div className="panel-heading"><div><p className="eyebrow">Site</p><h2>Business presence.</h2></div><span>{statusText('Site', site.siteStatus)}</span></div>
            <div className="panel-empty"><strong>Site publishing is not available yet.</strong><p>Your Business identity and current visibility remain visible here without implying a publishing action.</p><span>Not available yet</span></div>
          </article>
          <article className="workspace-panel" id="settings">
            <div className="panel-heading"><div><p className="eyebrow">Settings</p><h2>Control stays explicit.</h2></div><span>Settings: Read-only</span></div>
            <div className="panel-empty"><strong>Business settings are not editable in this slice.</strong><p>Controller-scoped access and environment boundaries remain enforced by the server.</p><span>Not available yet</span></div>
          </article>
        </section>
      </main>
    </ProductShell>
  );
}
