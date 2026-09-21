# Engineering documentation index

This index classifies repository engineering documents for takeover. The active
authority order remains defined by [`source-hierarchy.md`](source-hierarchy.md);
this page is navigation only. **P0 COMPLETE / P1 ACCEPTED / P2 COMPLETE — OWNER
ACCEPTED / P3 IN PROGRESS / P4–P9 NOT STARTED.** P3 has separate owner authorization for Work implementation; old financial actions remain closed.

## Active

- [P1 and canonical roadmap source identities](source-hierarchy.md#source-identity-and-device-local-locations)
  — `Inomasa_Product_Realignment_Map.md`, accepted P1/Final Visual Design Package,
  active Project Instructions Full and Main Audit. The catalog gives exact
  device-local paths; report missing sources in other environments instead of
  assuming the Android mount exists or reconstructing source contents.
- [P3 Work execution checkpoint](../../PROJECT_STATE.md#exact-next-step)
  — local inspection/alignment record, the 2026-09-13 email-only local entry
  decision, R01–R11 dependency/uncertainty timing, published P2 documentation and
  current P3 implementation/proof boundaries.

- [`source-hierarchy.md`](source-hierarchy.md) — authority, mutable-truth, mirror,
  conflict, and status rules.
- [`Inomasa Alpha Implementation & Testnet Realization v1.0 — REV2`](inomasa-alpha-implementation-and-testnet-realization-v1.0.md)
  — active controlled-Alpha implementation guide and A–H kernel contract.
- [`Post-H Product Realization Record`](post-h-product-realization.md)
  — retained realization semantics and evidence; old sequencing and product-facing
  choices are subject to the explicit P1/roadmap corrections in the source hierarchy.
- [`architecture-invariants.md`](architecture-invariants.md) — concise engineering
  guardrails derived from the active Concept and Realization documents.

Accepted P1 governs product/experience realignment; the canonical roadmap governs
stages and gates. [Concept & Architecture v1.0](../architecture/inomasa-concept-and-architecture-v1.0.md)
retains unaffected contracts, and REV2 retains kernel semantics. P1/design
acceptance is separate from code acceptance and runtime/owner usability proof.
CAPITAL is P7 after P6 core acceptance and before P8 Alpha closure; mechanism
assessment remains open at P7 without current score/authority expansion. CONNECT
is P9 conditional expansion. This index does not create another roadmap.

Local application entry is email-only under the latest owner decision; wallet
control remains separately authenticated. Durable Account/wallet/Business recovery
and a proven legacy return path before access cutover are part of the accepted
P3 plan inherited from P2 closure, alongside data isolation, branch base and
first-P3 criteria.
The authorized canonical roadmap update incorporates these corrections directly,
including R01 and §9.5–9.6. P2 is owner-accepted. Legacy access safety/
recovery still needs proof before cutover; a future P3 worktree must carry the
latest reviewed instructions missing from its selected base commit.
Local Arc Litepaper is not a gate; no further search is required.

## Operational

- [`environment-and-safety.md`](environment-and-safety.md) — supported execution
  environments and safety constraints.
- [`git-workflow.md`](git-workflow.md) — repository acceptance and continuity flow.
- [`repository-boundaries.md`](repository-boundaries.md) — selected modular-monolith
  implementation boundaries.
- [`persistence-foundation.md`](persistence-foundation.md) — retained PostgreSQL
  boundary and migration direction.
- [`security-gates.md`](security-gates.md) — active dependency/security holds.

## Historical

- [`deployment-foundation.md`](deployment-foundation.md) — verified B4 evidence.
- [`b5-scope-and-system-realization-entry.md`](b5-scope-and-system-realization-entry.md)
  — verified B5 decision lineage.
- [`alpha-execution.md`](alpha-execution.md) — verified accelerated-Alpha execution
  record and regression evidence.

Historical documents preserve evidence and reasoning but do not define the current
authority, roadmap, or next implementation checkpoint.
