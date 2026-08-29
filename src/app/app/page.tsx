import type { Metadata } from 'next';
import Link from 'next/link';

import { requireProductSession } from '../_auth/server';
import { loadOwnedBusinesses } from '../_product/data';
import { ProductShell } from '../_components/product-shell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  description: 'Your controlled Inomasa Business workspace.',
  title: 'Dashboard · Inomasa',
};

export default async function ProductDashboardPage() {
  const session = await requireProductSession('/app');
  const owned = await loadOwnedBusinesses(session);

  return (
    <ProductShell active="dashboard" session={session}>
      <main className="workspace-page">
        <header className="workspace-header workspace-header--welcome">
          <div>
            <p className="eyebrow">Authenticated Product Area</p>
            <h1>Good to see you, {session.displayName}.</h1>
            <p>Your Businesses, agents, money, and economic history will meet in one calm workspace.</p>
          </div>
          <div className="kernel-chip"><span className="status-dot" /> Kernel verified · Product Alpha in realization</div>
        </header>

        <section className="workspace-card dashboard-intro">
          <div>
            <p className="eyebrow">Next useful action</p>
            <h2>Build a Business from a starting point.</h2>
            <p>Four templates are available. After creation, the Business can use the wider Inomasa capability set instead of staying inside a template silo.</p>
          </div>
          <Link className="button button--primary" href="/build">Open BUILD</Link>
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
                  <div className="card-meta"><span>{business.treasuryStatus}</span><span>{business.siteStatus}</span></div>
                  <Link className="text-link" href={'/app/businesses/' + business.slug}>Open workspace →</Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-section capability-overview">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">One Business, many capabilities</p>
              <h2>What your workspace will hold</h2>
            </div>
          </div>
          <div className="capability-grid">
            {[
              ['Products & Services', 'Shape what a Business offers.'],
              ['Agents', 'Assign bounded capability and runtime.'],
              ['Treasury', 'Keep Business funds separate from people and Agents.'],
              ['Commerce & Jobs', 'Use the existing x402 and ERC-8183 paths.'],
              ['Economic History', 'Understand what happened before opening proof.'],
              ['Capital', 'See provider decisions without turning them into Revenue.'],
            ].map(([label, description]) => (
              <article key={label}><strong>{label}</strong><p>{description}</p><span>Next product slice</span></article>
            ))}
          </div>
        </section>
      </main>
    </ProductShell>
  );
}
