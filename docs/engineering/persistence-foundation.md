# B3 persistence foundation

## Decision scope

Status: `SELECTED / RETAINED` from B3 through the controlled Alpha.

This is a subordinate tooling decision, not product architecture. B3 established
this dependency direction, which the verified Alpha still preserves:

```text
application/module port
  -> internal persistence boundary
    -> PostgreSQL driver/query tooling
      -> current standards-compatible PostgreSQL provider
```

Neon Free is the first hosted development/test candidate, but Neon is not an application or architecture boundary. No Neon SDK or Neon-specific type is used in application/domain code.

## Focused tooling evaluation

| Option | Strengths for B3 | Cost/risk now | Decision |
| --- | --- | --- | --- |
| `pg` plus a custom migration runner | Small, standard PostgreSQL, portable | Would make Inomasa own migration correctness and locking | Rejected; no custom migration framework |
| `pg` + `node-pg-migrate` | Mature PostgreSQL migrations, transactional by default, small | Runtime queries remain weakly typed and migration/query tooling are separate | Viable fallback |
| `Kysely` + `pg` | Type-safe SQL builder, explicit transactions, ordered/locked migrations, standard PostgreSQL driver, no code generation or native binary | Kysely query types are an implementation detail that must remain inside the persistence adapter | Selected |
| Drizzle ORM + Drizzle Kit | Type-safe, PostgreSQL/serverless support, generated SQL migrations | Introduces a schema model, generator/tool metadata, and a larger B3 surface before domain schema exists | Deferred |
| Prisma ORM | Strong schema/migration ecosystem and PostgreSQL support | Client generation, engines, schema ownership, and dependency footprint are premature for a one-table engineering proof | Rejected for B3 |

The selected packages support Node.js 22 and run as portable JavaScript in Ubuntu Proot. `pg` provides the standard PostgreSQL protocol, pooling, TLS, and transactions; Kysely adds compile-time query typing and migration ordering/locking without defining business semantics. Future vertical slices may revisit query ergonomics only through a documented implementation decision; they must not bypass the internal boundary.

## Connections

- `DATABASE_URL`: runtime/application connection. A serverless provider may supply a pooled endpoint.
- `DATABASE_DIRECT_URL`: administrative/migration connection. Use a direct endpoint when pooling limitations require it.
- `DATABASE_POOL_MAX`: optional runtime pool cap. Omitting it uses the driver default; tune it per approved runtime/provider evidence.
- `INOMASA_ENV`: explicit environment identity. No database operation defaults to production.

For hosted Neon proof, use the pooled connection string for `DATABASE_URL` and the direct connection string for `DATABASE_DIRECT_URL`, both with the secure transport parameters currently recommended by Neon. Those values belong only in a permission-restricted local environment or approved secret store, never Git, logs, chat transcripts, or GitHub workflow files.

The hosted B3 proof emitted the node-postgres forward-compatibility warning for `sslmode=require`. Under the pinned B3 versions, that mode still preserves the driver's historical `verify-full`-equivalent verification, so the successful proof remains valid and the provider connection strings remain unchanged. `PG-TLS-SEMANTICS-01` in [`security-gates.md`](security-gates.md) blocks the planned major driver/parser transition until current guidance is re-evaluated and full certificate and hostname verification is preserved. Never resolve the warning by disabling TLS verification.

## Migration standard

Files in `migrations/` are the authoritative schema evolution record. They are applied in lexical order by `npm run db:migrate`; Kysely records execution in its migration metadata table and serializes concurrent migration attempts with a database lock. A failure exits non-zero and reports the stage/migration without printing a connection URL.

No provider-dashboard schema change is authoritative. To reconstruct from clean state, create an empty isolated PostgreSQL database, provide the two connection variables, and run:

```bash
npm run db:migrate
npm run db:proof
```

## Retained non-domain artifact

`inomasa_engineering.persistence_probe` exists only to prove connection, migration,
parameterized write/read, and transactional rollback. It remains alongside the
later Alpha domain schema as a CI/operations probe. The proof writes a random value
inside a transaction, reads and verifies it, forces rollback, and verifies that no
probe row remains.

The table is not User, Business, Wallet, Evidence, Capital, settlement, reputation,
x402, Arc, or any other business model and must never be repurposed into one.
Removal, if later useful, is a focused engineering-maintenance decision rather than
an Alpha semantic requirement.

## CI and hosted proof

GitHub Actions uses an isolated ephemeral PostgreSQL service with trust authentication inside the runner. It stores no hosted credentials and runs `npm run db:verify`. A real hosted Neon proof is separate and requires securely supplied development credentials; do not add persistent provider secrets to CI merely to produce a green check.

## Downstream compatibility review

The boundary leaves provider URL/pool behavior in configuration and keeps
driver/query types under `src/platform/persistence/`. Later realization work can
add or generalize module-owned ports and migrations without changing the PostgreSQL
provider contract or turning product-architecture responsibilities into services.
