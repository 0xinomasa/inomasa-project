import type { Metadata } from 'next';
import Link from 'next/link';

import { requireProductSession } from '../_auth/server';
import { ProductShell } from '../_components/product-shell';
import { businessTemplates } from '../../modules/business/templates';
import { CreateBusinessForm } from './create-business-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  description: 'Create a Business from one of four reusable Inomasa templates.',
  title: 'BUILD · Inomasa',
};

export default async function BuildPage() {
  const session = await requireProductSession('/build');
  return (
    <ProductShell active="build" session={session}>
      <main className="workspace-page">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">BUILD · Business entry</p>
            <h1>Start with a useful shape.</h1>
            <p>Choose a template, add the minimum context, and create a Business you can operate in one shared environment.</p>
          </div>
          <Link className="quiet-link" href="/app/businesses">Back to My Businesses</Link>
        </header>
        <section className="workspace-card">
          <CreateBusinessForm templates={businessTemplates} />
        </section>
        <p className="scope-note">Templates are starting structures, not permanent silos. MIGRATE remains locked in this Alpha.</p>
      </main>
    </ProductShell>
  );
}
