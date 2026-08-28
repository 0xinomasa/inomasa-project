# Active architecture invariant summary

## Scope and authority

This file is a concise engineering guardrail derived from the active
[Concept & Architecture](../architecture/inomasa-concept-and-architecture-v1.0.md)
and [Alpha Realization](inomasa-alpha-implementation-and-testnet-realization-v1.0.md).
It does not replace either document. If this summary conflicts with them, correct
the summary and stop any materially affected implementation until the conflict is
resolved.

## Invariants carried into engineering

- **Business is primary.** Humans, Agents, wallets, protocols, models, and vendors
  participate in Business activity; none replaces Business as the coordination object.
- **BUILD, MIGRATE, and CAPITAL share one Business environment without becoming one
  truth system.** BUILD is active; MIGRATE is structurally anticipated and
  user-facing locked; Capital remains provider-driven. Under REV2 sequential
  execution it is the exact Checkpoint F implementation point after accepted
  Economic History, without authorizing Production/public Capital exposure.
- **Generic capability and fixtures are distinct.** Product capacity must not be
  inferred from Signal Forge, Ops Pilot, or any fixed test population. Those objects
  remain valid regression specimens with explicit common-control provenance.
- **Use before rebuild.** Evaluate suitable Arc/Circle capabilities and external
  Agentic Economy standards before adding custom machinery. External primitives
  remain scoped sources, not owners of Inomasa Business semantics.
- **Business and Agent are not wallets.** Wallet/account infrastructure is an
  execution capability. Agent economic action remains within attributable,
  bounded authority; intelligence must not silently acquire deterministic state or
  financial authority.
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
- **Capital is provider-driven.** A provider/risk bearer owns its decision and terms.
  Inomasa does not create automatic entitlement, a universal score, or silent
  lender/guarantor/balance-sheet risk.
- **Arc Testnet and USDC are the controlled-Alpha economic environment.** Testnet
  actors, value, identities, provider outcomes, and common control must never be
  represented as Production or independent market demand.
- **Hybrid placement preserves provenance.** Chain, protocol, provider, application,
  and future external/MIGRATE state retain their actual source and observation limit.
- **Environment authority is separated.** Development, automated test, private Arc
  testnet, later testnet stages, and Production/mainnet identities, data, keys,
  contracts, and endpoints must not be conflated.

## Change rule

Implementation details may be simplified or replaced when proof supports a better
route. A proposal that changes the active product/system meaning, or exposes a
substantive conflict between the two active authority documents, requires explicit
human adjudication before implementation.
