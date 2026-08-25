export const productPaths = [
  {
    eyebrow: 'Business entry',
    href: '#build',
    id: 'build',
    label: 'BUILD',
    note: 'Controlled Alpha in active realization',
    status: 'ALPHA',
    summary: 'Create deterministic Business Instances and connect their economic loop.',
  },
  {
    eyebrow: 'Business entry',
    href: '#migrate',
    id: 'migrate',
    label: 'MIGRATE',
    note: 'Deferred for the first testnet proof',
    status: 'LOCKED',
    summary: 'A future, reversible path for connecting an existing business.',
  },
  {
    eyebrow: 'Provider path',
    href: '#capital',
    id: 'capital',
    label: 'CAPITAL',
    note: 'Follows credible commerce and Evidence',
    status: 'NEXT',
    summary: 'A provider-attributable path for later testnet capital allocation.',
  },
] as const;

export type ProductPath = (typeof productPaths)[number];

export const shellNavigation = [
  { href: '#overview', label: 'Overview' },
  ...productPaths.map(({ href, label }) => ({ href, label })),
] as const;
