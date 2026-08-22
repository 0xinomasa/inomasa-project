# Repository boundaries

## Selected application shape

Status: `SELECTED` for the B2 application skeleton only.

The codebase is a single-package TypeScript modular monolith with a Next.js App Router shell. This keeps one deployment unit while preserving explicit internal boundaries. It does not select a database, chain SDK, wallet SDK, agent runtime, hosting provider, or contract toolchain.

```text
src/
  app/       web shell and composition root
  modules/   future bounded business modules
  platform/  future external/vendor adapters
  shared/    domain-neutral shared code only
```

## Boundary rules

- Business modules own their domain policy and public contracts.
- Modules communicate through explicit interfaces/events selected during System Realization, not through arbitrary internal imports.
- Platform adapters implement ports required by the application/domain; vendor SDK types do not leak into business policy.
- The composition root wires approved modules and adapters but does not own business rules.
- Shared code remains small and domain-neutral. Duplication is preferable to false coupling when ownership is unclear.
- Cross-module database access, hidden shared mutable state, circular dependencies, and silent authority transfer are prohibited.

Next.js route folders are delivery structure, not semantic domains, services, or authority boundaries. Semantic domains must not be mirrored mechanically as deployable services.

## Why no named product modules yet

B2 proves the responsive application shell and build path. Naming concrete implementation modules before their vertical-slice boundaries are accepted would turn a skeleton task into an architecture decision. Module directories will be introduced only after their responsibilities are accepted.
