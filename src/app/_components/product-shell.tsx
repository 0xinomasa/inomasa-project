import Link from 'next/link';

import type { ProductSession } from '../../platform/auth/session.ts';
import { Mark } from './mark';
import { SignOutButton } from './sign-out-button';

export function ProductShell({
  session,
  children,
  active,
}: {
  readonly session: ProductSession;
  readonly children: React.ReactNode;
  readonly active: 'dashboard' | 'businesses' | 'build' | 'capital' | 'migrate';
}) {
  return (
    <div className="product-frame">
      <aside className="product-sidebar">
        <Link aria-label="Inomasa home" className="brand" href="/app">
          <Mark />
          <span>INOMASA</span>
        </Link>
        <p className="sidebar-caption">Controlled Alpha</p>
        <nav aria-label="Product navigation" className="product-nav">
          <Link className={active === 'dashboard' ? 'is-active' : ''} href="/app">Dashboard</Link>
          <Link className={active === 'businesses' ? 'is-active' : ''} href="/app/businesses">My Businesses</Link>
          <Link className={active === 'build' ? 'is-active' : ''} href="/build">BUILD</Link>
          <Link className={active === 'capital' ? 'is-active' : ''} href="/capital">Capital</Link>
          <Link className={active === 'migrate' ? 'is-active' : 'is-locked'} href="/migrate">MIGRATE <span>Locked</span></Link>
        </nav>
        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="user-avatar">{session.displayName.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{session.displayName}</strong>
              <small>{session.email}</small>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <div className="product-content">{children}</div>
      <nav aria-label="Mobile product navigation" className="product-mobile-nav">
        <Link className={active === 'dashboard' ? 'is-active' : ''} href="/app">Home</Link>
        <Link className={active === 'businesses' ? 'is-active' : ''} href="/app/businesses">Businesses</Link>
        <Link className={active === 'build' ? 'is-active' : ''} href="/build">Build</Link>
        <Link className={active === 'capital' ? 'is-active' : ''} href="/capital">Capital</Link>
        <Link className={active === 'migrate' ? 'is-active is-locked' : 'is-locked'} href="/migrate">Migrate</Link>
      </nav>
    </div>
  );
}
