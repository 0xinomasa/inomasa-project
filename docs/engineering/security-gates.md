# Engineering security gates

## NEXT-SEC-2026-08

Status: `OPEN — SECURITY HOLD ON NETWORK EXPOSURE`.

B3 development readiness is `PASS WITH SECURITY HOLD`. This gate does not block repository work, trusted local application execution, PostgreSQL engineering, migrations, or database connectivity from a trusted development environment.

The gate blocks:

- B4 deployment;
- any externally reachable Inomasa application runtime;
- hosted private, closed, public, or demo application exposure;
- any later environment where the affected Next.js runtime is network-accessible.

Before any blocked action, re-check current primary sources rather than relying on an anticipated version or date:

- [Next.js support policy](https://nextjs.org/support-policy)
- [official Next.js security release notice](https://nextjs.org/blog/upcoming-nextjs-security-release-august-2026)
- [the current stable `next` package](https://www.npmjs.com/package/next)

Closing the gate requires evidence of all of the following at that time:

1. an officially fixed, supported stable Next.js release;
2. dependency and lockfile update when required;
3. clean dependency installation;
4. dependency/security audit;
5. lint;
6. typecheck;
7. tests;
8. production build;
9. local runtime/render verification;
10. a real GitHub Actions run that passes.

Closing this engineering gate permits the next authorized exposure decision; it does not authorize deployment, change Canonical Architecture, or start B4 by itself.

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
