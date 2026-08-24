# B4 Deployment Foundation evidence

## Verdict

Status: `VERIFIED — PASS` on 2026-08-24.

B4 proves that the existing B2 shell can be built by the selected provider and
served as a Vercel Authentication-protected Preview from accepted GitHub `main`.
It introduces no product behavior, domain authority, database integration,
Production exposure, or B5 work.

## Accepted source and pre-deployment evidence

- Source commit: `d75bcd5472f35f0cc962c6a420473957915153f6` on GitHub `main`.
- State-correction pull request: `#6`.
- Pull-request verification: run `32703957217`, completed successfully.
- Accepted-`main` verification: run `32704062572`, `push/main`, completed
  successfully, including the isolated PostgreSQL migration and persistence proof.
- B4 evidence acceptance: pull request `#7`, merge
  `d2829c35e52fc59d8579e16d88956997cb79e681`.
- B4 evidence `main` verification: run `32704891257`, `push/main`, completed
  successfully, including the isolated PostgreSQL migration and persistence proof.
- Local profile: Node `22.23.2`, npm `10.9.8`, clean `npm ci`, audit with zero
  vulnerabilities, lint, typecheck, 6/6 tests, production build, and production
  server HTTP `200` with the expected shell anchors.
- Browser automation is not verified on the current Ubuntu ARM64 profile: the
  available Node-22-compatible `agent-browser` has no Chrome ARM64 build and no
  system Chromium was available. The static-shell local render proof therefore
  used the production server response and semantic HTML anchors.

## Vercel project state

Project `inomasa` was inspected immediately before deployment:

- Framework Preset: `Next.js` (corrected from unset / Other).
- Node.js project setting: `22.x` (corrected from `24.x`).
- Output Directory: Next.js default; no fake `public` output was introduced.
- Vercel Authentication: `prod_deployment_urls_and_all_previews`.
- Git Fork Protection: enabled.
- Preview environment variables: none.

These are provider settings, not application or architecture boundaries.

## Protected Preview evidence

| Item | Observed evidence |
| --- | --- |
| Deployment | `dpl_az1jRshRMZYn57RbFxsvkozLJZ2k` |
| URL | `https://inomasa-p2fufmceb-inomasa-project.vercel.app` |
| Source | GitHub `main` commit `d75bcd5472f35f0cc962c6a420473957915153f6` |
| Target | `preview` |
| Framework | `nextjs` |
| Region | `iad1` |
| Provider state | `READY` |

The remote build installed the committed npm dependency graph, detected Next.js
`16.3.2`, compiled successfully, completed TypeScript checking, generated all
static pages, and deployed the resulting output.

Protection and render proof:

1. An ordinary unauthenticated request received HTTP `302` to the Vercel SSO
   endpoint and did not receive the Inomasa shell.
2. An authorized `vercel curl` request received the complete rendered shell,
   including the Inomasa title, `INOMASA`, `BUILD`, `MIGRATE`, `CAPITAL`, and
   `No production authority` anchors.
3. The temporary automation bypass created by `vercel curl` was removed after
   proof. The post-proof configuration showed zero bypass entries while Vercel
   Authentication and Git Fork Protection remained enabled.
4. The deployment had no error, warning, or fatal runtime log entries in the
   observed post-deployment interval.

## Boundary after B4

- B4 is complete.
- The protected Preview remains provider evidence, not Production authority.
- Product implementation remains bounded to the B3 persistence foundation and B2
  structural shell; no business or economic workflow is implemented.
- `PG-TLS-SEMANTICS-01` remains active and unchanged.
- `NEXT-SEC-2026-08` remains retired and obsolete.
- B5 has not started and requires a later explicit authorization.
