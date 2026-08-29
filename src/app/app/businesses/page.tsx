import type { Metadata } from 'next';
import Link from 'next/link';

import { requireProductSession } from '../../_auth/server';
import { loadOwnedBusinesses } from '../../_product/data';
import { ProductShell } from '../../_components/product-shell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  description: 'Businesses controlled by the authenticated Inomasa Human Principal.',
  title: 'My Businesses · Inomasa',
};

function statusText(label: string, value: string): string {
  const readable = value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return `${label}: ${readable}`;
}

export default async function MyBusinessesPage() {
  const session = await requireProductSession('/app/businesses');
  const owned = await loadOwnedBusinesses(session);

  return (
    <ProductShell active="businesses" session={session}>
      <main className="workspace-page">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Business directory</p>
            <h1>My Businesses</h1>
            <p>Only Businesses whose active control record maps to your Human Principal appear here.</p>
          </div>
          <Link className="button button--primary" href="/build">Create Business</Link>
        </header>
        {owned.state !== 'CONNECTED' ? (
          <article className={owned.state === 'UNAVAILABLE' ? 'state-card state-card--error' : 'state-card state-card--notice'}>
            <strong>{owned.state === 'UNAVAILABLE' ? 'Business data is temporarily unavailable.' : 'Private Alpha data is not configured.'}</strong>
            <p>{owned.state === 'UNAVAILABLE' ? 'The server did not return a trustworthy result. No empty success state is shown.' : 'Connect the approved local or private Arc Testnet PostgreSQL runtime before creating a Business.'}</p>
          </article>
        ) : owned.businesses.length === 0 ? (
          <section className="empty-workspace empty-workspace--large">
            <span>START WITH BUILD</span>
            <h2>Your Business list is empty.</h2>
            <p>That is a valid state for a fresh user. Create one Business and it will appear here without a code change.</p>
            <Link className="button button--primary" href="/build">Choose one of four templates</Link>
          </section>
        ) : (
          <section className="business-list">
            {owned.businesses.map((business) => (
              <article className="business-list-row" key={business.businessId}>
                <div>
                  <span className="card-kicker">{business.entryRoute} · {business.templateId.replaceAll('-', ' ')}</span>
                  <h2>{business.displayName}</h2>
                  <p>{business.summary}</p>
                </div>
                <div className="business-list-row__side">
                  <span>{statusText('Treasury', business.treasuryStatus)}</span>
                  <span>{statusText('Site', business.siteStatus)}</span>
                  <Link className="button button--secondary" href={'/app/businesses/' + business.slug}>Open workspace</Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </ProductShell>
  );
}
