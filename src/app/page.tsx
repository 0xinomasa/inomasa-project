import { Mark } from './_components/mark';
import { PathCard } from './_components/path-card';
import { productPaths, shellNavigation } from './_shell/model';

export default function Home() {
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

        <span className="phase-badge">B2 · SKELETON</span>
      </header>

      <section className="hero" id="overview">
        <div className="hero__signal" aria-hidden="true">
          <span>APPLICATION LAYER</span>
          <span>ARC</span>
        </div>

        <div className="hero__content">
          <p className="eyebrow">One operating environment</p>
          <h1>
            Economic work,
            <br />
            <span>structured for action.</span>
          </h1>
          <p className="hero__lede">
            A quiet foundation for people, businesses, and authorized systems to coordinate
            economic activity. This B2 interface is structural only—no economic function is live.
          </p>

          <div className="hero__actions">
            <a className="button button--primary" href="#build">
              Explore the shell <span aria-hidden="true">↗</span>
            </a>
            <a className="button button--secondary" href="#system-state">
              View system state
            </a>
          </div>
        </div>

        <aside aria-label="Application readiness" className="readiness-card">
          <div className="readiness-card__heading">
            <span className="status-dot" />
            <span>Skeleton online</span>
          </div>
          <dl>
            <div>
              <dt>Runtime</dt>
              <dd>Node 22</dd>
            </div>
            <div>
              <dt>Shape</dt>
              <dd>Modular monolith</dd>
            </div>
            <div>
              <dt>Economic state</dt>
              <dd>Not connected</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section aria-labelledby="paths-title" className="paths-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Product structure</p>
            <h2 id="paths-title">Distinct paths. Shared environment.</h2>
          </div>
          <p>
            These labels show future entry boundaries only. They do not create authority, state,
            entitlement, or executable business behavior.
          </p>
        </div>

        <div className="path-grid">
          {productPaths.map((path, index) => (
            <PathCard key={path.id} path={path} position={`0${index + 1}`} />
          ))}
        </div>
      </section>

      <section className="system-state" id="system-state">
        <div className="system-state__copy">
          <p className="eyebrow">System state</p>
          <h2>Nothing is silently active.</h2>
          <p>
            No identity, wallet, capital, agent, evidence, settlement, or external system is
            connected in B2. Later capabilities must cross their own authority and proof gates.
          </p>
        </div>

        <div className="state-list">
          <div>
            <span>01</span>
            <strong>Application shell</strong>
            <em className="state-list__ready">READY</em>
          </div>
          <div>
            <span>02</span>
            <strong>Business capabilities</strong>
            <em>NOT IMPLEMENTED</em>
          </div>
          <div>
            <span>03</span>
            <strong>Economic connectivity</strong>
            <em>NOT CONNECTED</em>
          </div>
        </div>
      </section>

      <footer>
        <a aria-label="Inomasa home" className="brand" href="#overview">
          <Mark />
          <span>INOMASA</span>
        </a>
        <p>B2 Application Skeleton · No production authority</p>
      </footer>

      <nav aria-label="Mobile navigation" className="mobile-nav">
        {shellNavigation.map((item) => (
          <a href={item.href} key={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </main>
  );
}
