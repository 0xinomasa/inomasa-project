import Link from 'next/link';

import { requireProductSession } from '../_auth/server';
import { ProductShell } from '../_components/product-shell';

export const dynamic = 'force-dynamic';

export default async function MigratePage() {
  const session = await requireProductSession('/migrate');
  return (
    <ProductShell active="migrate" session={session}>
      <main className="workspace-page pathway-page pathway-page--migrate">
        <header className="workspace-header">
          <div><p className="eyebrow">Business entry · boundary</p><h1>MIGRATE remains locked.</h1><p>Existing Businesses may eventually connect before replacing their systems. That path is not open in this controlled Alpha.</p></div>
          <span className="locked-pill">LOCKED / NOT YET OPEN</span>
        </header>
        <div className="pathway-cue pathway-cue--locked"><span>Connect existing systems</span><span>Preserve source provenance</span><span>Not yet open</span></div>
        <section className="workspace-card locked-card"><strong>No migration action is available.</strong><p>Server-side mutation stays fail-closed even if this screen or its requests are manipulated.</p><Link className="text-link" href="/app">Return to Dashboard →</Link></section>
      </main>
    </ProductShell>
  );
}
