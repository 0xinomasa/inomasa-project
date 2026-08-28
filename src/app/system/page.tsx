import type { Metadata } from 'next';
import Link from 'next/link';

import { formatUsdcAmount, type UsdcMicroAmount } from '../../modules/commerce/money.ts';
import { activityProtocols, activityStatuses } from '../../modules/economic-history/model.ts';
import { EconomicActivityList } from '../_components/economic-activity-list';
import { Mark } from '../_components/mark';
import { loadEconomicHistory } from '../_economic-history/data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  description: 'Protected Inomasa Alpha system-wide economic observability.',
  title: 'System Dashboard · Inomasa',
};

const protocolLabels = {
  ARC_USDC: 'Arc · USDC',
  ERC_8004: 'ERC-8004',
  ERC_8183: 'ERC-8183',
  X402: 'x402',
} as const;

function displayUsdc(amountMicroUsdc: string): string {
  return `${formatUsdcAmount(BigInt(amountMicroUsdc) as UsdcMicroAmount)} USDC`;
}

export default async function SystemDashboardPage() {
  const economy = await loadEconomicHistory();
  const categories = Object.entries(economy.summary.economicCategoryCounts).sort(
    ([left], [right]) => left.localeCompare(right),
  );

  return (
    <main className="business-site system-dashboard">
      <header className="site-header">
        <Link aria-label="Inomasa home" className="brand" href="/">
          <Mark />
          <span>INOMASA</span>
        </Link>
        <span className="phase-badge">PROTECTED SYSTEM DASHBOARD</span>
      </header>

      <section className="system-dashboard__hero">
        <div>
          <p className="eyebrow">Founder / System observability</p>
          <h1>
            The economy,
            <br />
            <span>without flattened truth.</span>
          </h1>
          <p>
            Counts and volume are reconstructed from one obligation per activity. Protocol,
            provider, chain, application, and provenance facts retain their own source and scope.
          </p>
        </div>
        <dl>
          <div><dt>Persistence</dt><dd>{economy.state}</dd></div>
          <div><dt>Businesses</dt><dd>{economy.inventory.businessCount}</dd></div>
          <div><dt>Agents</dt><dd>{economy.inventory.agentCount}</dd></div>
          <div><dt>Capital Providers</dt><dd>{economy.inventory.capitalProviderCount}</dd></div>
          <div><dt>Activities</dt><dd>{economy.summary.activityCount}</dd></div>
          <div><dt>Evidence facts</dt><dd>{economy.inventory.evidenceCount}</dd></div>
          <div><dt>Service deliveries</dt><dd>{economy.inventory.serviceDeliveryCount}</dd></div>
        </dl>
      </section>

      <section className="business-site__section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Economic state</p>
            <h2>Outcomes remain distinguishable.</h2>
          </div>
          <p>
            `OUTCOME UNKNOWN` is not counted as failure. Refund and rejected/expired job outcomes
            remain terminal context and never become customer revenue.
          </p>
        </div>
        <div className="observability-summary observability-summary--system">
          <article>
            <span>COMPLETED VOLUME</span>
            <strong>{displayUsdc(economy.summary.completedVolumeMicroUsdc)}</strong>
            <small>NO LEDGER DOUBLE-COUNT</small>
          </article>
          <article>
            <span>CAPITAL INFLOW</span>
            <strong>{displayUsdc(economy.summary.completedCapitalVolumeMicroUsdc)}</strong>
            <small>SEPARATE FROM REVENUE</small>
          </article>
          {activityStatuses.map((status) => (
            <article key={status}>
              <span>{status.replaceAll('_', ' ')}</span>
              <strong>{economy.summary.statusCounts[status]}</strong>
              <small>ACTIVITIES</small>
            </article>
          ))}
        </div>
      </section>

      <section className="business-site__section system-dashboard__breakdown">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Protocol + accounting drill-down</p>
            <h2>Usage follows actual activity.</h2>
          </div>
          <p>
            Standards badges and counts appear only when the contextual activity is linked to
            that primitive. Economic effects remain scoped to each Business side.
          </p>
        </div>
        <div className="system-breakdown-grid">
          <article>
            <h3>Protocol participation</h3>
            <dl>
              {activityProtocols.map((protocol) => (
                <div key={protocol}>
                  <dt>{protocolLabels[protocol]}</dt>
                  <dd>{economy.summary.protocolCounts[protocol]}</dd>
                </div>
              ))}
            </dl>
          </article>
          <article>
            <h3>Posted economic effects</h3>
            {categories.length === 0 ? (
              <p>NO POSTED ECONOMIC EFFECT</p>
            ) : (
              <dl>
                {categories.map(([category, count]) => (
                  <div key={category}>
                    <dt>{category.replaceAll('_', ' ')}</dt>
                    <dd>{count}</dd>
                  </div>
                ))}
              </dl>
            )}
          </article>
        </div>
      </section>

      <section className="business-site__section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">System activity drill-down</p>
            <h2>Every count can be inspected.</h2>
          </div>
          <p>
            Open technical proof only when needed. Gateway receipts stay provider references;
            only real Arc transactions and blocks receive ArcScan links.
          </p>
        </div>
        <EconomicActivityList activities={economy.activities} />
      </section>

      <footer>
        <Link className="brand" href="/">
          <Mark />
          <span>BACK TO ECONOMY VIEW</span>
        </Link>
        <p>Controlled Alpha · Arc Testnet · No Production authority</p>
      </footer>
    </main>
  );
}
