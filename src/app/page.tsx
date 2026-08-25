import { Mark } from './_components/mark';
import { loadAlphaDashboard } from './_alpha/dashboard';
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
  const dashboard = await loadAlphaDashboard();
  const latestCommerce = dashboard.commerce[0];
  const latestDelivery = dashboard.serviceDeliveries[0];

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
          </dl>
        </aside>
      </section>

      <section className="economy-section" id="build">
        <div className="section-heading">
          <div>
            <p className="eyebrow">BUILD · Economic graph v1</p>
            <h2>Businesses with a reason to transact.</h2>
          </div>
          <p>
            Signal Forge supplies Arc data. Ops Pilot consumes that capability before producing
            an operational brief. The dependency is versioned and deterministic—no LLM is needed
            to manufacture genesis or authority.
          </p>
        </div>

        <div className="economy-graph">
          {dashboard.templates.map((template, index) => {
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
                </dl>
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

      <section className="activity-section" id="activity">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Economic activity</p>
            <h2>Obligation before revenue.</h2>
          </div>
          <p>
            The Alpha records terms and authorization before a provider transfer. Revenue and
            service cost remain absent until Circle state is reconciled against the exact Arc
            receipt and USDC transfer log.
          </p>
        </div>

        {dashboard.commerce.length === 0 ? (
          <article className="activity-empty">
            <span>NOT PREPARED</span>
            <p>No service obligation exists in the connected environment.</p>
          </article>
        ) : (
          <div className="activity-ledger">
            {dashboard.commerce.map((activity) => (
              <article key={activity.obligationId}>
                <div>
                  <span>{activity.obligationId}</span>
                  <em>{activity.provenance.replaceAll('_', ' ')}</em>
                </div>
                <strong>{displayUsdc(activity.amountMicroUsdc)}</strong>
                <dl>
                  <div><dt>Buyer</dt><dd>{activity.buyerBusinessId}</dd></div>
                  <div><dt>Seller</dt><dd>{activity.sellerBusinessId}</dd></div>
                  <div><dt>Settlement</dt><dd>{activity.settlementState ?? 'NOT CREATED'}</dd></div>
                  <div>
                    <dt>Arc transaction</dt>
                    <dd>
                      {activity.transactionHash === null ? (
                        'NOT OBSERVED'
                      ) : (
                        <a
                          href={`${dashboard.network.explorerUrl}/tx/${activity.transactionHash}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {compactAddress(activity.transactionHash)}
                        </a>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Paid service output</dt>
                    <dd>
                      {dashboard.serviceDeliveries.find(
                        (delivery) => delivery.obligationId === activity.obligationId,
                      )?.state ?? 'PENDING SETTLEMENT'}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
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
            <p>Circle provider state and Arc finality reconcile before revenue or cost is posted.</p>
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
