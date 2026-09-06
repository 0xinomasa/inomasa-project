import Link from 'next/link';

import type { ProductSession } from '../../platform/auth/session.ts';
import { Mark } from './mark';
import { MobileProductMenu, type ProductMenuLink } from './mobile-product-menu';
import { SignOutButton } from './sign-out-button';

export function ProductShell({
  session,
  children,
  active,
  businessSlug,
}: {
  readonly session: ProductSession;
  readonly children: React.ReactNode;
  readonly active: 'dashboard' | 'businesses' | 'build' | 'capital' | 'migrate';
  readonly businessSlug?: string;
}) {
  const globalLinks: readonly ProductMenuLink[] = [
    { active: active === 'dashboard', href: '/app', label: 'Dashboard' },
    { active: active === 'businesses', href: '/app/businesses', label: 'Businesses' },
    { active: active === 'build', href: '/build', label: 'BUILD' },
    { active: active === 'capital', href: '/capital', label: 'Capital' },
    { active: active === 'migrate', href: '/connect', label: 'CONNECT' },
  ];
  const workspaceLinks: readonly ProductMenuLink[] = businessSlug === undefined ? [] : [
    { href: `/app/businesses/${businessSlug}`, label: 'Overview' },
    { href: `/app/businesses/${businessSlug}#products`, label: 'Products & Services' },
    { href: `/app/businesses/${businessSlug}#agents`, label: 'Agents' },
    { href: `/app/businesses/${businessSlug}#treasury`, label: 'Treasury' },
    { href: `/app/businesses/${businessSlug}#commerce`, label: 'Commerce & Jobs' },
    { href: `/app/businesses/${businessSlug}#history`, label: 'Economic History' },
    { href: `/app/businesses/${businessSlug}#capital`, label: 'Capital' },
    { href: `/app/businesses/${businessSlug}#site`, label: 'Site' },
    { href: `/app/businesses/${businessSlug}#settings`, label: 'Settings' },
  ];
  const menuLinks = businessSlug === undefined ? globalLinks : workspaceLinks;

  return (
    <div className="product-frame">
      <header className="product-topbar">
        <Link aria-label="Inomasa home" className="brand" href="/app">
          <Mark />
          <span>INOMASA</span>
        </Link>
        {businessSlug === undefined ? (
          <nav aria-label="Product navigation" className="product-global-nav">
            {globalLinks.map((link) => (
              <Link
                aria-current={link.active ? 'page' : undefined}
                className={`${(
                  link.active
                ) ? 'is-active ' : ''}${link.locked ? 'is-locked' : ''}`}
                href={link.href}
                key={link.href}
              >
                {link.label}{link.locked ? <span>Locked</span> : null}
              </Link>
            ))}
          </nav>
        ) : (
          <Link className="product-context-back" href="/app/businesses">Businesses</Link>
        )}
        <div className="product-account">
          <div className="user-chip">
            <span className="user-avatar">{session.displayName.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{session.displayName}</strong>
              <small>{session.email}</small>
            </div>
          </div>
          <SignOutButton />
        </div>
        <MobileProductMenu
          {...(businessSlug === undefined ? {} : { context: 'Business workspace' })}
          displayName={session.displayName}
          email={session.email}
          links={menuLinks}
        />
      </header>
      <div className={`product-layout${businessSlug === undefined ? '' : ' product-layout--business'}`}>
        <div className="product-content">{children}</div>
        {businessSlug === undefined ? null : (
          <aside aria-label="Business workspace navigation" className="product-context-nav">
            <p>Workspace</p>
            <nav>
              {workspaceLinks.map((link, index) => (
                <Link className={index === 0 ? 'is-active' : ''} href={link.href} key={link.href}>{link.label}</Link>
              ))}
            </nav>
          </aside>
        )}
      </div>
    </div>
  );
}
