# Engineering security gates

## NEXT-SEC-2026-08

Status: `RETIRED — OBSOLETE; NOT AN ACTIVE GATE`.

This identifier is retained only as engineering lineage. Its prior B4 and
network-exposure block was explicitly retired during the 2026-08-24 B4 takeover.
It does not block B4 and must not be reopened by inference from historical text,
an anticipated release, or a provider message.

The former hold and its closure checklist below are historical evidence, not
current requirements:

- B4 deployment;
- any externally reachable Inomasa application runtime;
- hosted private, closed, public, or demo application exposure;
- any later environment where the affected Next.js runtime is network-accessible.

The hold required checking these primary sources rather than relying on an
anticipated version or date:

- [Next.js support policy](https://nextjs.org/support-policy)
- [official Next.js security release notice](https://nextjs.org/blog/upcoming-nextjs-security-release-august-2026)
- [the current stable `next` package](https://www.npmjs.com/package/next)

Its recorded closure checklist was:

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

Retirement does not amend Canonical Architecture, authorize Production exposure,
or weaken any other active gate. A future Next.js security concern must be assessed
from current primary evidence and, when warranted, recorded under a new gate; it
must not silently reactivate `NEXT-SEC-2026-08`.

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
