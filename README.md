# Inomasa

Private engineering repository for Inomasa, an application layer being designed for real economic activity and agentic workflows on Arc.

The current B2 baseline is a responsive Next.js application skeleton. It represents the BUILD, MIGRATE, and CAPITAL entry boundaries without implementing product behavior. It contains no wallet integration, authentication, smart contract, Arc integration, x402 implementation, database, hosted agent, evidence logic, capital logic, or production deployment configuration.

## Authority

The **Inomasa Canonical Architecture v1.0** is the sole active architecture authority. Repository documentation summarizes implementation guardrails but does not replace or amend the Canonical Architecture. See [`docs/engineering/source-hierarchy.md`](docs/engineering/source-hierarchy.md).

## Requirements

- Node.js 22 through NVM
- npm 10.9.8 (the recorded B0 baseline)
- Git
- Ubuntu Proot in Termux for primary Android development

## Clone and install

```bash
git clone https://github.com/0xinomasa/inomasa-project.git
cd inomasa-project
nvm install
nvm use
npm ci
```

Keep repositories inside the Ubuntu filesystem. Do not place the working tree under `/sdcard` or other Android shared storage.

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

## B2 structure

```text
src/
  app/       Next.js web shell and composition root
  modules/   future bounded business modules
  platform/  future external/vendor adapters
  shared/    domain-neutral shared code only
test/        structural application-shell tests
```

The physical folders preserve a modular monolith. They do not imply that Canonical semantic domains are microservices. B2 deliberately introduces no named business module or vendor adapter.

## Known framework gate

B2 is intentionally non-production. Before B3 or any deployment, update Next.js using the fixed release from the official security update scheduled for 26 August 2026, then repeat `npm audit` and the complete verification suite. See [`docs/engineering/environment-and-safety.md`](docs/engineering/environment-and-safety.md).

## Local environment

Create a local file only when a later phase needs runtime configuration:

```bash
umask 077
cp .env.example .env.local
chmod 600 .env.local
```

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
