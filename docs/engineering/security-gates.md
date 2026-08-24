# Engineering security gates

## PG-TLS-SEMANTICS-01

Status: `ACTIVE — DEPENDENCY MAJOR-UPGRADE HOLD`.

The B3 lockfile pins `pg` 8.23.0 and `pg-connection-string` 2.14.0. With those versions, the driver warns that `sslmode=require`, `prefer`, and `verify-ca` currently retain its historical `verify-full`-equivalent certificate and hostname verification, but their meanings are planned to change with `pg` 9 / `pg-connection-string` 3.

This warning is not a B3 connection failure and does not justify silently rewriting a provider-issued connection string. It also must not be suppressed by disabling certificate verification.

The gate blocks:

- upgrading to `pg` 9 or `pg-connection-string` 3;
- any dependency update that changes PostgreSQL TLS parsing or verification semantics;
- accepting weaker certificate or hostname verification merely to preserve connectivity.

Before a blocked dependency change, re-check current primary sources from node-postgres, PostgreSQL, and the active PostgreSQL provider. Preserve certificate-chain and hostname verification using the then-supported configuration, then repeat clean install, dependency audit, lint, typecheck, tests, production build, hosted connect/migrate/write/read/rollback proof, and GitHub Actions verification.

Closing or changing this gate requires observed evidence. Do not hardcode an anticipated future driver behavior or provider configuration as architecture truth.
