# Inomasa

Private engineering repository for Inomasa, an application layer being designed for real economic activity and agentic workflows on Arc.

The current implemented baseline is a responsive Next.js application skeleton, a
provider-portable PostgreSQL persistence foundation, and a protected Vercel Preview.
It represents the BUILD, MIGRATE, and CAPITAL entry boundaries without implementing
product behavior. The only schema object is an explicitly non-domain engineering
probe used to verify migration, write/read, and transaction behavior. It contains
no wallet integration, authentication, smart contract, Arc integration, x402
implementation, business schema, hosted agent, evidence logic, capital logic, or
Production deployment configuration.

B5 is limited to the repository-native Testnet Scope & System Realization Entry
decision. It selects Human-Controlled Business Entry as the first bounded
realization candidate while explicitly deferring code, schema, authentication,
wallet/provider selection, and external configuration. See
[`docs/engineering/b5-scope-and-system-realization-entry.md`](docs/engineering/b5-scope-and-system-realization-entry.md).

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

Open `http://localhost:3000`. The B2 page is a presentation shell only; no economic capability or external integration is active.

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
  app/       Next.js web shell and composition root
  modules/   future bounded business modules
  platform/  infrastructure adapters, including the PostgreSQL boundary
  shared/    domain-neutral shared code only
migrations/  ordered, version-controlled PostgreSQL schema evolution
scripts/     engineering operations, including migration/proof commands
test/        structural application-shell tests
```

The physical folders preserve a modular monolith. They do not imply that Canonical semantic domains are microservices. B3 deliberately introduces no named business module and keeps PostgreSQL/Kysely inside `src/platform/persistence/`.

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

B4 is `VERIFIED — PASS`. The B2 shell is available only through the protected
Vercel Preview recorded in
[`docs/engineering/deployment-foundation.md`](docs/engineering/deployment-foundation.md).
No Production deployment or product behavior is authorized.

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
