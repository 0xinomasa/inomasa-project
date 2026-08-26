# Repository boundaries

## Selected application shape

Status: `SELECTED / ACTIVE` for the current controlled-Alpha modular monolith.

The codebase is a single-package TypeScript modular monolith with a Next.js App
Router composition root. Standard PostgreSQL, Arc/Circle, and x402 capabilities
remain behind internal boundaries. Current provider selections are recorded
implementation facts, not product-architecture ownership.

```text
src/
  app/       web shell and composition root
  modules/   future bounded business modules
  platform/  external/infrastructure adapters, including persistence
  shared/    domain-neutral shared code only
```

## Boundary rules

- Business modules own their domain policy and public contracts.
- Modules communicate through explicit interfaces/events justified by the active
  Alpha guide and accepted implementation evidence, not through arbitrary imports.
- Platform adapters implement ports required by the application/domain; vendor SDK types do not leak into business policy.
- The composition root wires approved modules and adapters but does not own business rules.
- Shared code remains small and domain-neutral. Duplication is preferable to false coupling when ownership is unclear.
- Cross-module database access, hidden shared mutable state, circular dependencies, and silent authority transfer are prohibited.
- Business modules must depend on their accepted persistence ports, not on `pg`, Kysely, a provider SDK, or another module's tables.
- PostgreSQL is shared persistence for the modular monolith. Product-architecture
  responsibilities do not imply one database, schema, service, or deployment each.

Next.js route folders are delivery structure, not semantic domains, services, or authority boundaries. Semantic domains must not be mirrored mechanically as deployable services.

## Current modules and genericization boundary

The accepted Alpha now has bounded Business, commerce, Agent-authority, Treasury,
settlement, service, Evidence, and platform-adapter code plus versioned domain
migrations. Signal Forge, Ops Pilot, and the buyer Agent are verified regression
fixtures within that implementation; they are not the permanent module boundary or
system-capacity model.

REV2 Checkpoint B may generalize Business creation, templates, multiplicity,
Business Package/Site, and the locked MIGRATE boundary without turning routes,
fixtures, vendor SDKs, or database tables into product authority. Existing code is
replaced only after equivalent regression proof passes. See the active
[`Alpha Realization guide`](inomasa-alpha-implementation-and-testnet-realization-v1.0.md).
