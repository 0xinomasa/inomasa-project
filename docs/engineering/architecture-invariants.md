# Active architecture invariant summary

## Scope and authority

This file summarizes retained Concept/REV2 contracts and accepted P1 corrections.
Read [source-hierarchy.md](source-hierarchy.md) for source identities, device-local
locations and exact precedence. P1/Final Visual Design Package acceptance governs
product direction; it does not establish runtime, usability or implementation
acceptance. P2 is COMPLETE / OWNER ACCEPTED; P3 is now owner-authorized and IN PROGRESS in Work. Report unresolved material conflicts before
changing affected behavior; do not reopen already accepted design choices.

## Invariants carried into engineering

- **Business is primary.** Humans, Agents, wallets, protocols, models, and vendors
  participate in Business activity; none replaces Business as the coordination object.
- **BUILD, CONNECT, and CAPITAL share one Business environment.** CONNECT is the
  product name; the existing narrow connector uses internal MIGRATE semantics.
  Unconfigured entry remains closed. The active roadmap puts CAPITAL at P7 after
  P6 core acceptance and before P8 Alpha closure; CONNECT is P9 conditional
  expansion. Accepted F/G/H evidence does not complete these product stages or
  authorize broader exposure.
- **Generic capability and fixtures are distinct.** Product capacity must not be
  inferred from Signal Forge, Ops Pilot, Reference Workbench, or any fixed test
  population. Those objects remain valid regression specimens with explicit
  common-control provenance.
- **Use before rebuild.** Evaluate suitable Arc/Circle capabilities and external
  Agentic Economy standards before adding custom machinery. External primitives
  remain scoped sources, not owners of Inomasa Business semantics.
- **Accepted Business foundations are product contracts.** P1's six systems and
  F1–F8 do not prescribe menus or services. BUILD is AI-assisted, with Business-owned
  Brain and an Orchestrator; Personal Wallet readiness precedes new Business
  formation. These requirements are not claims that the current code fulfills
  them. Preserve correct persisted state and economic semantics while replacing
  obsolete product-facing composition when authorized.
- **Local entry and verified control are different.** The owner-selected localhost
  Alpha accepts typed email without invitation, allowlist or application OTP.
  Email alone grants no existing principal, Business or wallet control. A local
  session may hold its own context, but cannot recover another context by email.
  Wallet authentication and server-validated bindings protect durable control.
  Durable Account identity and wallet/Business relationships outlive sessions;
  verified identity restores them without creating another Account or wallet.
  Losing cookies or logging out removes access proof, not ownership. Legacy
  control requires independent proof, not even newly verified email alone;
  prove the owner's return/binding path before replacing legacy access. Keeping
  that path temporarily is not proof of its safety or recoverability. Loss of
  session proof requires authentication for protected Account/wallet recovery,
  not an OTP gate on initial local application entry.
  Personal Wallet remains Circle User-Controlled Wallet. Public access and P6
  independent-controller claims are not authorized or proven by local entry.
- **Business and Agent are not wallets.** Wallet/account infrastructure is an
  execution capability. Agent economic action remains within attributable,
  bounded authority; intelligence must not silently acquire deterministic state or
  financial authority. Personal Wallet and Business Treasury remain separate;
  the verified platform-controlled DCW Alpha profile is not final user custody.
- **Protocol choice follows transaction shape.** ERC-8004 is the default intended
  identity/interoperability anchor for relevant onchain Agents; x402 serves instant
  machine commerce; ERC-8183 serves funded work with deliverable/evaluation; direct
  USDC remains valid where those patterns do not fit.
- **Economic state follows observed effects.** Preserve exact USDC quantities,
  idempotency, reconciliation, no blind retry after ambiguous effects, no duplicate
  payment/delivery/posting, and correct Revenue/Cost/Refund/Capital classification.
- **Evidence is source-scoped.** Payment is not service quality, onchain activity is
  not organic demand, registry feedback is not universal reputation, and Capital
  allocation is not Business success.
- **Capital retains attributable decisions and risk.** Preserve Capital/Revenue
  separation and the accepted provider/risk-bearer attribution. CAPITAL mechanism
  evaluation waits for P7, including whether a score is appropriate; absence of
  a universal score is not a permanent prohibition. No score, automatic capital
  entitlement, expanded authority, or silent lender/guarantor risk is accepted now.
- **Arc Testnet and USDC are the controlled-Alpha economic environment.** Testnet
  actors, value, identities, provider outcomes, and common control must never be
  represented as Production or independent market demand.
- **Hybrid placement preserves provenance.** Chain, protocol, provider, application,
  and external/CONNECT state retain their actual source and observation limit.
- **Environment authority is separated.** Development, automated test, private Arc
  testnet, later testnet stages, and Production/mainnet identities, data, keys,
  contracts, and endpoints must not be conflated.

## Change rule

Implementation details may be simplified or replaced when proof supports a better
route. A proposal that changes the active product/system meaning, or exposes a
substantive conflict remaining after the accepted P1 corrections, requires explicit
human adjudication before implementation.
