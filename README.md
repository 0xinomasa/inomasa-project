# Inomasa

Private engineering repository for Inomasa, an application layer being designed for real economic activity and agentic workflows on Arc.

The accepted implementation on `main` is the A–H **Verified Controlled Arc Testnet
Economic/System Kernel** plus accepted Work 1–3 Human Product Alpha realization.
The kernel includes four reusable BUILD templates, generic multi-user and
multi-Business genesis, reusable Business and Agent systems, generated Business
Sites, bounded Agent authority, ERC-8004 identity linkage, direct Arc USDC and x402
commerce, ERC-8183 funded work, exact economic posting, contextual Economic
History, provider-specific Capital decisions/allocation/later use, PostgreSQL, and
source-scoped proof observability. Work 1 adds controlled invited product
authentication/session, stable Human Principal mapping, four-template BUILD entry,
controller-scoped My Businesses, Business creation/persistence, tenant-isolated
Business Workspace entry, and the accepted product shell. Work 2 adds operable
Product/Service drafts, bounded Agents, Treasury provisioning, and controlled
funding-state refresh in Business context. Work 3 adds human-confirmed canonical
x402 purchases and ERC-8183 evaluated jobs, honest failure/unknown handling, and
contextual Economic History without a second ledger. MIGRATE is modeled but
remains user-facing locked. Human-Operable Business Product Alpha as a whole is not
yet verified; its normative realization contract is
[`Post-H Product Realization`](docs/engineering/post-h-product-realization.md).

Signal Forge, Ops Pilot, and the fresh four-template Reference Economy remain
common-control regression/proof fixtures rather than product-capacity or
independent-demand evidence. Circle Developer-Controlled EOA accounts remain
platform-controlled external execution infrastructure, not Business/Agent identity
or user custody. All money is Arc Testnet USDC; no Production/mainnet authority is
implied.

B0-B5 and the old B6/B7/B8 and R1-R5 sequences remain historical lineage. The
active controlled-Alpha program is defined by
[`Inomasa Alpha Implementation & Testnet Realization v1.0 — REV2`](docs/engineering/inomasa-alpha-implementation-and-testnet-realization-v1.0.md).
Checkpoints A–H are accepted on GitHub `main` as a **Verified Controlled Arc Testnet
Economic/System Kernel**. Work 1 — Fresh human to Business Workspace — is accepted
through pull request `#40`, implementation head
`b4e006e2114df3a045acc615b6b11f6a00355b5f`, merge
`27b30747c4a2fd14b1b29a1ee221fb99c893bd1a`, and successful Engineering
verification run `33279953605`. Work 2 — Operational Workspace — is accepted
through pull request `#42`, implementation head
`66dfffd8c8ad21dc0fcc4c9e74d8e7dc53e76e91`, merge
`9fc197895a2db49398620d7355cbb7d79f549364`, PR Engineering verification run
`33289735811`, and accepted-main run `33303102348`. Work 3 — Human-triggered
economic operation — is accepted through pull request `#44`, final head
`43faec172ec23990a6762f054f43e77003be0e17`, merge
`72318b4b99385af431d529c22a5f518733bb719b`, final PR run `33337590302`, and
accepted-main run `33337675145`. Work 4–5 have not started. The Human-Operable
Business Product Alpha therefore remains `NOT YET VERIFIED / REALIZATION IN
PROGRESS`. No Production, mainnet, public anonymous access, live MIGRATE,
unrestricted Agent authority, or public/Production Capital scope is implied.

For takeover, current gate status, supported environments, external-provider inventory, and recovery steps, start with [`PROJECT_STATE.md`](PROJECT_STATE.md). Repository evidence—not a device, chat, or AI platform—is the continuity source.

## Authority

[`Inomasa Concept & Architecture v1.0`](docs/architecture/inomasa-concept-and-architecture-v1.0.md)
is the active product and system-architecture authority. The REV2 document above is
the active Alpha implementation guide, while [`Post-H Product Realization`](docs/engineering/post-h-product-realization.md)
is the normative Human-Operable Product Alpha realization authority after A–H.
Accepted GitHub `main` remains mutable engineering truth. Inomasa Canonical Architecture v1.0 is
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

B4 remains `VERIFIED — PASS` historical foundation evidence. Work 1 also has a
protected Vercel Preview recorded in [`PROJECT_STATE.md`](PROJECT_STATE.md). The
accepted Work 1 Preview source is commit
`b4e006e2114df3a045acc615b6b11f6a00355b5f`; its protected runtime evidence remains
valid after the Git connection was removed.

The Work 1 merge briefly triggered a Vercel Production deployment because the
project was Git-connected with `main` as its Production branch. This was an
operational side effect, not Production authority. The Vercel project was then
paused and verified to return `503 DEPLOYMENT_PAUSED`, and the project-level Git
repository connection was disconnected so future Git pushes/merges do not
automatically deploy. Existing Preview artifacts remain available and protected.
Production/public exposure remains unauthorized. A future reconnect or Production
resume requires explicit owner authorization and the applicable exposure gates.

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
