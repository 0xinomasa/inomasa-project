'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';

import { SignOutButton } from './sign-out-button';

export interface ProductMenuLink {
  readonly active?: boolean;
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
  const drawerId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const containFocus = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (first === undefined || last === undefined) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', containFocus);
    return () => {
      window.removeEventListener('keydown', containFocus);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <div className="mobile-product-menu">
      <button
        aria-controls={drawerId}
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="mobile-menu-trigger"
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <span aria-hidden="true" className="mobile-menu-icon"><i /><i /><i /></span>
        <span>Menu</span>
      </button>
      {open ? (
        <div className="mobile-menu-backdrop" onClick={() => setOpen(false)}>
          <aside
            aria-label="Product menu"
            aria-modal="true"
            className="mobile-menu-drawer"
            id={drawerId}
            onClick={(event) => event.stopPropagation()}
            ref={drawerRef}
            role="dialog"
          >
            <div className="mobile-menu-drawer__heading">
              <div>
                <span className="mobile-menu-drawer__caption">Inomasa</span>
                <strong>{context ?? 'Product navigation'}</strong>
              </div>
              <button aria-label="Close menu" className="mobile-menu-close" onClick={() => setOpen(false)} ref={closeButtonRef} type="button">×</button>
            </div>
            <nav aria-label="Mobile product navigation" className="mobile-menu-links">
              {links.map((link) => (
                <Link
                  aria-current={link.active ? 'page' : undefined}
                  className={`${link.active ? 'is-active ' : ''}${link.locked ? 'is-locked' : ''}`.trim() || undefined}
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
