import type { Metadata } from 'next';
import Link from 'next/link';

import { requireProductSession } from '../_auth/server';
import { loadBusinessEconomicHistory } from '../_economic-history/data';
import { loadOwnedBusinesses } from '../_product/data';
import { ProductShell } from '../_components/product-shell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  description: 'Your controlled Inomasa Business workspace.',
  title: 'Dashboard · Inomasa',
};

function statusText(label: string, value: string): string {
  const readable = value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return `${label}: ${readable}`;
}

export default async function ProductDashboardPage() {
  const session = await requireProductSession('/app');
  const owned = await loadOwnedBusinesses(session);
  const firstBusiness = owned.state === 'CONNECTED' ? owned.businesses[0] : undefined;
  const firstBusinessHistory = firstBusiness === undefined
    ? undefined
    : await loadBusinessEconomicHistory(firstBusiness.slug, session.principalId);
  const attentionBusinesses = owned.state === 'CONNECTED'
    ? owned.businesses.filter((business) => business.treasuryStatus !== 'ACTIVE' || business.siteStatus !== 'PUBLISHED')
    : [];
  const nextAction = owned.state === 'NOT_CONFIGURED'
    ? {
      description: 'Business data needs the approved private Alpha PostgreSQL runtime before product operations can begin.',
      href: null,
      label: 'Private Alpha data is not connected',
    }
    : owned.state === 'UNAVAILABLE'
      ? {
        description: 'The authenticated product area is available, but Business data could not be loaded. No empty portfolio is inferred.',
        href: null,
        label: 'Business data is temporarily unavailable',
      }
      : firstBusiness === undefined
        ? {
      description: 'Choose one of the four accepted templates and create a Business you control.',
      href: '/build',
      label: 'Build your first Business',
        }
        : {
          description: 'Open its Workspace to review the current Business state and available context.',
          href: '/app/businesses/' + firstBusiness.slug,
          label: 'Continue ' + firstBusiness.displayName,
        };
  const workspaceStatus = owned.state === 'CONNECTED'
    ? 'Workspace connected · Arc Testnet'
    : owned.state === 'NOT_CONFIGURED'
      ? 'Workspace data not configured'
      : 'Workspace data unavailable';

  return (
    <ProductShell active="dashboard" session={session}>
      <main className="workspace-page">
        <header className="workspace-header workspace-header--welcome">
          <div>
            <p className="eyebrow">Authenticated Product Area</p>
            <h1>Good to see you, {session.displayName}.</h1>
            <p>Your Businesses, agents, money, and economic history will meet in one calm workspace.</p>
          </div>
          <div className="kernel-chip">
            <span className={owned.state === 'CONNECTED' ? 'status-dot' : 'status-dot status-dot--muted'} />
            {workspaceStatus}
          </div>
        </header>

        <section className="workspace-card dashboard-intro">
          <div>
            <p className="eyebrow">Next useful action</p>
            <h2>{nextAction.label}</h2>
            <p>{nextAction.description}</p>
          </div>
          {nextAction.href === null ? null : (
            <Link className="button button--primary" href={nextAction.href}>{firstBusiness === undefined ? 'Open BUILD' : 'Open Workspace'}</Link>
          )}
        </section>

        <section aria-label="Portfolio signals" className="dashboard-signal-grid">
          <article className="dashboard-signal-card">
            <span>Businesses</span>
            <strong>{owned.state === 'CONNECTED' ? owned.businesses.length : '—'}</strong>
            <p>Only Businesses you control appear here.</p>
          </article>
          <article className="dashboard-signal-card">
            <span>Needs attention</span>
            <strong>{owned.state === 'CONNECTED' ? attentionBusinesses.length : '—'}</strong>
            <p>Check the current Treasury and Site status.</p>
          </article>
          <article className="dashboard-signal-card">
            <span>Economic activity</span>
            <strong>{firstBusinessHistory?.state === 'CONNECTED' ? firstBusinessHistory.summary.activityCount : '—'}</strong>
            <p>{firstBusinessHistory?.state === 'UNAVAILABLE' ? 'History is temporarily unavailable.' : 'Business outcomes, counted once per activity.'}</p>
          </article>
          <article className="dashboard-signal-card">
            <span>Agent authority</span>
            <strong>Bounded</strong>
            <p>Agent actions remain scoped to their Business authority.</p>
          </article>
        </section>

        <section className="dashboard-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Your operating context</p>
              <h2>My Businesses</h2>
            </div>
            <Link className="quiet-link" href="/app/businesses">View all</Link>
          </div>
          {owned.state === 'NOT_CONFIGURED' ? (
            <article className="state-card state-card--notice">
              <strong>Private Alpha data is not connected.</strong>
              <p>Authentication works independently, but Business data requires the configured local or private Arc Testnet PostgreSQL runtime.</p>
            </article>
          ) : owned.state === 'UNAVAILABLE' ? (
            <article className="state-card state-card--error">
              <strong>Business data is temporarily unavailable.</strong>
              <p>Nothing is inferred or replaced with sample data. Try again when the private runtime is available.</p>
            </article>
          ) : owned.businesses.length === 0 ? (
            <article className="empty-workspace">
              <span>NO BUSINESS YET</span>
              <h3>Give your first Business a place to work.</h3>
              <p>Choose one of the four BUILD templates and create it with your authenticated Human Principal.</p>
              <Link className="button button--secondary" href="/build">Choose a template</Link>
            </article>
          ) : (
            <div className="business-grid">
              {owned.businesses.slice(0, 4).map((business) => (
              <article className="business-summary-card" key={business.businessId}>
                <span className="card-kicker">{business.templateId.replaceAll('-', ' ')}</span>
                <h3>{business.displayName}</h3>
                <p>{business.summary}</p>
                  <div className="card-meta"><span>{statusText('Treasury', business.treasuryStatus)}</span><span>{statusText('Site', business.siteStatus)}</span></div>
                  <Link className="text-link" href={'/app/businesses/' + business.slug}>Open workspace →</Link>
              </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-section dashboard-guidance">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Your operating context</p>
              <h2>Keep the next step clear.</h2>
            </div>
          </div>
          <p className="dashboard-guidance__copy">My Businesses is your directory. Open a Business to enter its contextual Workspace; global BUILD, Capital, and CONNECT paths stay outside that workspace.</p>
        </section>
      </main>
    </ProductShell>
  );
}
