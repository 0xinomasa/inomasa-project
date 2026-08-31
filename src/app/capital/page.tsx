import type { Metadata } from 'next';

import { requireProductSession } from '../_auth/server';
import { loadCapitalPaths } from '../_capital/data';
import { CapitalPathList } from '../_components/capital-path-list';
import { ProductShell } from '../_components/product-shell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  description: 'Provider-attributable controlled Alpha Capital paths for your Businesses.',
  title: 'Capital · Inomasa',
};

export default async function CapitalPage() {
  const session = await requireProductSession('/capital');
  const capital = await loadCapitalPaths(session.principalId);
  const approved = capital.paths.filter(({ outcome }) => outcome === 'APPROVED').length;
  const completed = capital.paths.filter(({ allocationState }) => allocationState === 'COMPLETE').length;
  const providers = new Set(capital.paths.map(({ providerId }) => providerId)).size;

  return (
    <ProductShell active="capital" session={session}>
      <main className="workspace-page capital-page pathway-page pathway-page--capital">
        <header className="workspace-header capital-page__header">
          <div>
            <p className="eyebrow">Controlled Capital · Arc Testnet</p>
            <h1>Provider decisions for your Businesses.</h1>
            <p>
              Each provider applies its own mandate and bears its own risk. Review decisions,
              authorize an offered allocation, and follow later Business use without treating
              Capital as Revenue, a universal score, or an entitlement.
            </p>
          </div>
          <span className="kernel-chip">{capital.state === 'CONNECTED' ? 'Kernel connected' : capital.state.replaceAll('_', ' ')}</span>
        </header>

        <div className="pathway-cue"><span>Provider reviews</span><span>You accept an offer</span><span>Allocation use stays attributable</span></div>

        <section aria-label="Capital summary" className="capital-summary">
          <article><span>Providers</span><strong>{providers}</strong><p>Independent decisions remain attributable.</p></article>
          <article><span>Approved decisions</span><strong>{approved}</strong><p>Approval does not imply allocation settlement.</p></article>
          <article><span>Completed allocations</span><strong>{completed}</strong><p>Finalized Arc Testnet Capital, separate from Revenue.</p></article>
        </section>

        {capital.state === 'CONNECTED' ? (
          <section className="workspace-panel capital-page__paths">
            <div className="panel-heading">
              <div><p className="eyebrow">Provider paths</p><h2>Decisions, allocations, and later use.</h2></div>
              <span>{capital.paths.length} decisions</span>
            </div>
            <p className="panel-description">
              Only Businesses under your active control appear here. Provider criteria and system
              proof remain available as detail, while actionable state stays visible first.
            </p>
            <CapitalPathList enableAcceptance paths={capital.paths} />
          </section>
        ) : (
          <section className="state-card state-card--error">
            <strong>Capital is {capital.state.replaceAll('_', ' ').toLowerCase()}.</strong>
            <p>No provider decision, allocation, or later use is inferred while persistence is unavailable.</p>
          </section>
        )}
      </main>
    </ProductShell>
  );
}
