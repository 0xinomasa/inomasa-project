# Inomasa

Private engineering repository for Inomasa, an application layer being designed for real economic activity and agentic workflows on Arc.

The current implementation combines a verified controlled-Alpha regression baseline
with a locally verified REV2 Checkpoint B Generic Business System. It includes four
reusable BUILD templates, generic multi-user/multi-Business genesis, a reusable
Business Package, data-driven Business Sites inside the same Next.js application,
and a modeled but locked MIGRATE entry boundary. The accepted Signal Forge and Ops
Pilot economy remains intact as regression evidence, with explicit control/Treasury
bindings, exact USDC commerce and settlement state, a PostgreSQL Alpha schema, a
Circle Developer-Controlled Wallet EOA adapter for Arc Testnet, and an application
dashboard that reports what is connected versus pending. The paid service executor
is settlement-gated and produces a digest-bound live Arc network snapshot. The first
controlled vertical is now verified: two Circle EOA Treasuries, one real `0.250000`
Arc Testnet USDC service settlement, exact revenue/cost allocation, narrow Evidence,
and application-visible paid delivery. A second real `0.100000` settlement is also
verified after an operator-invoked Agent request passed a persisted, non-delegable
Human grant with exact offer, counterparty, amount, cumulative allowance, expiry,
and revocation controls. The Agent has no wallet custody or LLM authority. All
actors remain synthetic/common-control and the money remains testnet value.

B0-B5 and the old B6/B7/B8 and R1-R5 sequences remain historical lineage. The
active controlled-Alpha program is defined by
[`Inomasa Alpha Implementation & Testnet Realization v1.0 — REV2`](docs/engineering/inomasa-alpha-implementation-and-testnet-realization-v1.0.md).
The verified fixtures remain regression evidence while the system is generalized;
Capital is Checkpoint F, not the automatic next implementation step.

For takeover, current gate status, supported environments, external-provider inventory, and recovery steps, start with [`PROJECT_STATE.md`](PROJECT_STATE.md). Repository evidence—not a device, chat, or AI platform—is the continuity source.

## Authority

[`Inomasa Concept & Architecture v1.0`](docs/architecture/inomasa-concept-and-architecture-v1.0.md)
is the active product and system-architecture authority. The REV2 document above is
the active Alpha implementation guide, while accepted GitHub `main` remains mutable
engineering truth. Inomasa Canonical Architecture v1.0 is
`SUPERSEDED / HISTORICAL`. See the complete
[`source hierarchy`](docs/engineering/source-hierarchy.md).
The lightweight [`engineering documentation index`](docs/engineering/README.md)
separates active guidance, operational references, and historical evidence.

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
fails closed and labels those integrations `NOT_CONFIGURED`. With a migrated and
bootstrapped database, it displays the actual Business, Treasury, obligation,
settlement, ledger, service, and Evidence state available in that explicitly
selected environment. Published protected-Alpha Business Sites are served from
Business data at `/business/<business-slug>`; they are not separate deployments.

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
test/        application, domain, adapter-contract, and economic-correctness tests
```

The physical folders preserve a modular monolith. They do not imply that product
architecture responsibilities are microservices. PostgreSQL/Kysely and Circle SDK types remain
inside `src/platform/`; Business rules depend on module ports rather than vendor SDKs.

## Controlled Alpha bootstrap

After applying migrations against an isolated local development database:

```bash
npm run alpha:bootstrap
```

The command creates the `Signal Forge` and `Ops Pilot` regression fixtures once and
reports `ALREADY_EXISTS` on replay. These common-control objects are control
specimens, not the generic REV2 Business model. The command does not create a
Circle wallet or submit a transfer.

Create a fresh common-control Business from one of the four generic BUILD templates:

```bash
npm run business:create -- \
  --template api-data-compute \
  --name "Example Data Business" \
  --slug example-data-business \
  --controller-id usr_alpha_operator \
  --controller-name "Inomasa Alpha Operator"
```

The command creates the Business, control, reusable Business Package read model,
protected Business Site data, and a pending logical Treasury binding in one database
transaction. It does not provision a provider wallet, transfer USDC, or claim an
independent actor. MIGRATE requests fail closed while that entry route remains
`LOCKED / NOT YET OPEN`.

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

Prepare the bounded Agent-triggered repeat purchase idempotently, then pass its
explicit settlement and service IDs to the same execution scripts:

```bash
npm run alpha:agent-purchase
npm run alpha:submit-settlement -- set_arc_snapshot_agent_v1
npm run alpha:reconcile-settlement -- set_arc_snapshot_agent_v1
npm run alpha:execute-service -- svc_arc_snapshot_agent_v1 obl_arc_snapshot_agent_v1
```

The Agent command records a separate Agent principal and provider-of-record,
Standing Grant, Action Intent, policy decision, Execution Authorization, and atomic
allowance consumption before creating the economic obligation. Replays do not spend
allowance twice or create a second obligation.

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

B4 remains `VERIFIED — PASS` historical foundation evidence. The current controlled
Alpha also has a verified protected Vercel Preview recorded in
[`PROJECT_STATE.md`](PROJECT_STATE.md) and the historical
[`Alpha execution record`](docs/engineering/alpha-execution.md). No Production
deployment or public anonymous access is authorized. A significant hosted-runtime
change requires new protected Preview evidence before that change is considered
runtime-verified.

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
