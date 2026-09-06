import type { Metadata } from 'next';
import { requireProductSession } from '../_auth/server';
import { ProductShell } from '../_components/product-shell';
import { readBusinessSources } from '../../platform/http/business-source.ts';
import { ConnectBusinessForm } from './connect-business-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'CONNECT · Inomasa', description: 'Connect an existing Business to controlled Arc commerce.' };

export default async function ConnectPage() {
  const session = await requireProductSession('/connect');
  let sources: { sourceId: string; label: string }[] = [];
  let unavailable = false;
  try {
    sources = readBusinessSources().filter((source) => source.controllerPrincipalId === session.principalId)
      .map(({ sourceId, label }) => ({ sourceId, label }));
  } catch { unavailable = true; }
  return (
    <ProductShell active="migrate" session={session}>
      <main className="workspace-page pathway-page pathway-page--migrate">
        <header className="workspace-header"><div><p className="eyebrow">CONNECT · Controlled Alpha</p><h1>Keep your Business. Add Arc commerce.</h1><p>Connect an existing digital Business through its configured data source, then use the same Business operations and Arc payment capabilities.</p></div></header>
        <section className="workspace-card">
          {sources.length > 0 ? <ConnectBusinessForm sources={sources} /> : <div className="operational-notice"><strong>{unavailable ? 'Connection configuration is unavailable.' : 'No Business source is configured for your account yet.'}</strong><p>The controlled Alpha accepts sources registered for an invited account. Arbitrary systems and bulk migration are not available.</p></div>}
        </section>
        <p className="scope-note">A connected description proves where the Business context came from. Payments and service delivery have separate records and must still be completed.</p>
      </main>
    </ProductShell>
  );
}
