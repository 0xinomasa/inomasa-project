# Inomasa

Private engineering repository for Inomasa, an application layer being designed for real economic activity and agentic workflows on Arc.

The current implementation is an accelerated controlled Alpha on top of the B0-B5
engineering foundation. It includes deterministic versioned Business genesis, two
interdependent common-control test Business templates, explicit control/Treasury
bindings, exact USDC commerce and settlement state, a PostgreSQL Alpha schema, a
Circle Developer-Controlled Wallet EOA adapter for Arc Testnet, and an application
dashboard that reports what is connected versus pending. The paid service executor
is settlement-gated and produces a digest-bound live Arc network snapshot; it cannot
run until the corresponding Arc settlement is reconciled as complete.

B5 Testnet Scope & System Realization Entry remains `VERIFIED — PASS` historical
lineage. The old standalone B6/B7/B8 sequence is retired. BUILD is now active through
one vertical Alpha program that compresses the final R1-R5 dependency logic. MIGRATE
is deferred; CAPITAL follows a credible commerce/Evidence loop. See
[`docs/engineering/alpha-execution.md`](docs/engineering/alpha-execution.md).

For takeover, current gate status, supported environments, external-provider inventory, and recovery steps, start with [`PROJECT_STATE.md`](PROJECT_STATE.md). Repository evidence—not a device, chat, or AI platform—is the continuity source.

## Authority

The **Inomasa Canonical Architecture v1.0** is the sole active architecture authority. Repository documentation summarizes implementation guardrails but does not replace or amend the Canonical Architecture. See [`docs/engineering/source-hierarchy.md`](docs/engineering/source-hierarchy.md).

## Requirements

- Node.js 22 through NVM
- npm 10.9.8 (the recorded B0 baseline)
- Git
- a suitable Node.js development environment; Android Ubuntu Proot is proven but not required

## Clone and install

```bash
git clone https://github.com/0xinomasa/inomasa-project.git
cd inomasa-project
nvm install
nvm use
npm ci
```

On Android, keep repositories inside the Ubuntu filesystem rather than `/sdcard` or other shared storage. A laptop/PC can take over from a clean clone; it must not depend on files copied from the phone.

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000`. Without database/provider configuration the dashboard
fails closed and labels those integrations `NOT_CONFIGURED`. With the local
development database migrated and bootstrapped, it displays the two actual local
Business records and their pending Treasury state.

For a production-mode local run:

```bash
npm run build
npm start
```

## Verify

Run the complete local quality gate:

```bash
npm run verify
```

Or run checks individually:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The Next.js build output is written to `.next/` and is intentionally ignored by Git.

## Current structure

```text
src/
  app/       Next.js composition root and Alpha dashboard
  modules/   Business and commerce policy/state
  platform/  PostgreSQL, Arc, and Circle adapters
  shared/    domain-neutral shared code only
migrations/  ordered, version-controlled PostgreSQL schema evolution
scripts/     engineering operations, including migration/proof commands
test/        structural application-shell tests
```

The physical folders preserve a modular monolith. They do not imply that Canonical
semantic domains are microservices. PostgreSQL/Kysely and Circle SDK types remain
inside `src/platform/`; Business rules depend on module ports rather than vendor SDKs.

## Controlled Alpha bootstrap

After applying migrations against an isolated local development database:

```bash
npm run alpha:bootstrap
```

The command creates `Signal Forge` and `Ops Pilot` once and reports
`ALREADY_EXISTS` on replay. It does not create a Circle wallet or submit a transfer.

Prepare the versioned offer, common-control obligation, and idempotent settlement
authorization:

```bash
npm run alpha:prepare-commerce
```

Circle provisioning is restricted to `PRIVATE_ARC_TESTNET` and requires separately
registered private configuration:

```bash
npm run alpha:wallets
```

Do not run this until the Circle API key, registered entity secret, and dedicated
wallet set are configured outside Git. Current external-proof status and the exact
sequence are in `PROJECT_STATE.md` and the Alpha execution document.

After the payer Treasury is faucet-funded, submit and reconcile the selected direct
Circle transfer:

```bash
npm run alpha:submit-settlement
npm run alpha:reconcile-settlement
```

Reconciliation verifies the exact payer, recipient, micro-USDC amount, successful
receipt, and Arc chain before posting revenue/cost. Only after it reaches `COMPLETE`
may the paid service execute:

```bash
npm run alpha:execute-service
```

The service fetches a current Arc network snapshot, stores the output and its
SHA-256 digest, and records narrow delivery Evidence. It is deterministic software,
not an Agent or LLM claim.

## Persistence workflow

Copy the example locally, replace every placeholder, and keep the file private:

```bash
umask 077
cp .env.example .env.local
chmod 600 .env.local
```

`DATABASE_URL` is the runtime/application connection. `DATABASE_DIRECT_URL` is the administrative/migration connection. A hosted provider may supply pooled and direct variants; application code does not use provider-specific variable names or APIs.

Apply all pending migrations, then run the non-domain write/read/rollback proof:

```bash
npm run db:verify
```

Run this only against an isolated development/test database. Clean reconstruction means creating an empty PostgreSQL database and running `npm run db:migrate`; manual dashboard schema changes are not authoritative. See [`docs/engineering/persistence-foundation.md`](docs/engineering/persistence-foundation.md).

## Deployment foundation

B4 is `VERIFIED — PASS`. The accepted shell is available only through the protected
Vercel Preview recorded in
[`docs/engineering/deployment-foundation.md`](docs/engineering/deployment-foundation.md).
No Production deployment or public anonymous access is authorized. The Alpha branch
must produce a new protected Preview before its hosted runtime is considered proven.

## Local environment

Never commit `.env.local`, credentials, API keys, wallet material, seed phrases, private keys, production identifiers, or copied secret values.

Values prefixed with `NEXT_PUBLIC_` are bundled into browser code. They must never contain secrets.

## Agent-assisted development

Both Codex and OpenCode use the root [`AGENTS.md`](AGENTS.md). Start either tool from the repository root so the shared instructions are discovered.

OpenCode:

```bash
opencode
```

Codex on the B0 Ubuntu Proot environment requires this temporary workaround:

```bash
codex --sandbox danger-full-access
```

This disables Codex's internal sandbox. Use it only from this trusted repository after confirming the Git worktree, and never make it a global default. Read [`docs/engineering/environment-and-safety.md`](docs/engineering/environment-and-safety.md) before use.

## Git workflow

The private GitHub repository on `main` is the engineering source of truth. B1 establishes the initial baseline directly; subsequent work should use focused branches and reviewed commits. See [`docs/engineering/git-workflow.md`](docs/engineering/git-workflow.md).
