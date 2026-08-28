import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Mark } from '../../_components/mark';
import { EconomicActivityList } from '../../_components/economic-activity-list';
import { loadBusinessAgents, loadBusinessSite } from '../../_business/site';
import { loadBusinessEconomicHistory } from '../../_economic-history/data';
import { formatUsdcAmount, type UsdcMicroAmount } from '../../../modules/commerce/money';

export const dynamic = 'force-dynamic';

type BusinessSitePageProps = {
  readonly params: Promise<{ businessSlug: string }>;
};

function displayUsdc(amountMicroUsdc: string): string {
  return `${formatUsdcAmount(BigInt(amountMicroUsdc) as UsdcMicroAmount)} USDC`;
}

function compactAddress(address: string | null): string {
  return address === null ? 'NOT BOUND' : `${address.slice(0, 8)}…${address.slice(-6)}`;
}

export async function generateMetadata({ params }: BusinessSitePageProps): Promise<Metadata> {
  const { businessSlug } = await params;
  const site = await loadBusinessSite(businessSlug);

  return site === undefined
    ? { title: 'Business not found · Inomasa' }
    : {
        description: site.siteDescription,
        title: `${site.displayName} · Inomasa`,
      };
}

export default async function BusinessSitePage({ params }: BusinessSitePageProps) {
  const { businessSlug } = await params;
  const [site, agents, history] = await Promise.all([
    loadBusinessSite(businessSlug),
    loadBusinessAgents(businessSlug),
    loadBusinessEconomicHistory(businessSlug),
  ]);

  if (site === undefined) {
    notFound();
  }

  const packageCapabilities = [
    ['Workspace', site.businessPackage.workspace],
    ['Products / Services', site.businessPackage.productsAndServices],
    ['Agents', site.businessPackage.agents],
    ['Treasury', site.businessPackage.treasury],
    ['Commerce / Jobs', site.businessPackage.commerceAndJobs],
    ['Economic History', site.businessPackage.economicHistory],
    ['Capital profile', site.businessPackage.capitalProfile],
    ['Settings', site.businessPackage.settings],
  ] as const;

  return (
    <main className="business-site">
      <header className="site-header">
        <Link aria-label="Inomasa home" className="brand" href="/">
          <Mark />
          <span>INOMASA</span>
        </Link>
        <span className="phase-badge">PROTECTED BUSINESS SITE</span>
      </header>

      <section className="business-site__hero">
        <div>
          <p className="eyebrow">{site.entryRoute} · {site.templateId}</p>
          <h1>{site.headline}</h1>
          <p>{site.siteDescription}</p>
        </div>
        <dl>
          <div><dt>Business</dt><dd>{site.displayName}</dd></div>
          <div><dt>Site state</dt><dd>{site.siteStatus}</dd></div>
          <div><dt>Visibility</dt><dd>{site.visibility.replaceAll('_', ' ')}</dd></div>
          <div><dt>Provenance</dt><dd>{site.actorClassification.replaceAll('_', ' ')}</dd></div>
        </dl>
      </section>

      <section className="business-site__section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Products & services</p>
            <h2>Available from this Business.</h2>
          </div>
          <p>Offers are loaded from Business data. This page is not a separate deployment.</p>
        </div>
        <div className="business-site__offers">
          {site.offers.length === 0 ? (
            <article className="activity-empty">
              <span>CATALOG READY</span>
              <p>No active product or service has been published yet.</p>
            </article>
          ) : (
            site.offers.map((offer) => (
              <article key={offer.offerId}>
                <span>{offer.status}</span>
                <h3>{offer.capabilityId.replaceAll('-', ' ')}</h3>
                <p>{offer.description}</p>
                <strong>{displayUsdc(offer.priceMicroUsdc)}</strong>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="business-site__section business-site__package">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Business Package</p>
            <h2>One reusable operating environment.</h2>
          </div>
          <p>
            Capital remains a structural profile boundary until Checkpoint F; no allocation or
            provider decision is implied here.
          </p>
        </div>
        <div>
          {packageCapabilities.map(([label, status]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{status.replaceAll('_', ' ')}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="business-site__section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Business Agents</p>
            <h2>Roles and capabilities stay attached to their Business.</h2>
          </div>
          <p>
            Agent identity, runtime, and economic permission are separate records. An ERC-8004
            identity is shown only where it has actually been registered.
          </p>
        </div>
        <div className="business-site__agents">
          {agents.length === 0 ? (
            <article className="activity-empty">
              <span>NO ACTIVE AGENT</span>
              <p>This Business has not registered an Agent capability.</p>
            </article>
          ) : (
            agents.map((agent) => (
              <article key={agent.agentPrincipalId}>
                <div>
                  <span>{agent.role.replaceAll('_', ' ')}</span>
                  <strong>{agent.displayName}</strong>
                  <p>{agent.capabilities.join(' · ')}</p>
                </div>
                <div>
                  <span>{agent.identityState ?? 'OFFCHAIN ONLY'}</span>
                  <Link href={`/business/${businessSlug}/agents/${agent.agentPrincipalId}`}>
                    View Agent →
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="business-site__section business-history" id="economic-history">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Business Workspace · Economic History</p>
            <h2>What happened, in this Business context.</h2>
          </div>
          <p>
            Buyer and seller effects remain distinct, while one underlying obligation is counted
            once. Protocol details and scoped proof are available on demand without replacing the
            Business-level interpretation.
          </p>
        </div>
        <div className="observability-summary observability-summary--business">
          <article>
            <span>ACTIVITIES</span>
            <strong>{history.summary.activityCount}</strong>
            <small>{history.state}</small>
          </article>
          <article>
            <span>COMPLETE</span>
            <strong>{history.summary.statusCounts.COMPLETE}</strong>
            <small>RECONSTRUCTED</small>
          </article>
          <article>
            <span>PENDING</span>
            <strong>{history.summary.statusCounts.PENDING}</strong>
            <small>NOT TERMINAL</small>
          </article>
          <article>
            <span>UNKNOWN / FAILED</span>
            <strong>
              {history.summary.statusCounts.OUTCOME_UNKNOWN} / {history.summary.statusCounts.FAILED}
            </strong>
            <small>NEVER COLLAPSED</small>
          </article>
        </div>
        <EconomicActivityList
          activities={history.activities}
          businessId={site.businessId}
          emptyMessage="This Business has no economic activity in the connected environment."
        />
      </section>

      <section className="business-site__treasury">
        <div>
          <p className="eyebrow">Execution capability</p>
          <h2>Treasury remains separate from Business identity.</h2>
        </div>
        <dl>
          <div><dt>Status</dt><dd>{site.treasuryStatus}</dd></div>
          <div><dt>Arc account</dt><dd>{compactAddress(site.treasuryAddress)}</dd></div>
          <div><dt>Business ID</dt><dd>{site.businessId}</dd></div>
        </dl>
      </section>

      <footer>
        <Link className="brand" href="/">
          <Mark />
          <span>BACK TO INOMASA</span>
        </Link>
        <p>Controlled Alpha · Arc Testnet · No Production authority</p>
      </footer>
    </main>
  );
}
