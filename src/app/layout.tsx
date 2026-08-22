import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  description: 'Inomasa application skeleton for authorized economic activity.',
  title: 'Inomasa — Application Skeleton',
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#080a09',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
