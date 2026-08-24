# Inomasa project state and takeover

This file is the concise repository-native entry point for a human or AI operator taking over Inomasa engineering. It records current mutable state separately from durable operating rules. Chat history is context only and is never required engineering evidence.

## Current mutable state

| Item | Accepted state |
| --- | --- |
| Source repository | Private `0xinomasa/inomasa-project` |
| Accepted branch | `main` |
| Latest completed engineering gate | **B4 — Deployment Foundation: VERIFIED / PASS** |
| B3 merge evidence | `7dfa25b1d6ce005f7de7c3c06ea19a22e0136ec5` |
| B3 main CI evidence | Engineering verification run `32603268206`, `push/main`, completed successfully |
| B4 acceptance evidence | Pull request `#7`, merge `d2829c35e52fc59d8579e16d88956997cb79e681` |
| B4 accepted-main CI evidence | Engineering verification run `32704891257`, `push/main`, completed successfully, including PostgreSQL proof |
| Current corrective checkpoint | B4 continuity synchronized after the protected Preview verdict; B5 remains not started |
| B4 local pre-deployment evidence | Node `22.23.2`, npm `10.9.8`; clean install and audit (0 vulnerabilities), lint, typecheck, 6/6 tests, production build, and production-server HTTP `200` with expected Inomasa shell anchors |
| Product implementation boundary | B3 foundation only; no product or economic workflow is implemented |
| Active work | None; B4 is complete and B5 has not started |
| Current blocking gate | No B4 blocker remains; `PG-TLS-SEMANTICS-01` remains active only for its scoped dependency change |
| First deployment evidence | Vercel deployment `dpl_HLPGUzp74Z1Yt3DunwgXvLVMddAt` from `48a980411f409f86f9e69fdf0b8e9a2119d17eac`, incorrectly targeted Production, ended `ERROR` (`STATIC_BUILD_NO_OUT_DIR`) |
| B4 protected Preview evidence | Vercel deployment `dpl_az1jRshRMZYn57RbFxsvkozLJZ2k` from accepted `main` commit `d75bcd5472f35f0cc962c6a420473957915153f6`; target `preview`, state `READY` |
| Deployment protection evidence | Anonymous request redirected to Vercel SSO without the shell; authorized request rendered expected shell anchors; temporary automation bypass removed and Vercel Authentication remained enabled |
| Deployment state | One protected Preview is `READY`; no Production deployment or authority was created |

The inherited `PASS WITH WORKAROUND` is the Ubuntu Proot Codex sandbox limitation documented in [`docs/engineering/environment-and-safety.md`](docs/engineering/environment-and-safety.md). It is not a persistence failure and is not a requirement on other devices.

## Open mandatory gates

- `NEXT-SEC-2026-08` — **RETIRED / OBSOLETE**. Retained only as lineage; it is not an active gate and must not be reopened by inference. See [`docs/engineering/security-gates.md`](docs/engineering/security-gates.md).
- `PG-TLS-SEMANTICS-01` — **ACTIVE**. Blocks `pg` 9, `pg-connection-string` 3, or an equivalent TLS-semantics change until certificate and hostname verification are re-proven. It does not block the pinned B3 foundation.

Do not infer changes to `PG-TLS-SEMANTICS-01` from a newer version, provider
dashboard message, or prior chat. Its status changes require committed evidence and
an observed successful `main` CI run.

## Durable continuity rules

1. GitHub `main`, committed specifications, migrations, tests, CI evidence, and explicit gate records are the engineering continuity source.
2. Inomasa Canonical Architecture v1.0 remains the sole active architecture authority. It is a controlled project source and is deliberately not partially copied here. If an operator lacks authorized access to it, they must stop before any semantic, authority, domain, or product-design decision.
3. Repository engineering documents are subordinate implementation guidance. They cannot silently amend Canonical Architecture.
4. Devices are replaceable development clients. Android + Termux + Ubuntu Proot is proven, not architecturally required.
5. Operators and AI tools are replaceable. Codex, OpenCode, ChatGPT, another AI, or a human engineer receives no authority from chat history or tool identity.
6. PostgreSQL semantics and the internal persistence boundary are durable; Neon is the provider used for B3 hosted proof, not an application boundary.
7. Credentials and recovery material are supplied through authorized channels outside Git. Never commit or paste them into documentation, issues, CI logs, or chat.
8. After every significant gate decision or accepted merge, update this file in the same change whenever practical. Record the latest completed gate, evidence, open holds, and exact next gate. A future operator must not need historical chat to discover state.

## Invariant destination, adaptable execution route

The engineering destination is invariant: the accepted state and next gate in this file, Canonical Architecture constraints, repository safety rules, acceptance criteria, and required verification evidence. An execution route is not invariant. It is a scoped profile selected for the actual device, operating system, operator, AI tool, and infrastructure capabilities in front of the operator.

- Select the safest, least-privilege route that can satisfy the same gate in the actual environment.
- Commands, tools, sequencing, and provider administration may differ between profiles, but the route must not weaken constraints, acceptance criteria, or required evidence.
- Treat Android/Ubuntu Proot procedures and workarounds as scoped to that proven profile. Do not copy them to a capable Linux laptop, Windows/macOS environment, another AI tool, or a human workflow unless their actual constraints justify it.
- Equivalent evidence must demonstrate the same acceptance criteria even when the route differs.
- Never claim an environment or operator route is `VERIFIED` by analogy with another route.

This repository is the navigation and handoff system: it preserves the destination, current state, constraints, blockers, acceptance criteria, known profiles, and evidence. The next competent operator chooses the route; the repository determines what must remain true and what proof must be produced.

Environment/profile statuses mean:

- `VERIFIED` — the stated profile and scope actually passed the required checks, with observed evidence.
- `SUPPORTED/TARGET` — expected to be viable, but the relevant clean bootstrap and verification have not yet been fully observed.
- `UNSUPPORTED/BLOCKED` — known not to satisfy current requirements, or blocked until a documented constraint is resolved or a safe workaround is proven.

Statuses are scoped. Passing CI does not verify a local workstation, and verifying one tool on one operating system does not verify another route.

## Supported takeover environments

| Environment | Status | Notes |
| --- | --- | --- |
| Android + Termux + Ubuntu ARM64 Proot | `VERIFIED` for B0 and the recorded local scope | Node 22/NVM/npm work; Codex uses the recorded supervised profile because its normal sandbox is `UNSUPPORTED/BLOCKED` in this environment. |
| GitHub-hosted Ubuntu runner | `VERIFIED` for CI scope | Node 22, clean install, engineering checks, and ephemeral PostgreSQL proof passed. This does not verify an interactive workstation. |
| Laptop/PC with a suitable Linux environment, WSL, or macOS | `SUPPORTED/TARGET` | Use the safest route available there and pass the clean-clone procedure before claiming local readiness. No device-specific repository state is required. |

Native Windows outside WSL is `SUPPORTED/TARGET`, not `VERIFIED`. It requires an environment-appropriate clean bootstrap route and observed evidence; evaluating that route does not change the architecture.

## Clean-clone takeover

Prerequisites are authorized GitHub access, Git, NVM, and a platform capable of running Node.js 22 and npm. Start without database or provider credentials:

```bash
git clone https://github.com/0xinomasa/inomasa-project.git
cd inomasa-project
git switch main
git pull --ff-only
git status --short
cat PROJECT_STATE.md
cat AGENTS.md
nvm install
nvm use
node --version
npm --version
npm ci
npm audit
npm run verify
git diff --check
git status --short
```

Expected baseline: Node `22.x`, a clean dependency install, no unexplained audit finding, lint/typecheck/tests/production build passing, no whitespace errors, and an unchanged worktree. Before accepting work, inspect the latest `main` GitHub Actions run and every open gate above.

Database work additionally requires separately authorized credentials for an isolated non-production PostgreSQL database:

```bash
umask 077
cp .env.example .env.local
chmod 600 .env.local
# Supply authorized values locally without printing them.
npm run db:verify
```

The expected proof is successful connection, migration observation, parameterized write/read verification, and transaction rollback verification. Never point this proof at production.

## Current external service inventory

| Service/provider | Current role | Architectural status | Credential handling / replacement |
| --- | --- | --- | --- |
| GitHub | Private source repository and Actions CI | Engineering continuity source, not product architecture | Authorized account access outside Git; replacement hosting requires an explicit continuity migration. |
| npm registry | Locked Node dependency retrieval | Package distribution only | `package-lock.json` is authoritative; do not change dependencies merely to work around a transient outage. |
| Standards-compatible PostgreSQL | Shared persistence technology | Required persistence contract behind the internal boundary | Generic `DATABASE_URL` / `DATABASE_DIRECT_URL`, supplied outside Git. |
| Neon | Dedicated hosted development database used for B3 proof | Current provider only; no Neon API in application/domain code | If unavailable, provision an authorized compatible PostgreSQL database and replay migrations plus `db:verify`. |
| Next.js | B2 application shell runtime used by B4 Preview | Selected engineering framework, subordinate to Canonical Architecture | `NEXT-SEC-2026-08` is retired; any future security concern requires a new current-evidence gate. |
| Vercel | B4 deployment provider; project `inomasa` hosts one protected Preview | Provider implementation only, not an architecture boundary | Framework Preset `Next.js`, Node `22.x`, Vercel Authentication on all Previews, Git Fork Protection enabled, no Preview environment variables, and no remaining automation bypass after proof. See [`docs/engineering/deployment-foundation.md`](docs/engineering/deployment-foundation.md). |
| Codex / OpenCode / ChatGPT | Optional engineering operators | Replaceable tools, never authority or state storage | Local/provider credentials remain outside Git; all tools follow `AGENTS.md`. |

No Arc, Circle, wallet, x402, hosted-agent, production database, or production deployment integration exists at this checkpoint.

## Recovery and takeover rules

- **Current device unavailable:** use another suitable workstation, clone `main`, and complete the clean-clone takeover. Do not copy an old working directory as the new source of truth.
- **ChatGPT or an AI tool unavailable:** a human or alternative AI reads this file, `AGENTS.md`, source hierarchy, safety documentation, Git history, and CI. No conversation reconstruction is required.
- **Codex unavailable or unsafe:** use OpenCode or a human workflow. On Ubuntu Proot, retain the B0 limitation; elsewhere use the least-privilege supported mode.
- **PostgreSQL provider unavailable:** do not redesign application code. Provision an authorized standards-compatible PostgreSQL development database, set generic local variables, replay versioned migrations, and run `npm run db:verify`.
- **GitHub temporarily unavailable:** preserve the last verified clone and work offline only when safe. Do not declare a merge/gate accepted until the authoritative origin and `main` CI are available again.
- **CI unavailable:** local evidence may diagnose work, but cannot replace the required observed `main` CI evidence for an accepted gate.
- **Canonical Architecture unavailable:** continue only mechanical, non-semantic diagnosis. Pause any structural, domain, authority, or product decision until authorized access is restored.
- **Credential loss or suspected compromise:** do not record recovery material here. Stop affected access, use the provider/account recovery process, rotate credentials, and re-run the relevant verification before resuming.

## Exact next step

B4 is complete. Do not begin B5 until a later explicit task authorizes its scope
and acceptance criteria. Until then, preserve the protected Preview, keep
Production unexposed, retain `PG-TLS-SEMANTICS-01`, and make no product, domain,
authority, economic, wallet, settlement, evidence, agent, trust, risk, or capital
implementation change.
