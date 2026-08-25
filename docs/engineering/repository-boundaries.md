# Repository boundaries

## Selected application shape

Status: `SELECTED` for the B2 application skeleton and B3 persistence foundation only.

The codebase is a single-package TypeScript modular monolith with a Next.js App Router shell. This keeps one deployment unit while preserving explicit internal boundaries. B3 selects standard PostgreSQL behind an internal adapter, but does not select a hosted database provider as an application boundary, chain SDK, wallet SDK, agent runtime, hosting provider, or contract toolchain.

```text
src/
  app/       web shell and composition root
  modules/   future bounded business modules
  platform/  external/infrastructure adapters, including persistence
  shared/    domain-neutral shared code only
```

## Boundary rules

- Business modules own their domain policy and public contracts.
- Modules communicate through explicit interfaces/events selected during System Realization, not through arbitrary internal imports.
- Platform adapters implement ports required by the application/domain; vendor SDK types do not leak into business policy.
- The composition root wires approved modules and adapters but does not own business rules.
- Shared code remains small and domain-neutral. Duplication is preferable to false coupling when ownership is unclear.
- Cross-module database access, hidden shared mutable state, circular dependencies, and silent authority transfer are prohibited.
- Business modules must depend on their accepted persistence ports, not on `pg`, Kysely, a provider SDK, or another module's tables.
- PostgreSQL is shared persistence for the modular monolith. Canonical semantic domains do not imply one database, schema, service, or deployment per domain.

Next.js route folders are delivery structure, not semantic domains, services, or authority boundaries. Semantic domains must not be mirrored mechanically as deployable services.

## Why no named product modules yet

B2 proves the responsive application shell and build path. B3 adds only a
non-domain persistence proof. B5 selects Human-Controlled Business Entry as the
first bounded realization candidate, but deliberately leaves its owner-to-module,
API, and schema decisions for the separately authorized System Realization
Specification gate. See
[`b5-scope-and-system-realization-entry.md`](b5-scope-and-system-realization-entry.md).

Naming concrete implementation modules or business tables before those
responsibilities are accepted would turn engineering setup into a silent
architecture decision. Module directories and domain schema will be introduced
only after their responsibilities are accepted.
