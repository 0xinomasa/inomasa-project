import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireProductSession } from '../../../_auth/server';
import { loadBusinessAgents, loadBusinessSite } from '../../../_business/site';
import { loadCapitalPaths } from '../../../_capital/data';
import { loadBusinessEconomicHistory } from '../../../_economic-history/data';
import { CapitalPathList } from '../../../_components/capital-path-list';
import { EconomicActivityList } from '../../../_components/economic-activity-list';
import { EconomicOperations } from '../../../_components/economic-operations';
import { OperationalWorkspace } from '../../../_components/operational-workspace';
import { ProductShell } from '../../../_components/product-shell';
import { loadProductCommerce } from '../../../_commerce/data';
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
  const [site, agents, history, operational, commerce, capital] = await Promise.all([
    loadBusinessSite(businessSlug, session.principalId),
    loadBusinessAgents(businessSlug, session.principalId),
    loadBusinessEconomicHistory(businessSlug, session.principalId),
    loadOperationalWorkspace(businessSlug, session.principalId),
    loadProductCommerce(businessSlug, session.principalId),
    loadCapitalPaths(session.principalId, businessSlug),
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
          <div className="panel-heading"><div><p className="eyebrow">Commerce & Jobs</p><h2>Confirm and follow real testnet operations.</h2></div><span>{commerce.state === 'CONNECTED' ? 'Kernel connected' : commerce.state.replaceAll('_', ' ')}</span></div>
          <p className="panel-description">Purchase an instant resource or commission evaluated work from a controlled test provider. Every confirmation creates one canonical obligation; exact settlement and delivery appear in Economic History below.</p>
          {commerce.state === 'CONNECTED' ? (
            <EconomicOperations
              agents={agents}
              businessSlug={businessSlug}
              offers={commerce.offers}
              providerConfigured={commerce.providerConfigured}
              requests={commerce.requests}
            />
          ) : (
            <div className="operational-notice"><strong>Commerce is {commerce.state.replaceAll('_', ' ').toLowerCase()}.</strong><p>No empty, paid, or failed state is inferred. Existing kernel records remain unchanged.</p></div>
          )}
        </section>

        <section className="workspace-panel capital-workspace" id="capital">
          <div className="panel-heading">
            <div><p className="eyebrow">Capital</p><h2>Provider decisions in this Business context.</h2></div>
            <span>{capital.state === 'CONNECTED' ? `${capital.paths.length} decisions` : capital.state.replaceAll('_', ' ')}</span>
          </div>
          <p className="panel-description">
            Inspect provider-specific review, authorize an offered controlled allocation, and
            follow any later Business use. Capital remains distinct from customer Revenue.
          </p>
          {capital.state === 'CONNECTED' ? (
            <CapitalPathList enableAcceptance paths={capital.paths} />
          ) : (
            <div className="operational-notice">
              <strong>Capital is {capital.state.replaceAll('_', ' ').toLowerCase()}.</strong>
              <p>No provider or allocation outcome is inferred while the kernel read is unavailable.</p>
            </div>
          )}
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
