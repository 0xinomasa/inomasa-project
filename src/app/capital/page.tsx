import type { Metadata } from 'next';
import Link from 'next/link';

import { loadCapitalPaths } from '../_capital/data';
import { CapitalPathList } from '../_components/capital-path-list';
import { Mark } from '../_components/mark';
import { requireProductSession } from '../_auth/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  description: 'Provider-attributable controlled Alpha Capital paths.',
  title: 'Capital Providers · Inomasa',
};

export default async function CapitalPage() {
  await requireProductSession('/capital');
  const capital = await loadCapitalPaths();
  const approved = capital.paths.filter(({ outcome }) => outcome === 'APPROVED').length;
  const declined = capital.paths.filter(({ outcome }) => outcome === 'DECLINED').length;
  return (
    <main className="business-site system-dashboard">
      <header className="site-header">
        <Link aria-label="Inomasa home" className="brand" href="/"><Mark /><span>INOMASA</span></Link>
        <span className="phase-badge">CONTROLLED CAPITAL · ARC TESTNET</span>
      </header>
      <section className="system-dashboard__hero">
        <div>
          <p className="eyebrow">Provider path · generic CAPITAL</p>
          <h1>Capital is a decision,<br /><span>not a universal score.</span></h1>
          <p>
            Each Provider owns its mandate, risk, decision, and exact terms. A Business must
            accept an approved allocation; testnet Capital never becomes Revenue, creditworthiness,
            entitlement, a loan, or a Production claim.
          </p>
        </div>
        <dl>
          <div><dt>Persistence</dt><dd>{capital.state}</dd></div>
          <div><dt>Providers reviewed</dt><dd>{capital.paths.length}</dd></div>
          <div><dt>Approved</dt><dd>{approved}</dd></div>
          <div><dt>Declined</dt><dd>{declined}</dd></div>
        </dl>
      </section>
      <section className="business-site__section">
        <div className="section-heading">
          <div><p className="eyebrow">Same evidence · provider-specific mandates</p><h2>Different decisions remain attributable.</h2></div>
          <p>Decision material is content-addressed. No result is promoted into a platform-wide reputation or credit score.</p>
        </div>
        <CapitalPathList paths={capital.paths} />
      </section>
      <footer><Link className="brand" href="/"><Mark /><span>BACK TO INOMASA</span></Link><p>Controlled Alpha · Arc Testnet · No Production authority</p></footer>
    </main>
  );
}
