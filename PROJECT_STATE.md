# Inomasa project state and takeover

This file is the concise repository-native entry point for a human or AI operator taking over Inomasa engineering. It records current mutable state separately from durable operating rules. Chat history is context only and is never required engineering evidence.

## Current mutable state

| Item | Accepted state |
| --- | --- |
| Source repository | Private `0xinomasa/inomasa-project` |
| Accepted branch | `main` |
| Active product/architecture authority | [`Inomasa Concept & Architecture v1.0`](docs/architecture/inomasa-concept-and-architecture-v1.0.md): `ACCEPTED / ACTIVE` |
| Active Alpha implementation guide | [`Inomasa Alpha Implementation & Testnet Realization v1.0 — REV2`](docs/engineering/inomasa-alpha-implementation-and-testnet-realization-v1.0.md): `ACCEPTED / ACTIVE` |
| Historical architecture status | Inomasa Canonical Architecture v1.0 is `SUPERSEDED / HISTORICAL`; it and B0-B5-era planning remain lineage, not current authority |
| Active realization program | **Controlled Arc Testnet Product Alpha REV2**; Checkpoint A — Product authority & genericization entry is complete through this documentation-only migration |
| REV2 completion status | **IN PROGRESS**; Checkpoints A and B are accepted and verified within their scoped gates; Checkpoints C-H and the `CONTROLLED ARC TESTNET PRODUCT ALPHA — VERIFIED` completion gate are not verified |
| Standing execution authorization | **ACTIVE — REV2 CHECKPOINTS C-H, SEQUENTIAL ONLY**. The owner authorized continuous execution from Checkpoint C through H on 27 August 2026. Each checkpoint still requires its predecessor accepted on GitHub `main`, checkpoint-specific research/proof/regression, persistent-state closeout, PR/CI/review/merge, and observed accepted-main evidence before advancing. This authorization does not extend beyond H or to Production/mainnet, public anonymous access, live MIGRATE, unrestricted Agent authority, or Production/public Capital exposure, and remains active until completed, revoked, or changed by the owner. |
| Next implementation checkpoint | **Checkpoint C — Generic Agent + ERC-8004: AUTHORIZED / READY TO START**; Capital remains Checkpoint F and cannot be started before C-E are accepted |
| Current execution status | **ACTIVE UNDER STANDING SEQUENTIAL AUTHORIZATION C-H**; begin Checkpoint C only, then advance through D-H strictly after each predecessor is accepted on GitHub `main` |
| B5 result | `VERIFIED / PASS` historical decision-and-continuity evidence; Human-Controlled Business Entry is lineage rather than the current standalone realization boundary |
| B3 merge evidence | `7dfa25b1d6ce005f7de7c3c06ea19a22e0136ec5` |
| B3 main CI evidence | Engineering verification run `32603268206`, `push/main`, completed successfully |
| B4 acceptance evidence | Pull request `#7`, merge `d2829c35e52fc59d8579e16d88956997cb79e681` |
| B4 accepted-main CI evidence | Engineering verification run `32704891257`, `push/main`, completed successfully, including PostgreSQL proof |
| B5 acceptance evidence | Pull request `#10`, merge `395dfd9aa105cdd95088ffd5602739d6c79cbba5` |
| B5 accepted-main CI evidence | Engineering verification run `32794327644`, `push/main`, completed successfully, including PostgreSQL proof |
| Alpha implementation checkpoint | Commit `724e96b175b2dbe08e24f70a5f98c8f8f95b800a`, pull request `#12`, merge `6ac8045db9bb762b529f145c589dced39b901cf1`; PR verification run `32822885262` and accepted-main run `32823716812` completed successfully with 19/19 tests, production build, and clean PostgreSQL migrations `001`-`004` |
| First integrated Alpha proof | Pull request `#14`; two Circle Developer-Controlled EOA Treasuries `ACTIVE`; settlement `set_arc_snapshot_v1` completed for exact `0.250000` Arc Testnet USDC in transaction `0x887980b47c7c1eeb9f5457aa80323e9b03bd7934008811ef56fbcaf1820b3913`; paid service `svc_arc_snapshot_v1` completed from Arc block `58765304` |
| Bounded Agent proof | Commits `262aa5f` and `8fc9657`; Agent `agt_ops_pilot_buyer_v1` is provider-attributed, operator-invoked, and non-custodial; exact offer/counterparty/per-action/cumulative/expiry/revocation policy issued and consumed authorization `xau_arc_snapshot_agent_v1`; settlement `set_arc_snapshot_agent_v1` completed for `0.100000` Arc Testnet USDC in transaction `0x4e0c30f33cf96364469fa814fe61388199a0ba9cd9581d6b10ee7e09a1f44093`; service `svc_arc_snapshot_agent_v1` completed from Arc block `58768105` |
| Circle Gateway x402 proof | Implementation commit `1c15f7d2a98429d4c62f0ee718f30a624106cfee`, pull request `#16`, merge `8d60744ec7c330a0403ef4787bc21634fbf2ed01`; final PR run `32839024137` and accepted-main run `32839154514` completed successfully. Ops Pilot deposited `1.000000` Arc Testnet USDC to Gateway in transaction `0x2280402061b6a7960efd6d24804a753310eba5e3f193b0a5a66225c11b7c2c53`; Agent payment `pay_arc_snapshot_x402_v1` settled exact `0.010000` USDC through x402 v2 `exact`, provider receipt `3d6239e1-9d29-46a0-bfb8-117578b9d1d4`; Gateway balances became payer `0.990000`, seller `0.010000`, pending zero; service `svc_arc_snapshot_x402_v1` completed from Arc block `58771214` |
| Current continuity checkpoint | REV2 Checkpoint B — Generic Business System is accepted on GitHub `main`; standing sequential authorization C-H is active and Checkpoint C is the current execution point |
| Checkpoint B acceptance evidence | Pull request `#22`; implementation commit `97ad37446d2701adedd165de19d3e67acc198d3a`; PR verification run `33024043557`; merge commit `104a7e75ced8def6841e86603ef68778baaa2375`; and accepted-main run `33024149185` completed successfully, including 31/31 tests, lint, typecheck, Next.js `16.3.3` production build, and clean PostgreSQL reconstruction through migration `007` plus write/read/rollback proof |
| Checkpoint B runtime evidence | Configured private-testnet migration/write-read/rollback passed; local production HTTP returned `200` for Home and `checkpoint-b-api-proof` plus expected `404` for an unknown site; automated visual browser proof remains unclaimed because `agent-browser` is not installed in the verified Ubuntu Proot profile |
| Checkpoint B generic proof instance | `Checkpoint B API Proof`, Business `biz_checkpoint_b_api_proof_a9f2e7fabf34`, template `api-data-compute@1`, route `/business/checkpoint-b-api-proof`, provenance `COMMON_CONTROL_TEST`, logical Treasury `PENDING`; no wallet provisioning, transfer, independent demand, or new economic activity was claimed |
| Authority migration local evidence | npm audit (0 vulnerabilities), lint, typecheck, 28/28 tests, Next.js `16.3.3` production build, migrations `001`-`006` already current, database write/read/rollback, local Markdown-link audit, and `git diff --check` passed; no product/provider/database behavior changed |
| Authority migration acceptance evidence | Pull request `#19`; implementation commit `751bd4c4d5e75b7a6fc8087c99034ae05089cf4e`; final PR head `218cdd273e9b6d291703e930aada1e4b768f2057`; final PR verification run `32949059522`; merge commit `d3cba7871204ba91a20094ce4353db0a650933b9`; and accepted-main run `32949201003` completed successfully, including clean PostgreSQL reconstruction/proof |
| B4 local pre-deployment evidence | Node `22.23.2`, npm `10.9.8`; clean install and audit (0 vulnerabilities), lint, typecheck, 6/6 tests, production build, and production-server HTTP `200` with expected Inomasa shell anchors |
| Product implementation boundary | The prior deterministic Business/economic kernel, bounded Agent authority/allowance, Circle EOA Treasury, direct Arc transfer, Gateway x402 adapter, settlement/economic allocation, paid HTTP resource/service, narrow Evidence, and dashboard remain implemented. Accepted Checkpoint B adds four generic templates, generic creation/multiplicity, Business Package/Site, and the locked MIGRATE boundary; ERC-8004 and generic Agent remain unimplemented Checkpoint C work |
| Verified private-testnet state | `Signal Forge`, `Ops Pilot`, the buyer Agent, and `Checkpoint B API Proof` remain synthetic/common-control. Three exact service obligations totaling `0.360000` USDC remain `SETTLED`; six economic entries, three settlement Evidence facts, and three service-delivery Evidence facts remain persisted exactly once. The new generic proof Business has only a `PENDING` logical Treasury and no economic activity |
| Repository continuity marker | `src/index.ts` `repositoryBaseline` is intentionally retained as a machine-readable descriptive marker maintained since B1. It is subordinate to the active authority documents and `PROJECT_STATE.md`, and it grants no runtime or product authority |
| Current blocking gate | No Checkpoint B blocker remains and Checkpoint C is authorized. Checkpoint C must start with current primary-source ERC-8004/Arc verification; `PG-TLS-SEMANTICS-01` remains active only for its scoped dependency change |
| Baseline fixture/product-label status | Signal Forge, Ops Pilot, the buyer Agent, and the current shell's `CAPITAL / NEXT` label remain verified baseline fixtures/UI output. They are not generic product capacity or active roadmap authority and are unchanged by this migration |
| Next.js security baseline | Next.js `16.3.3` is the selected patched Active LTS runtime following the [official 2026-08-25 security release](https://nextjs.org/blog/august-2026-security-release); pull request `#18`, merge `97608da2755bde50e900f71d5c94db9c931a7685`, and accepted-main run `32945917201` passed without product or database changes |
| First deployment evidence | Vercel deployment `dpl_HLPGUzp74Z1Yt3DunwgXvLVMddAt` from `48a980411f409f86f9e69fdf0b8e9a2119d17eac`, incorrectly targeted Production, ended `ERROR` (`STATIC_BUILD_NO_OUT_DIR`) |
| B4 protected Preview evidence | Vercel deployment `dpl_az1jRshRMZYn57RbFxsvkozLJZ2k` from accepted `main` commit `d75bcd5472f35f0cc962c6a420473957915153f6`; target `preview`, state `READY` |
| Deployment protection evidence | Anonymous request redirected to Vercel SSO without the shell; authorized request rendered expected shell anchors; temporary automation bypass removed and Vercel Authentication remained enabled |
| Alpha protected Preview evidence | Deployment `dpl_6XgtJVdU9uQPUb3jMz7g7UnodGKZ`; target Preview, state `READY`, protected render displayed both Businesses, exact amount, tx hash, `COMPLETE`, `REVENUE`, and `SERVICE_COST`; anonymous access remained HTTP `302` to Vercel SSO |
| Agent Alpha protected Preview evidence | Deployment `dpl_6rJLRfDT5SVXs35vbnDpEWLkkcK6`, target Preview, state `READY`; protected render displayed the Agent, scoped offer, `0.100000 / 0.200000 USDC` allowance, second settlement, and `COMPLETE`; anonymous access remained HTTP `302`; future-Preview env count and automation-bypass count were restored to zero |
| x402 Alpha protected Preview evidence | Deployment `dpl_2QPTA8bHtcK8BSzbw6PhzSN132Nu`, target Preview, state `READY`; protected render displayed Gateway x402, exact `0.010000 USDC`, receipt, and `COMPLETE`; protected endpoint returned HTTP `402` plus `PAYMENT-REQUIRED`, then HTTP `200` plus `PAYMENT-RESPONSE` for the committed paid payload; anonymous access remained HTTP `302` |
| Deployment state | The executed Alpha has a protected Preview `READY`; automation-bypass count and configured future-Preview environment-variable count were restored to zero after proof; no Production deployment or authority was created |

The inherited `PASS WITH WORKAROUND` is the Ubuntu Proot Codex sandbox limitation documented in [`docs/engineering/environment-and-safety.md`](docs/engineering/environment-and-safety.md). It is not a persistence failure and is not a requirement on other devices.

## Open mandatory gates

- `PG-TLS-SEMANTICS-01` — **ACTIVE**. Blocks `pg` 9, `pg-connection-string` 3, or an equivalent TLS-semantics change until certificate and hostname verification are re-proven. It does not block the pinned B3 foundation.

Do not infer changes to `PG-TLS-SEMANTICS-01` from a newer version, provider
dashboard message, or prior chat. Its status changes require committed evidence and
an observed successful `main` CI run.

## Open non-blocking maintenance observations

- `GHA-ACTIONS-RUNTIME-01` — **ACTIVE / NON-BLOCKING**. Accepted-main authority
  migration run `32949201003` passed, but GitHub still warned that
  `actions/checkout@v4` and
  `actions/setup-node@v4` target deprecated Node.js 20 internally and were forced
  to run on Node.js 24. This does not change the repository's Node.js 22
  application/runtime contract and did not fail verification. Before changing the workflow,
  review current primary GitHub Actions guidance and verify a focused CI update;
  do not mix that maintenance into product realization.

- `CIRCLE-DNS-ANDROID-01` — **ACTIVE / ENVIRONMENT-SCOPED / NON-BLOCKING**.
  The current ISP resolver intercepted `api.circle.com` as
  `internetpositif.ioh.co.id`, causing correct TLS hostname verification to stop
  Circle calls. DNSSEC-valid DNS-over-HTTPS returned Circle's Cloudflare
  addresses and TLS verification then passed. A temporary exact host pin was used
  only for the observed private-testnet operations and removed afterward. Never
  disable TLS verification; prefer a trusted Private DNS/VPN or another clean
  network before subsequent provider operations.

## Durable continuity rules

1. GitHub `main`, committed specifications, migrations, tests, CI evidence, and explicit gate records are the engineering continuity source.
2. [`docs/architecture/inomasa-concept-and-architecture-v1.0.md`](docs/architecture/inomasa-concept-and-architecture-v1.0.md) is the active product and system-architecture authority.
3. [`docs/engineering/inomasa-alpha-implementation-and-testnet-realization-v1.0.md`](docs/engineering/inomasa-alpha-implementation-and-testnet-realization-v1.0.md) is the active Alpha implementation guide and cannot silently amend the Concept & Architecture contract.
4. Devices are replaceable development clients. Android + Termux + Ubuntu Proot is proven, not architecturally required.
5. Operators and AI tools are replaceable. Codex, OpenCode, ChatGPT, another AI, or a human engineer receives no authority from chat history or tool identity.
6. PostgreSQL semantics and the internal persistence boundary are durable; Neon is the provider used for B3 hosted proof, not an application boundary.
7. Credentials and recovery material are supplied through authorized channels outside Git. Never commit or paste them into documentation, issues, CI logs, or chat.
8. After every significant checkpoint decision or accepted merge, update this file
   in the same change whenever practical. Record the latest completed checkpoint,
   evidence, open holds, and exact next execution point. A future operator must not
   need historical chat to discover state.

## Invariant destination, adaptable execution route

The engineering destination is set by the two active authority documents, accepted
state and next checkpoint in this file, repository safety rules, acceptance
criteria, and required verification evidence. An execution route is adaptable: it
is a scoped profile selected for the actual device, operating system, operator, AI
tool, and infrastructure capabilities in front of the operator.

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
| Next.js `16.3.3` | Controlled-Alpha application runtime used by the protected Preview | Patched Active LTS engineering framework, subordinate to active Inomasa product architecture | The 2026-08-25 security maintenance changed only the pinned Next.js package family and lockfile metadata; future security concerns require new current evidence. |
| Arc Testnet | Required Alpha chain and current real-execution target | Exact chain/asset registry and the first real USDC settlement are verified | Chain ID `5042002`; testnet identifiers and facts must never be reused as mainnet authority. |
| Circle Developer-Controlled Wallets | Selected and verified Alpha EOA Treasury execution adapter | Two platform-controlled external account bindings are active behind an Inomasa port; neither is identity, user custody, or Protected Treasury | API key, registered entity secret, and wallet-set ID stay outside Git; User-Controlled EOA remains the user-custody/exit reference path. |
| Circle Gateway / Nanopayments | Selected and verified Alpha x402 v2 `exact` rail | One-time EOA deposit, Circle Signing API, public Gateway facilitator, and provider-reported receipts sit behind Inomasa x402 and persistence ports | No private key is introduced; exact payloads are persisted before facilitator handoff. The EOA deposit and seven-day minimum signature validity are explicit operational/security tradeoffs; generic x402 data remains portable while the Gateway adapter is replaceable. |
| Vercel | Deployment provider; project `inomasa` hosts the protected Alpha Preview | Provider implementation only, not an architecture boundary | Framework Preset `Next.js`, Node `22.x`, Vercel Authentication on all Previews, Git Fork Protection enabled, no Preview environment variables, and no remaining automation bypass after proof. `inomasa.vercel.app` remains intentionally unaliased because the current plan cannot protect production domains. See [`docs/engineering/deployment-foundation.md`](docs/engineering/deployment-foundation.md). |
| Codex / OpenCode / ChatGPT | Optional engineering operators | Replaceable tools, never authority or state storage | Local/provider credentials remain outside Git; all tools follow `AGENTS.md`. |

The repository now contains an Arc Testnet registry and Circle
Developer-Controlled Wallet EOA adapter and Circle Gateway x402 adapter.
Private-testnet database state has two common-control test Businesses, two active
Circle Treasury bindings, three settled obligations, exact seller/buyer economic
entries, and six narrow Evidence facts. Circle and Arc report successful direct
`0.250000` and `0.100000` USDC transfers; Gateway reports the exact `0.010000`
x402 payment and matching payer/seller balances; all three settlement-gated
services are complete. No credential is committed, and no hosted Agent, Agent
wallet custody, LLM authority, Production database, or Production deployment exists.

## Recovery and takeover rules

- **Current device unavailable:** use another suitable workstation, clone `main`, and complete the clean-clone takeover. Do not copy an old working directory as the new source of truth.
- **ChatGPT or an AI tool unavailable:** a human or alternative AI reads this file, `AGENTS.md`, source hierarchy, safety documentation, Git history, and CI. No conversation reconstruction is required.
- **Codex unavailable or unsafe:** use OpenCode or a human workflow. On Ubuntu Proot, retain the B0 limitation; elsewhere use the least-privilege supported mode.
- **PostgreSQL provider unavailable:** do not redesign application code. Provision an authorized standards-compatible PostgreSQL development database, set generic local variables, replay versioned migrations, and run `npm run db:verify`.
- **GitHub temporarily unavailable:** preserve the last verified clone and work offline only when safe. Do not declare a merge/gate accepted until the authoritative origin and `main` CI are available again.
- **CI unavailable:** local evidence may diagnose work, but cannot replace the required observed `main` CI evidence for an accepted gate.
- **Active authority document missing or unreadable:** continue only mechanical,
  non-semantic diagnosis. Restore the accepted repository copy from Git history
  before structural, domain, authority, or product work.
- **Credential loss or suspected compromise:** do not record recovery material here. Stop affected access, use the provider/account recovery process, rotate credentials, and re-run the relevant verification before resuming.

## Exact next step

Begin **REV2 Checkpoint C — Generic Agent + ERC-8004** under the active standing
sequential authorization for Checkpoints C-H. Start with current primary-source
research and preserve the fixed Alpha economy as regression fixtures until generic
replacement proof passes. Advance to each later checkpoint only after the preceding
checkpoint is accepted on GitHub `main` with its required proof and continuity
closeout.

Do not skip to ERC-8183 or Capital, and do not expand beyond Checkpoint H to
Production/mainnet, public anonymous access, live MIGRATE, unrestricted Agent
authority, or Production/public Capital exposure. Follow the active [Alpha
Realization guide](docs/engineering/inomasa-alpha-implementation-and-testnet-realization-v1.0.md).
