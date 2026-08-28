import Link from 'next/link';

import { Mark } from './_components/mark';
import { EconomicActivityList } from './_components/economic-activity-list';
import { loadAlphaDashboard } from './_alpha/dashboard';
import { loadEconomicHistory } from './_economic-history/data';
import { productPaths, shellNavigation } from './_shell/model';
import { formatUsdcAmount, type UsdcMicroAmount } from '../modules/commerce/money';

export const dynamic = 'force-dynamic';

function compactAddress(address: string | null): string {
  return address === null ? 'NOT BOUND' : `${address.slice(0, 8)}…${address.slice(-6)}`;
}

function displayUsdc(amountMicroUsdc: string): string {
  return `${formatUsdcAmount(BigInt(amountMicroUsdc) as UsdcMicroAmount)} USDC`;
}

export default async function Home() {
  const [dashboard, economy] = await Promise.all([
    loadAlphaDashboard(),
    loadEconomicHistory(),
  ]);
  const latestCommerce = dashboard.commerce[0];
  const latestDelivery = dashboard.serviceDeliveries[0];
  const latestX402 = dashboard.x402Payments[0];

  return (
    <main>
      <header className="site-header">
        <a aria-label="Inomasa home" className="brand" href="#overview">
          <Mark />
          <span>INOMASA</span>
        </a>

        <nav aria-label="Primary navigation" className="desktop-nav">
          {shellNavigation.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <span className="phase-badge">ALPHA · CONTROLLED</span>
      </header>

      <section className="alpha-hero" id="overview">
        <div className="alpha-hero__copy">
          <p className="eyebrow">Agentic business on Arc</p>
          <h1>
            A small economy,
            <br />
            <span>with real settlement.</span>
          </h1>
          <p className="hero__lede">
            Two common-control test Businesses are being connected through deterministic terms,
            Circle-compatible Treasury accounts, and Arc Testnet USDC. Software is real; actors
            and value remain explicitly test-classified.
          </p>
        </div>

        <aside aria-label="Alpha proof status" className="proof-card">
          <p className="proof-card__label">Current proof surface</p>
          <dl>
            <div>
              <dt>Business state</dt>
              <dd>{dashboard.persistence}</dd>
            </div>
            <div>
              <dt>Circle adapter</dt>
              <dd>{dashboard.circle.integration}</dd>
            </div>
            <div>
              <dt>Arc settlement</dt>
              <dd>{latestCommerce?.settlementState ?? 'NOT PREPARED'}</dd>
            </div>
            <div>
              <dt>Service output</dt>
              <dd>{latestDelivery?.state ?? 'PENDING SETTLEMENT'}</dd>
            </div>
            <div>
              <dt>Gateway x402</dt>
              <dd>{latestX402?.state ?? 'NOT STARTED'}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="economy-section" id="build">
        <div className="section-heading">
          <div>
            <p className="eyebrow">BUILD · Generic Business System</p>
            <h2>Four starting points. No fixed population.</h2>
          </div>
          <p>
            A template is reusable starting configuration. Each can create many Business
            instances in the same operating environment without a new deployment or code branch.
          </p>
        </div>

        <div className="template-grid">
          {dashboard.templates.map((template, index) => (
            <article key={template.templateId}>
              <span>0{index + 1}</span>
              <p className="eyebrow">{template.templateId}</p>
              <h3>{template.label}</h3>
              <p>{template.description}</p>
              <div>
                {template.capabilities.map((capability) => (
                  <small key={capability}>{capability.replaceAll('_', ' ')}</small>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="economy-section regression-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Regression economy · preserved</p>
            <h2>Verified fixtures stay visible.</h2>
          </div>
          <p>
            Signal Forge and Ops Pilot remain common-control control specimens while the generic
            Business System grows around them. Their accepted settlement proof is not rewritten.
          </p>
        </div>

        <div className="economy-graph">
          {dashboard.fixtureProfiles.map((template, index) => {
            const business = dashboard.businesses.find(
              (candidate) => candidate.templateId === template.templateId,
            );

            return (
              <article className="business-card" key={template.templateId}>
                <div className="business-card__topline">
                  <span>BUSINESS 0{index + 1}</span>
                  <em>{business === undefined ? 'TEMPLATE READY' : 'INSTANCE ACTIVE'}</em>
                </div>
                <h3>{business?.displayName ?? template.defaultName}</h3>
                <p>{template.description}</p>
                <dl>
                  <div>
                    <dt>Template</dt>
                    <dd>{template.templateId}@{template.version}</dd>
                  </div>
                  <div>
                    <dt>Capability</dt>
                    <dd>{template.capabilities[0].capabilityId}</dd>
                  </div>
                  <div>
                    <dt>Treasury</dt>
                    <dd>{business?.treasuryStatus ?? 'NOT CREATED'}</dd>
                  </div>
                  <div>
                    <dt>Arc account</dt>
                    <dd>{compactAddress(business?.address ?? null)}</dd>
                  </div>
                  <div>
                    <dt>Product template</dt>
                    <dd>{template.businessTemplateId}</dd>
                  </div>
                </dl>
                {business === undefined ? null : (
                  <Link className="business-card__link" href={`/business/${business.slug}`}>
                    Open Business Site
                  </Link>
                )}
                <p className="classification-label">COMMON-CONTROL TEST ACTOR</p>
              </article>
            );
          })}

          <div aria-label="Economic dependency" className="dependency-rail">
            <span>ARC MARKET SNAPSHOT</span>
            <strong>USDC OBLIGATION →</strong>
            <span>OPERATIONAL BRIEF</span>
          </div>
        </div>
      </section>

      <section className="business-system-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Business instances</p>
            <h2>Data creates the surface.</h2>
          </div>
          <p>
            One user may control multiple Businesses, and each Business receives a reusable
            package plus a data-driven route inside this application.
          </p>
        </div>
        {dashboard.businesses.length === 0 ? (
          <article className="activity-empty">
            <span>GENERIC CREATION READY</span>
            <p>No Business instance exists in the connected environment.</p>
          </article>
        ) : (
          <div className="business-instance-list">
            {dashboard.businesses.map((business) => (
              <article key={business.businessId}>
                <div>
                  <span>{business.entryRoute} · {business.siteStatus}</span>
                  <h3>{business.displayName}</h3>
                  <p>{business.summary}</p>
                </div>
                <Link href={`/business/${business.slug}`}>View Business Site</Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="activity-section" id="activity">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Home · Economy View</p>
            <h2>Business activity, not a wall of hashes.</h2>
          </div>
          <p>
            Each row reconstructs the Business, Agent when present, service or job, counterparty,
            protocol, outcome, economic meaning, provenance, and scoped proof without counting
            buyer cost and seller revenue as two separate transactions.
          </p>
        </div>
        <div className="observability-summary" aria-label="Economy summary">
          <article>
            <span>ACTIVITIES</span>
            <strong>{economy.summary.activityCount}</strong>
            <small>{economy.state}</small>
          </article>
          <article>
            <span>COMPLETED VOLUME</span>
            <strong>{displayUsdc(economy.summary.completedVolumeMicroUsdc)}</strong>
            <small>ONE COUNT PER OBLIGATION</small>
          </article>
          <article>
            <span>COMPLETE</span>
            <strong>{economy.summary.statusCounts.COMPLETE}</strong>
            <small>TERMINAL + RECONCILED</small>
          </article>
          <article>
            <span>PENDING / UNKNOWN / FAILED</span>
            <strong>
              {economy.summary.statusCounts.PENDING} /{' '}
              {economy.summary.statusCounts.OUTCOME_UNKNOWN} /{' '}
              {economy.summary.statusCounts.FAILED}
            </strong>
            <small>DISTINCT STATES</small>
          </article>
        </div>
        <EconomicActivityList activities={economy.activities} />
        <div className="economy-drilldown">
          <p>Need protocol counts, category totals, and system-wide status drill-down?</p>
          <Link href="/system">Open Founder / System Dashboard →</Link>
        </div>
      </section>

      <section className="evidence-section" id="x402">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Circle Gateway · x402 v2</p>
            <h2>Machine payment, exact authority.</h2>
          </div>
          <p>
            The Agent signs no private key locally. Circle signs one exact EIP-3009 authorization
            after Inomasa locks the offer, counterparty, amount, nonce-bearing payload, and Human
            grant lineage. Gateway settles it without relabeling provider evidence as a direct
            per-payment Arc transaction.
          </p>
        </div>

        <div className="activity-ledger">
          {dashboard.x402Payments.length === 0 ? (
            <article className="activity-empty">
              <span>NOT STARTED</span>
              <p>No x402 payment operation exists in the connected environment.</p>
            </article>
          ) : (
            dashboard.x402Payments.map((payment) => (
              <article key={payment.paymentId}>
                <div>
                  <span>{payment.paymentId}</span>
                  <em>{payment.network}</em>
                </div>
                <strong>{payment.state}</strong>
                <dl>
                  <div><dt>Scheme</dt><dd>x402 v2 · {payment.scheme}</dd></div>
                  <div><dt>Amount</dt><dd>{displayUsdc(payment.amountMicroUsdc)}</dd></div>
                  <div><dt>Facilitator state</dt><dd>{payment.providerState ?? 'NOT HANDED OFF'}</dd></div>
                  <div>
                    <dt>Gateway receipt</dt>
                    <dd>{payment.providerTransactionId ?? 'NOT SETTLED'}</dd>
                  </div>
                  <div>
                    <dt>Funding rail</dt>
                    <dd>{dashboard.gatewayFunding[0]?.state ?? 'NOT FUNDED'}</dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="evidence-section" id="agent-authority">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Bounded agent operation</p>
            <h2>Intelligence requests. Authority decides.</h2>
          </div>
          <p>
            The first buyer Agent has no wallet custody. It may request one exact capability only
            inside a Human-granted, expiring counterparty and USDC allowance envelope.
          </p>
        </div>

        <div className="activity-ledger">
          {dashboard.agentAuthorities.length === 0 ? (
            <article className="activity-empty">
              <span>NOT GRANTED</span>
              <p>No bounded Agent authority exists in the connected environment.</p>
            </article>
          ) : (
            dashboard.agentAuthorities.map((authority) => (
              <article key={authority.grantId}>
                <div>
                  <span>{authority.agentPrincipalId}</span>
                  <em>{authority.runtimeClass.replaceAll('_', ' ')}</em>
                </div>
                <strong>{authority.grantStatus}</strong>
                <dl>
                  <div><dt>Provider of record</dt><dd>{authority.providerOfRecordPrincipalId}</dd></div>
                  <div><dt>Allowed offer</dt><dd>{authority.allowedOfferId}</dd></div>
                  <div><dt>Counterparty</dt><dd>{authority.allowedCounterpartyBusinessId}</dd></div>
                  <div>
                    <dt>Allowance consumed</dt>
                    <dd>
                      {displayUsdc(authority.allowanceConsumedMicroUsdc)} /{' '}
                      {displayUsdc(authority.allowanceTotalMicroUsdc)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="evidence-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Economic state + Evidence</p>
            <h2>Facts stay narrower than conclusions.</h2>
          </div>
          <p>
            Entries appear only after reconciliation. Evidence reports source and coverage; it
            does not silently become Reputation, creditworthiness, or a Capital decision.
          </p>
        </div>

        <div className="evidence-grid">
          <article>
            <div className="evidence-grid__heading">
              <h3>Economic ledger</h3>
              <span>{dashboard.economicEntries.length} ENTRIES</span>
            </div>
            {dashboard.economicEntries.length === 0 ? (
              <p className="empty-state">NO REVENUE OR COST POSTED</p>
            ) : (
              <div className="fact-list">
                {dashboard.economicEntries.map((entry) => (
                  <div key={`${entry.settlementId}-${entry.businessId}-${entry.category}`}>
                    <span>{entry.category.replaceAll('_', ' ')}</span>
                    <strong>{entry.direction} · {displayUsdc(entry.amountMicroUsdc)}</strong>
                    <small>{entry.businessId} · {entry.provenance.replaceAll('_', ' ')}</small>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article>
            <div className="evidence-grid__heading">
              <h3>Observed Evidence</h3>
              <span>{dashboard.evidence.length} FACTS</span>
            </div>
            {dashboard.evidence.length === 0 ? (
              <p className="empty-state">NO VERIFIED SETTLEMENT OR DELIVERY FACT</p>
            ) : (
              <div className="fact-list">
                {dashboard.evidence.map((fact) => (
                  <div key={fact.evidenceId}>
                    <span>{fact.factType.replaceAll('_', ' ')}</span>
                    <strong>{fact.verification.replaceAll('_', ' ')}</strong>
                    <small>{fact.coverage.replaceAll('_', ' ')} · {fact.sourceReference}</small>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="execution-section" id="system-state">
        <div>
          <p className="eyebrow">Execution contract</p>
          <h2>Every effect keeps its meaning.</h2>
        </div>
        <div className="execution-grid">
          <article>
            <span>01</span>
            <h3>Control</h3>
            <p>Business identity, Human controller, and wallet binding remain separate records.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Terms</h3>
            <p>Offer, accepted terms, obligation, and authorization precede any transfer.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Settlement</h3>
            <p>Circle provider state and the selected rail proof reconcile before revenue or cost is posted.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Evidence</h3>
            <p>Facts retain source, coverage, environment, and common-control provenance.</p>
          </article>
        </div>
      </section>

      <section className="network-section">
        <div>
          <p className="eyebrow">Arc Testnet registry</p>
          <h2>Testnet only. Exact by default.</h2>
        </div>
        <dl>
          <div><dt>Chain ID</dt><dd>{dashboard.network.chainId}</dd></div>
          <div><dt>Economic asset</dt><dd>USDC · ERC-20 · 6 decimals</dd></div>
          <div><dt>Gas asset</dt><dd>Native USDC · 18 decimals</dd></div>
          <div><dt>USDC interface</dt><dd>{dashboard.network.usdc.address}</dd></div>
          <div><dt>Treasury profile</dt><dd>Circle Developer-Controlled EOA</dd></div>
          <div><dt>Machine-payment rail</dt><dd>Circle Gateway · x402 v2 exact</dd></div>
          <div><dt>Assurance</dt><dd>PLATFORM-CONTROLLED EXTERNAL</dd></div>
        </dl>
      </section>

      <section className="paths-section">
        <div className="compact-paths">
          {productPaths.map((path) => (
            <article id={path.id} key={path.id}>
              <span>{path.status}</span>
              <h3>{path.label}</h3>
              <p>{path.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <a aria-label="Inomasa home" className="brand" href="#overview">
          <Mark />
          <span>INOMASA</span>
        </a>
        <p>Controlled Alpha · Arc Testnet · No Production authority</p>
      </footer>

      <nav aria-label="Mobile navigation" className="mobile-nav">
        {shellNavigation.map((item) => (
          <a href={item.href} key={item.href}>{item.label}</a>
        ))}
      </nav>
    </main>
  );
}
