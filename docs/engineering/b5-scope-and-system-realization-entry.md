# B5 scope and System Realization entry

> **Document classification: `HISTORICAL / VERIFIED B5 RECORD`.** B5 and its
> Human-Controlled Business Entry/B6 continuation no longer direct current work.
> The then-active Inomasa Canonical Architecture v1.0 is now
> `SUPERSEDED / HISTORICAL`. Current authority and Alpha direction are defined in
> [`source-hierarchy.md`](source-hierarchy.md). The content below is preserved as
> accepted decision lineage and must not be rewritten as if the old gate never
> existed.

## Status and purpose

Status: `VERIFIED — PASS` on 2026-08-25.

Acceptance evidence: pull request `#10`, merge
`395dfd9aa105cdd95088ffd5602739d6c79cbba5`, and accepted-main engineering
verification run `32794327644`, completed successfully including the isolated
PostgreSQL proof. `PROJECT_STATE.md` is the current continuity index.

B5 is **Testnet Scope & System Realization Entry**. It closes the gap between the
B0-B4 engineering runway and later product realization by selecting the first
bounded testnet capability slice, recording the Canonical constraints that govern
it, and defining what a later implementation specification must resolve.

B5 is a decision-and-continuity gate. It introduces no product behavior, domain
schema, authentication, wallet integration, Arc transaction, USDC movement, agent,
x402 flow, or Production exposure.

## Reconciled decision

The historical bootstrap sketch placed a human-wallet foundation before agent
wallets, x402, and persistent background execution. That ordering remains useful
lineage, but `human wallet` is not a sufficient realization boundary:

- Canonical Architecture makes the Business Instance primary;
- identity, account/wallet, and authority are separate primitives;
- a personal account is not canonical Business Treasury;
- exact authentication, wallet product, signer/control, recovery, policy, schema,
  and deployment choices are intentionally open realization decisions;
- current external provider capabilities must be revalidated before selection.

Therefore B5 preserves the historical intent—human control precedes delegated
machine control—without treating a wallet as the product or silently selecting a
provider. A standalone human-wallet implementation is deferred until it is part of
an accepted Business-centered realization specification.

## Selected first bounded capability slice

The first realization candidate is **Human-Controlled Business Entry**.

Its future proof boundary is:

1. a Human Principal is registered through an attributable, environment-bound
   intake and binding path;
2. an authenticated, request-bound, single-use genesis request proposes one
   Business Instance and its initial controller;
3. the Business Instance is registered with a stable identity independent of any
   wallet address or provider account;
4. initial control is verified and explicitly accepted before governance is
   activated;
5. account/wallet binding, identity, Business control, and authority remain
   separately attributable and versioned;
6. the genesis authorization is consumed and cannot become a later platform or
   registry control path;
7. the resulting current state and creation/control history are reconstructable.

This selection establishes an implementation target, not an implementation claim.
It intentionally stops before economic authority, Treasury value movement, Arc or
USDC execution, agent delegation, Evidence interpretation, or Capital.

## Canonical traceability

| Realization requirement | Canonical constraint preserved |
| --- | --- |
| Human control before machine delegation | Business primacy; bounded authority; intelligence is not root of trust |
| Business-centered entry | Business Instance is the primary coordination object |
| Separate identity, binding, and authority | `Identity != Account / Wallet`; `Account / Wallet != Authority` |
| Explicit controller relationship | Principal and Business linkage cannot be inferred from wallet possession |
| Request-bound genesis | Business genesis uses non-replayable, single-use bootstrap authority |
| No orphaned control | Material control transitions preserve a viable legitimate control path or fail closed |
| Versioned history | Current state does not overwrite historical control, binding, or authority context |
| Provider subordination | Circle-first infrastructure may enforce a selected design but cannot own Inomasa authority semantics |
| Environment separation | Test and Arc-testnet identities, bindings, data, and claims remain non-production |

At B5 acceptance, the then-active Canonical Architecture governed these meanings.
This document selected a bounded realization direction and did not amend those
semantics. Current authority is identified by the historical notice above.

## B5 in scope

B5 must leave repository-native evidence for:

- the reconciled meaning of B5;
- the first bounded capability slice and its stop boundary;
- Canonical traceability and forbidden semantic collapses;
- explicit decisions that remain open before code can be authorized;
- acceptance criteria for this gate;
- the exact next-gate boundary in `PROJECT_STATE.md` and `AGENTS.md`.

The B2 shell, B3 persistence foundation, and B4 protected Preview remain unchanged.
No new hosted service, vendor, dependency, module, database object, environment
variable, or deployment target is selected by B5.

## Explicit exclusions

B5 does not authorize:

- product authentication or a sign-in UX;
- issuance of a real canonical Principal or Business Instance;
- named business modules or domain migrations;
- Circle Wallets, another wallet SDK, smart accounts, key custody, or signer logic;
- wallet creation, balances, faucet behavior, transfers, or Business Treasury;
- Arc RPC, contracts, chain identifiers, asset addresses, or USDC settlement;
- standing financial authority, recovery implementation, or emergency powers;
- agents, agent wallets, x402, background execution, Evidence, Trust, Risk, or
  Capital;
- Production deployment, production domain exposure, or weaker Preview protection;
- removal or reuse of the B3 engineering persistence probe.

## Decisions required before the next implementation gate

A later, separately authorized gate must produce an implementation-level System
Realization Specification for Human-Controlled Business Entry. It must resolve and
document at least:

1. the exact user authentication and authentication-assurance path;
2. current primary-source capability research for applicable Circle/Arc wallet and
   control products, plus viable alternatives;
3. account type, signer/control mechanism, binding lifecycle, recovery behavior,
   provider failure/exit behavior, cost, lock-in, and reversibility;
4. canonical owner-to-module mapping without mechanically turning semantic domains
   into services or Next.js routes;
5. API/command boundaries, identifiers, versioning, idempotency, privacy, and
   invalid-input behavior;
6. PostgreSQL owner tables, transaction boundaries, append/history treatment, and
   the migration plan for eventually superseding the engineering probe;
7. environment-specific configuration and secret handling with no production
   defaults;
8. positive, negative, replay, concurrency, recovery, and takeover proof;
9. alternatives, consequences, provider substitution limits, and rejected paths.

No one item may be silently selected in application code or a provider dashboard.

## B5 acceptance criteria

B5 is accepted only when all of the following are observed:

1. This gate contract is committed and unambiguously identifies B5 as Testnet
   Scope & System Realization Entry.
2. Human-Controlled Business Entry is recorded as the first bounded realization
   candidate, with its Canonical traceability, explicit exclusions, and future
   decision requirements.
3. `AGENTS.md`, `README.md`, and `PROJECT_STATE.md` consistently state that B5 adds
   no product behavior and does not authorize the next gate.
4. No application code, dependency, migration, environment variable, external
   provider configuration, or deployment exposure changes in the B5 diff.
5. `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass with
   observed output.
6. `git diff --check` passes and every remaining worktree change is reported.
7. The focused branch is reviewed and accepted through GitHub, then the resulting
   `main` engineering-verification run passes.
8. `PROJECT_STATE.md` records the accepted merge, observed main-CI evidence, open
   holds, and the exact not-started next gate before continuity is declared
   complete.

Passing B5 means the realization entry decision is `VERIFIED`. It does not mean
Human-Controlled Business Entry, authentication, wallet behavior, or any domain
capability is `IMPLEMENTED`.

## Historical next-gate boundary

At B5 acceptance, the recorded next gate was **B6 — Human-Controlled Business Entry
System Realization Specification**. It was `NOT STARTED` and required separate
explicit authorization. That boundary is preserved here as historical lineage; it
is not the current next implementation checkpoint.

B5 does not authorize or begin B6.
