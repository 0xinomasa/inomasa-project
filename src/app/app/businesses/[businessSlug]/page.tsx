import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireProductSession } from '../../../_auth/server';
import { loadBusinessAgents, loadBusinessSite } from '../../../_business/site';
import { loadBusinessEconomicHistory } from '../../../_economic-history/data';
import { EconomicActivityList } from '../../../_components/economic-activity-list';
import { OperationalWorkspace } from '../../../_components/operational-workspace';
import { ProductShell } from '../../../_components/product-shell';
import { loadOperationalWorkspace } from '../../../_operational/data';

export const dynamic = 'force-dynamic';

type WorkspaceProps = { readonly params: Promise<{ businessSlug: string }> };

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
  const [site, agents, history, operational] = await Promise.all([
    loadBusinessSite(businessSlug, session.principalId),
    loadBusinessAgents(businessSlug, session.principalId),
    loadBusinessEconomicHistory(businessSlug, session.principalId),
    loadOperationalWorkspace(businessSlug, session.principalId),
  ]);
  if (site === undefined) notFound();
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
            <h2>Operate this Business from its context.</h2>
            <p>Create the offer catalog and bounded operating capacity, connect the Business Treasury, then inspect economic outcomes from the same workspace.</p>
          </div>
          <div className="business-facts">
            <div><span>Control</span><strong>YOU</strong></div>
            <div><span>Treasury</span><strong>{statusText('Treasury', site.treasuryStatus)}</strong></div>
            <div><span>Site</span><strong>{statusText('Site', site.siteStatus)}</strong></div>
            <div><span>Visibility</span><strong>{site.visibility.replaceAll('_', ' ')}</strong></div>
          </div>
        </section>

        {operational.state === 'CONNECTED' ? (
          <OperationalWorkspace
            agents={agents}
            businessSlug={businessSlug}
            offers={operational.offers}
            providerConfigured={operational.providerConfigured}
            treasury={operational.treasury}
          />
        ) : (
          <section className="state-card state-card--error" id="products">
            <strong>Operational Workspace {operational.state.replaceAll('_', ' ').toLowerCase()}.</strong>
            <p>No empty or successful operating state is inferred. Existing Business control and kernel facts remain unchanged.</p>
          </section>
        )}

        <section className="workspace-panel commerce-preview" id="commerce">
          <div className="panel-heading"><div><p className="eyebrow">Commerce & Jobs</p><h2>Economic actions remain confirmation-gated.</h2></div><span>Kernel connected</span></div>
          <div className="panel-empty"><strong>Human-triggered purchase and job execution starts in Work 3.</strong><p>Work 2 prepares the controller-scoped offers, bounded Agents, and Treasury state without introducing a simulation or second economic path.</p><span>Next operating dependency</span></div>
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
