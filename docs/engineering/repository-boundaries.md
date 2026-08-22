# Repository boundaries

## Selected B1 shape

Status: `SELECTED` for repository structure only.

The initial codebase is a single-package TypeScript modular monolith. This choice minimizes tooling and deployment complexity while preserving explicit internal boundaries. It does not select the final web framework, database, chain SDK, wallet SDK, agent runtime, hosting provider, or contract toolchain.

```text
src/
  app/       future composition root
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

## Why no named product modules yet

B1 proves repository and tooling readiness. Naming concrete implementation modules before Testnet Scope Extraction and System Realization would turn a bootstrap task into an architecture decision. Module directories will be introduced only after their boundaries and responsibilities are accepted.
