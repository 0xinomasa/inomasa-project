import type { Metadata } from 'next';
import Link from 'next/link';

import { loadLiveEconomy } from './_live-economy/data';
import { Mark } from './_components/mark';
import { businessTemplates } from '../modules/business/templates';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  description: 'Inomasa is a Business-first economic operating surface on Arc Testnet.',
  title: 'Inomasa · Controlled Alpha',
};

function observedLabel(value: string): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
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
          <a href="#economy">Live Economy</a>
          <a href="#build">BUILD</a>
          <Link className="header-login" href="/login">Sign in</Link>
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
            <Link className="button button--primary" href="/login">Enter protected Preview <span>↗</span></Link>
            <a className="button button--secondary" href="#build">See how BUILD starts <span>↓</span></a>
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

      <section className="landing-economy" id="economy">
        <div className="landing-section-heading">
          <div><p className="eyebrow">Live Economy · observer-safe</p><h2>A small economy, visibly moving.</h2></div>
          <p>These cards are a read-only projection of accepted Economic History and Evidence. They are not a second ledger or synthetic activity feed.</p>
        </div>
        {economy.state === 'UNAVAILABLE' ? (
          <article className="live-economy-state live-economy-state--error"><strong>Live Economy unavailable</strong><p>The canonical read model did not return a trustworthy result. No zero activity is inferred.</p></article>
        ) : economy.state === 'NOT_CONFIGURED' ? (
          <article className="live-economy-state"><strong>Live Economy is waiting for the protected runtime</strong><p>Once the approved local or private Arc Testnet runtime is connected, observer-safe activity will appear here.</p></article>
        ) : economy.cards.length === 0 ? (
          <article className="live-economy-state"><strong>No observable activity yet</strong><p>The connected canonical source returned a valid empty result.</p></article>
        ) : (
          <div className="live-economy-grid">
            {economy.cards.map((card) => (
              <article className="live-economy-card" key={card.id}>
                <div className="live-economy-card__topline"><span className={'activity-status activity-status--' + card.status.toLowerCase()}>{card.status.replaceAll('_', ' ')}</span><time dateTime={card.observedAt.toISOString()}>{observedLabel(card.observedAt.toISOString())} UTC</time></div>
                <h3>{card.label}</h3>
                <p>{card.detail}</p>
                <div className="protocol-badges">{card.protocols.map((protocol) => <span key={protocol}>{protocol.replaceAll('_', ' ')}</span>)}</div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="landing-build" id="build">
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
