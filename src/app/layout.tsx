import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './globals.css';
import './work1.css';

export const metadata: Metadata = {
  description: 'Inomasa controlled Alpha Business operating environment on Arc Testnet.',
  title: 'Inomasa · Controlled Alpha',
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f7f4',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
