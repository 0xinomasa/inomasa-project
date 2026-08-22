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
