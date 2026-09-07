export const productPaths = [
  {
    eyebrow: 'Business entry',
    href: '#build',
    route: '/build',
    id: 'build',
    label: 'BUILD',
    note: 'Controlled Alpha in active realization',
    status: 'ALPHA',
    summary: 'Build with AI assistance and operate the Business through Arc commerce.',
    title: 'Build your business',
  },
  {
    eyebrow: 'Business entry',
    href: '#migrate',
    route: '/connect',
    id: 'migrate',
    label: 'CONNECT',
    note: 'Controlled sources configured for an invited user',
    status: 'ALPHA',
    summary:
      'Connect a configured existing Business source to the same workspace and Arc economy.',
    title: 'Connect your business',
  },
  {
    eyebrow: 'Provider path',
    href: '/capital',
    route: '/capital',
    id: 'capital',
    label: 'CAPITAL',
    note: 'Provider-attributable controlled testnet path',
    status: 'ALPHA',
    summary: 'Provider-specific review, decision, Business acceptance, allocation, and bounded-use observability.',
    title: 'Capital',
  },
] as const;

export type ProductPath = (typeof productPaths)[number];

export const shellNavigation = [
  { href: '#overview', label: 'Overview' },
  ...productPaths.map(({ href, label }) => ({ href, label })),
] as const;
