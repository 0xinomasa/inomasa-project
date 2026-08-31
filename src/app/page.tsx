import type { Metadata } from 'next';
import Link from 'next/link';

import { loadLiveEconomy } from './_live-economy/data';
import { Mark } from './_components/mark';
import { PathCard } from './_components/path-card';
import { productPaths } from './_shell/model';
import { businessTemplates } from '../modules/business/templates';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  description: 'Inomasa is a Business-first economic operating surface on Arc Testnet.',
  title: 'Inomasa · Controlled Alpha',
};

function observedLabel(value: string): string {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function protocolLabel(protocol: string): string {
  if (protocol === 'ARC_USDC') return 'Arc · USDC';
  if (protocol === 'ERC_8004') return 'ERC-8004';
  if (protocol === 'ERC_8183') return 'ERC-8183';
  return protocol.toLowerCase();
}

export default async function LandingPage() {
  const economy = await loadLiveEconomy();
  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link aria-label="Inomasa home" className="brand" href="/">
          <Mark />
          <span>INOMASA</span>
        </Link>
        <nav aria-label="Landing navigation" className="landing-nav">
          <Link href="/build">Build</Link>
          <Link href="/migrate">Migrate</Link>
          <Link href="/capital">Capital</Link>
          <a href="#economy">Live Economy</a>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero__copy">
          <p className="eyebrow">Business · Agent · USDC · Arc</p>
          <h1>Make a Business.<br /><span>Let value move.</span></h1>
          <p className="landing-lede">
            Inomasa is a Business-first operating surface for digital work, bounded Agents,
            USDC commerce, settlement, Capital, and an Economic History you can inspect.
          </p>
          <div className="landing-actions">
            <Link className="button button--primary" href="/build">Build your business <span>↗</span></Link>
            <a className="button button--secondary" href="#paths">Explore the three paths <span>↓</span></a>
          </div>
          <p className="landing-scope">Protected Preview · Arc Testnet · Human Product Alpha in realization</p>
        </div>
        <aside className="landing-status-card" aria-label="Inomasa status">
          <div className="landing-status-card__topline"><span className="status-dot" /><span>System status</span></div>
          <div className="landing-status-row"><span>Economic kernel</span><strong>VERIFIED</strong></div>
          <div className="landing-status-row"><span>Product Alpha</span><strong>IN REALIZATION</strong></div>
          <div className="landing-status-row"><span>Network</span><strong>ARC TESTNET</strong></div>
          <div className="landing-status-row"><span>Access</span><strong>PROTECTED</strong></div>
        </aside>
      </section>

      <section className="landing-paths" id="paths">
        <div className="landing-section-heading">
          <div><p className="eyebrow">Choose your path</p><h2>Start where the work is.</h2></div>
          <p>Each path keeps its own boundary. BUILD is the current creation entry; MIGRATE stays locked; Capital shows only the controlled provider context that exists.</p>
        </div>
        <div className="landing-path-grid">
          {productPaths.map((path, index) => <PathCard key={path.id} path={path} position={`0${index + 1}`} />)}
        </div>
      </section>

      <section className="landing-economy" id="economy">
        <div className="landing-section-heading">
          <div><p className="eyebrow">Live Economy · observer-safe</p><h2>A small economy, visibly moving.</h2></div>
          <p>
            Recent testnet activity, summarized from each accepted Business record. Protocol labels remain visible without turning the landing page into an explorer.
            {economy.state === 'CONNECTED' && economy.cards.length > 6 ? <><br /><Link className="quiet-link" href="/system">View all activity →</Link></> : null}
          </p>
        </div>
        {economy.state === 'UNAVAILABLE' ? (
          <article className="live-economy-state live-economy-state--error"><strong>Live Economy unavailable</strong><p>The canonical read model did not return a trustworthy result. No zero activity is inferred.</p></article>
        ) : economy.state === 'NOT_CONFIGURED' ? (
          <article className="live-economy-state"><strong>Live Economy is waiting for the protected runtime</strong><p>Once the approved local or private Arc Testnet runtime is connected, observer-safe activity will appear here.</p></article>
        ) : economy.cards.length === 0 ? (
          <article className="live-economy-state"><strong>No observable activity yet</strong><p>The connected canonical source returned a valid empty result.</p></article>
        ) : (
          <div aria-label="Latest economic activity" className="live-economy-list">
            {economy.cards.slice(0, 6).map((card) => (
              <article className="live-economy-row" key={card.id}>
                <time dateTime={card.observedAt.toISOString()}>{observedLabel(card.observedAt.toISOString())} UTC</time>
                <div className="live-economy-row__activity">
                  <strong>{card.label}</strong>
                  <span className={'activity-status activity-status--' + card.status.toLowerCase()}>{card.status.replaceAll('_', ' ')}</span>
                  <small>{card.detail}</small>
                  <span className="live-economy-row__protocols" aria-label="Protocols used">
                    {card.protocols.map((protocol) => <span key={protocol}>{protocolLabel(protocol)}</span>)}
                  </span>
                </div>
                <strong className="live-economy-row__amount">{card.amount} USDC</strong>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="landing-build" id="build-templates">
        <div className="landing-section-heading">
          <div><p className="eyebrow">BUILD · four starting points</p><h2>Begin with the work you know.</h2></div>
          <p>Select a starting structure, then grow into the shared Business capability set. A template is not a permanent silo.</p>
        </div>
        <div className="landing-template-grid">
          {businessTemplates.map((template, index) => (
            <article className="landing-template-card" key={template.templateId}>
              <span className="template-number">0{index + 1}</span>
              <h3>{template.label}</h3>
              <p>{template.description}</p>
              <span className="template-capabilities">{template.capabilities.join(' · ').replaceAll('_', ' ')}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-principles">
        <div><p className="eyebrow">Under the surface</p><h2>Familiar workspaces.<br /><span>Inspectable economics.</span></h2></div>
        <div className="landing-principle-list">
          <article><span>01</span><div><strong>Business stays central.</strong><p>People, Agents, wallets, and protocols participate in a Business context without becoming the same object.</p></div></article>
          <article><span>02</span><div><strong>Authority stays bounded.</strong><p>Agent identity, capability, runtime, and economic authority remain explicit and separate.</p></div></article>
          <article><span>03</span><div><strong>History stays honest.</strong><p>Settlement, jobs, Capital, Evidence, and provenance show what happened without overstating what it means.</p></div></article>
        </div>
      </section>

      <footer className="landing-footer">
        <Link aria-label="Inomasa home" className="brand" href="/"><Mark /><span>INOMASA</span></Link>
        <p>Kernel verified · Human Product Alpha not verified · No Production authority</p>
      </footer>
    </main>
  );
}
