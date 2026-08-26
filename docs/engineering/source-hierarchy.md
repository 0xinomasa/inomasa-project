# Engineering source hierarchy

## Purpose

This hierarchy separates normative product direction, mutable engineering truth,
implementation guidance, and historical evidence. A chat, fixture, vendor example,
or older document must never silently become current authority.

## Active authority and truth

1. **[Inomasa Concept & Architecture v1.0](../architecture/inomasa-concept-and-architecture-v1.0.md)**
   is the active product and system-architecture authority.
2. **[Inomasa Alpha Implementation & Testnet Realization v1.0 — REV2](inomasa-alpha-implementation-and-testnet-realization-v1.0.md)**
   is the active controlled-Alpha implementation guide. It may select and sequence
   implementation only within the Concept & Architecture contract.
3. **Accepted GitHub `main`**—code, migrations, tests, lockfile, Git history, CI,
   and recorded provider/chain proof—is current mutable engineering truth.
   [`PROJECT_STATE.md`](../../PROJECT_STATE.md) is its takeover index, not a substitute
   for the underlying evidence.
4. **Accepted repository engineering documents and decision records** provide
   operational guidance within their stated scope.
5. **Explicit task instructions and working plans** direct the current execution
   but may not silently override the two active authority documents or falsify
   accepted engineering evidence.
6. **External primary sources and implementation observations** may expose a gap
   or justify a proposed change. They are evidence, not automatically adopted
   Inomasa direction.

## Superseded and historical sources

**Inomasa Canonical Architecture v1.0 is `SUPERSEDED / HISTORICAL`.** It and the
Foundation/Domain set, maps, B0-B5 gates, old B6/B7/B8 or R1-R5 roadmaps, reviews,
adjudications, and prior execution plans remain lineage/audit evidence only. They
govern current work only where an active authority deliberately restates their
meaning.

The verified controlled Alpha execution record remains engineering evidence. Its
Signal Forge, Ops Pilot, and buyer-Agent objects are regression fixtures, not a
fixed product-capacity or roadmap authority.

## Conflict handling

When the two active authority documents conflict substantively, or a requested
change would alter product meaning beyond what they resolve:

1. stop the affected change;
2. identify the exact unresolved decision or conflict;
3. record current engineering facts without inventing product meaning;
4. request material direction from the user;
5. resume only after an explicit decision is accepted.

Never resolve a conflict by silently changing product semantics, authority,
economic classification, provenance, settlement behavior, trust interpretation,
or Capital risk ownership.

## Decision status vocabulary

- `REQUIRED` — imposed by an active authority or hard constraint; not yet selected or built.
- `SELECTED` — a documented implementation choice has been accepted.
- `PROTOTYPED` — exercised in a bounded spike; not production implementation.
- `IMPLEMENTED` — present in the repository; not automatically proven correct.
- `VERIFIED` — required evidence and checks have passed.

These statuses are not interchangeable. B0 compatibility results are evidence about the development environment, not product implementation.
