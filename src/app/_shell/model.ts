export const productPaths = [
  {
    eyebrow: 'Business entry',
    href: '#build',
    id: 'build',
    label: 'BUILD',
    note: 'Application shell available',
    status: 'AVAILABLE',
    summary: 'A future path for creating a new business workspace.',
  },
  {
    eyebrow: 'Business entry',
    href: '#migrate',
    id: 'migrate',
    label: 'MIGRATE',
    note: 'Not available in B2',
    status: 'LOCKED',
    summary: 'A future, reversible path for connecting an existing business.',
  },
  {
    eyebrow: 'Provider path',
    href: '#capital',
    id: 'capital',
    label: 'CAPITAL',
    note: 'Separate path · not available in B2',
    status: 'SEPARATE',
    summary: 'A distinct future entry for approved capital providers.',
  },
] as const;

export type ProductPath = (typeof productPaths)[number];

export const shellNavigation = [
  { href: '#overview', label: 'Overview' },
  ...productPaths.map(({ href, label }) => ({ href, label })),
] as const;
