import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Mark } from '../../_components/mark';
import { loadBusinessSite } from '../../_business/site';
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
  const site = await loadBusinessSite(businessSlug);

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
            Capital is only a structural profile boundary here. Checkpoint B does not implement
            allocation or provider decisions.
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
