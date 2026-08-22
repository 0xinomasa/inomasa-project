# Canonical invariant summary

## Scope and authority

This file is a concise engineering guardrail for repository work. It does not reproduce, replace, freeze, or amend the Inomasa Canonical Architecture v1.0. If wording here conflicts with the Canonical Architecture, the Canonical Architecture wins and the repository summary must be corrected.

## Invariants carried into engineering

- **Business is primary.** Technology, agents, models, chains, and vendors serve authorized business/economic activity; they do not become the product authority.
- **BUILD, MIGRATE, and CAPITAL remain distinct entry boundaries.** Repository convenience must not collapse their semantics or dependency rules. B2 displays these boundaries but implements none of their business behavior.
- **Authority and intelligence stay separate.** AI/model output is advisory or delegated within explicit principal authority; intelligence must not silently acquire identity, wallet, policy, or settlement authority.
- **Principal control is explicit.** Manual, Semi, and Full modes preserve user-granted scope, revocation, recovery, and emergency boundaries.
- **Economic capacity is funded capacity.** Escrow/obligation capacity must remain 1:1 with funds actually locked under the authorized mechanism; inferred credit must not masquerade as funded capacity.
- **Settlement is economic memory.** Finalized economic outcomes must remain traceable to authorized obligations and evidence; accounting must not double-count equivalent representations of the same value.
- **Evidence is inspectable and scoped.** Inomasa does not manufacture reputation. Evidence supports contextual interpretation and must not become a universal, context-free score.
- **Trust and discovery are contextual.** Reputation/trust signals are domain- and purpose-scoped, explainable, and bounded by evidence quality.
- **CAPITAL is provider-driven and firewalled.** Capital state and release authority remain segregated and bounded; Inomasa must not silently assume balance-sheet or universal underwriting risk.
- **USDC is the required economic unit for the initial Arc path.** Arc/Circle wallet and settlement implementation details remain subject to System Realization and proof; no placeholder integration counts as selection.
- **Paid machine-to-machine activity requires x402.** The exact package/provider implementation is not selected in B1.
- **Agents are event-driven and hosted for persistent work.** The Android/Termux device is a development client, not the production background runtime.
- **LLM providers remain abstracted.** A model provider must not own domain policy, durable authority, or irreplaceable application state.
- **Environment authority is separated.** Development, test, Arc testnet/staging, and production identities, data, keys, contracts, and endpoints must never be conflated.

## Change rule

Any proposal that changes these semantics is an architecture matter, not a routine code refactor. Stop implementation and route it through explicit decision/adjudication before modifying code or documentation.
