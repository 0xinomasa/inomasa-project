'use client';

import Link from 'next/link';
import { useState } from 'react';

import { SignOutButton } from './sign-out-button';

export interface ProductMenuLink {
  readonly href: string;
  readonly label: string;
  readonly locked?: boolean;
}

export function MobileProductMenu({
  context,
  links,
  displayName,
  email,
}: {
  readonly context?: string;
  readonly links: readonly ProductMenuLink[];
  readonly displayName: string;
  readonly email: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-product-menu">
      <button
        aria-controls="product-mobile-drawer"
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="mobile-menu-trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden="true" className="mobile-menu-icon"><i /><i /><i /></span>
        <span>Menu</span>
      </button>
      {open ? (
        <div className="mobile-menu-backdrop" onClick={() => setOpen(false)}>
          <aside
            aria-label="Product menu"
            className="mobile-menu-drawer"
            id="product-mobile-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-menu-drawer__heading">
              <div>
                <span className="mobile-menu-drawer__caption">Inomasa</span>
                <strong>{context ?? 'Product navigation'}</strong>
              </div>
              <button aria-label="Close menu" className="mobile-menu-close" onClick={() => setOpen(false)} type="button">×</button>
            </div>
            <nav aria-label="Mobile product navigation" className="mobile-menu-links">
              {links.map((link) => (
                <Link
                  className={link.locked ? 'is-locked' : undefined}
                  href={link.href}
                  key={link.href}
                  onClick={() => setOpen(false)}
                >
                  <span>{link.label}</span>
                  {link.locked ? <small>Locked</small> : null}
                </Link>
              ))}
            </nav>
            <div className="mobile-menu-account">
              <span className="user-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{displayName}</strong>
                <small>{email}</small>
              </div>
              <SignOutButton />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
