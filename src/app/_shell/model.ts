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
    note: 'System-ready boundary · not yet open',
    status: 'LOCKED',
    summary:
      'The shared Business origin model accepts a future MIGRATE path, while every current creation request is rejected until that path is explicitly opened.',
  },
  {
    eyebrow: 'Provider path',
    href: '/capital',
    id: 'capital',
    label: 'CAPITAL',
    note: 'Provider-attributable controlled testnet path',
    status: 'ALPHA',
    summary: 'Provider-specific review, decision, Business acceptance, allocation, and bounded-use observability.',
  },
] as const;

export type ProductPath = (typeof productPaths)[number];

export const shellNavigation = [
  { href: '#overview', label: 'Overview' },
  ...productPaths.map(({ href, label }) => ({ href, label })),
] as const;
