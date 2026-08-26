/**
 * Intentional machine-readable continuity descriptor maintained since B1.
 * It is descriptive only; active authority and mutable truth remain in the
 * accepted authority documents and PROJECT_STATE.md.
 */
export const repositoryBaseline = Object.freeze({
  architectureAuthority: 'Inomasa Concept & Architecture v1.0',
  implementationGuide: 'Inomasa Alpha Implementation & Testnet Realization v1.0 — REV2',
  phase: 'Controlled Arc Testnet Product Alpha',
  runtime: 'Node.js 22',
  status: 'verified-regression-baseline',
} as const);
