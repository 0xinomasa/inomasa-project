# Post-H Product Realization Record

**Status:** NORMATIVE PRODUCT-REALIZATION AUTHORITY AFTER A–H
**Current state:** `KERNEL VERIFIED` · `HUMAN-OPERABLE BUSINESS PRODUCT ALPHA NOT YET VERIFIED / REALIZATION IN PROGRESS`
**Scope:** controlled Arc Testnet, Protected Preview, owner/common-control Alpha only
**Baseline:** accepted GitHub `main` at `3647e3462bf0c77024209b5550a6f04ca5e53e1e`

## 1. Purpose and authority placement

This is one coherent product-realization record for the state after REV2
Checkpoints A–H. It records the decisions required to turn the verified economic
and system kernel into a human-operable Business product. It is not a new
architecture, checkpoint, phase, or implementation result.

The authority hierarchy is:

1. **Inomasa Concept & Architecture v1.0** — highest product and system
   architecture authority.
2. **This Post-H Product Realization Record** — normative Human-Operable Business
   Product Alpha realization authority after A–H, subordinate to the Concept.
3. **Inomasa Alpha Implementation & Testnet Realization v1.0 — REV2** — active
   kernel contracts, implementation semantics, protocol behavior, and A–H
   history/evidence authority, subordinate to the Concept and not rewritten here.
4. **Accepted GitHub `main`** — current implementation, tests, migrations, CI,
   and provider/chain evidence truth.
5. **`PROJECT_STATE.md`** — current takeover/state index that points to the
   evidence; it is not a replacement for the evidence or this record.
6. **Inomasa Canonical Architecture v1.0 and earlier records** — superseded
   historical lineage unless an active authority explicitly carries a meaning
   forward.

The record does not claim that the product layer is already implemented. It
defines what the next engineering work must realize and how that realization will
be proven.

## 2. Current truth and status semantics

### 2.1 Verified now

- A–H are a **Verified Controlled Arc Testnet Economic/System Kernel**.
- The accepted kernel includes generic Business semantics and control, bounded
  Agent identity/authority, ERC-8004 identity/action linkage, x402 exact payment
  behavior, ERC-8183 funded-work behavior, Treasury and Circle execution
  adapters, Arc Testnet execution, settlement/reconciliation, ambiguous-outcome
  handling, replay/idempotency, exact USDC accounting, Revenue/Cost separation,
  provider-driven Capital, Evidence provenance, Economic History, persistence
  boundaries, common-control provenance, fail-closed behavior, and environment
  guards within the accepted A–H scope.
- The A–H fixture/proof environment and protected Preview evidence remain valid
  engineering evidence. They are controlled/common-control specimens, not proof
  of independent demand or public product readiness.
- Observer-facing and Founder/System read-only views exist within their accepted
  scope. They are observability/proof surfaces, not a complete operator workspace.

### 2.2 Not verified yet

**Human-Operable Business Product Alpha is NOT YET VERIFIED.** The following are
product-realization requirements, not claims about the current accepted `main`:

- a fresh invited human can complete the product journey without CLI, database,
  GitHub, or developer help;
- product authentication maps the human to a stable Inomasa Human Principal and
  enforces tenant/resource control;
- BUILD, four-template selection, Business creation, My Businesses, and a usable
  Business Workspace work end-to-end;
- Product/Service, Agent, Treasury/funding, commerce/jobs, and Economic History
  are operable from the product at their stated Alpha scope;
- failures, unknown outcomes, permissions, loading, empty states, and degraded
  dependencies are understandable;
- the same journey works for another authorized user and on an Android browser;
- a final hosted proof is reproducible from a clean accepted commit.

Do not convert a fixture into a product claim, a proof into a user journey, a
Vercel Deployment Protection gate into product authentication, or a declarative
`READY` value into operational readiness.

### 2.3 Current Work 1 state

Work 1 implementation was started on the separate branch
`codex/work-1-human-product-alpha`. It is:

`IMPLEMENTATION STARTED ON SEPARATE BRANCH · NOT ACCEPTED · NOT COMPLETE · NOT MERGED`.

That branch is deliberately not part of this authority-recording change. Work 2–5
are not executed by this record.

## 3. Access, identity, ownership, and tenancy

Three access terms are mandatory:

1. **PROTECTED PREVIEW** — deployment-level protection remains enabled. It is not
   public internet access.
2. **PRE-LOGIN LANDING** — a visitor already authorized to open the protected
   deployment may read product explanation and observer-safe Live Economy without
   an Inomasa product session.
3. **AUTHENTICATED PRODUCT AREA** — product authentication is required before
   BUILD, My Businesses, Business Workspace, private history, Capital actions,
   Settings, or any mutation/tenant-private data.

The flow is:

`Protected Preview access → Pre-login Landing → Live Economy / explanation → Login → Authenticated Product Area`.

This does not authorize removal of Vercel Deployment Protection, anonymous public
Product Alpha, or a future unprotected public landing. “Anonymous access” must not
be used as a synonym for the protected pre-login view.

The minimum semantic separation is:

`Human User ≠ Human Principal ≠ Business ≠ Business Controller ≠ Business Treasury ≠ Consumer/Customer ≠ Customer wallet capability ≠ Agent ≠ Agent identity ≠ Agent runtime ≠ Agent execution wallet/account ≠ Capital Provider ≠ Capital Provider execution account`.

The Alpha identity/control contract is:

`email login → product identity/session → stable internal Human Principal → appropriate wallet capability when needed`.

The product may select an exact provider-specific implementation for a human or
customer wallet, provided it preserves identity/control, security, testnet scope,
clear ownership, replay/idempotency, no client-secret leakage, and separation from
Business Treasury. A consumer may act as a Human Customer without a Business when
the use case does not require Business representation. A Business Controller may
act for a Business when the economic context is Business-operated. There is no
universal rule that every buyer must choose an acting Business or Treasury.

Authentication is a bridge to the authority model, not merely a login page.
Business control remains the server-side authorization boundary, and server-side
mutations must fail closed even if a UI is manipulated.

## 4. Product behavior and human journeys

### 4.1 BUILD entry

BUILD uses exactly these four existing templates directly:

1. API / Data / Compute
2. SaaS / Micro-SaaS
3. Agent-as-a-Service
4. Web3-native Digital Business

The journey is:

`Login → BUILD → choose one template → minimum information → Create Business → My Businesses → Business Workspace`.

Templates provide a starting structure only. They are not permanent capability
silos. The AI Business Creation Agent is explicitly out of scope for this
realization.

### 4.2 Journey contract

| Journey | Actor and entry | Action and existing capability | State/result visible to user | Failure and proof |
| --- | --- | --- | --- | --- |
| Business operation | authenticated Human Principal → My Businesses | select a controller-scoped Business and open Workspace; existing Business control/read models | only controlled Businesses appear; workspace shows actual connected/degraded state | permission/unknown Business is denied or not found; control provenance is inspectable |
| Product/Service | Business Controller → Workspace → Products & Services | use existing catalog/offer capability and later x402/ERC-8183 orchestration | offer status, price, delivery shape, and next action are clear | validation, duplicate, unavailable, and pending states are explicit; offer/protocol proof is progressive |
| Agent | Business Controller → Workspace → Agents | create/assign/configure an Agent object through existing identity, capability, authority, and runtime boundaries | Agent identity, capability, authority, runtime, and intelligence-provider status remain separate | no provider/LLM is not an Agent-object failure; out-of-scope authority is denied; ERC-8004/action linkage is inspectable where present |
| Wallet/Treasury/funding | Controller or permitted Customer context → Treasury/Wallet | use existing Treasury binding, Circle adapter, and controlled testnet faucet/funding path | Business Treasury, customer wallet, Agent execution account, and Capital Provider account are distinct; balances are exact | pending binding, insufficient funds, provider failure, and unknown outcome are not silently treated as success; transaction/evidence details are disclosed progressively |
| x402 commerce | permitted customer or Business context → product offer | invoke existing x402 exact payment and settlement path | purchase/payment state, exact USDC amount, and delivery state | HTTP/payment challenge, provider receipt, failed/pending/unknown settlement, and replay are understandable; canonical Economic History records the result |
| ERC-8183 work | permitted customer/Business context → job offer | invoke existing funded-job, escrow, evaluation, payout/refund, and delivery path | job lifecycle, deliverable/evaluation, settlement, and final result | expiry/rejection/refund/ambiguous state remain distinct; exact lifecycle proof is available |
| Economic History | authenticated controller → Workspace → History | read existing contextual activity reconstruction | first explain what happened in the Business; then expose protocol, provider, chain, accounting, and Evidence details | no fabricated zero activity; unavailable/degraded/empty states are distinct; one obligation is counted once |
| Controlled Capital | permitted controlled actor → Capital context | use existing provider-driven decision, allocation, execution-account, and later-use linkage | provider, mandate, decision, allocation, provenance, and later use remain attributable | Capital is never Revenue or proof of Business success; common-control is not independent demand; public/Production Capital remains unauthorized |
| Founder/System/Audit | separately authenticated operator context → separate observability surface | inspect accepted system-wide proof and evidence read models | technical/proof surfaces remain separate from Business workspace | no observer surface is presented as an operator control surface; raw internals are progressively disclosed |
| MIGRATE | any authenticated user may view boundary | no mutation or migration action is available | `LOCKED / NOT YET OPEN` is explicit | server-side fail-closed behavior is tested; no UI manipulation opens it |

### 4.3 Agent scope

The following are separate objects and authorities:

`Agent object ≠ Agent identity ≠ Agent capability ≠ Agent authority ≠ Agent runtime ≠ Agent intelligence/LLM provider`.

Deterministic/test or `OPERATOR_INVOKED` runtime is sufficient to prove Agent
creation, Business assignment, identity, capability, bounded authority, bounded
economic action, runtime state, and product operability. It must not be described
as autonomous AI intelligence when no intelligence provider is configured. A paid
LLM is not a Product Alpha prerequisite, and “no intelligence provider
configured” is not a failure of the Agent object.

### 4.4 Live Economy

Live Economy is an observer-safe presentation/read model on the Pre-Login Landing:

`canonical economic/application state → Economic History / Evidence / accepted event read model → safe activity projection → cards`.

Cards may summarize Business creation, Agent registration/action, service purchase,
USDC settlement, completed jobs, or Capital allocation only when backed by accepted
canonical facts. Names, IDs, and sensitive/private Business data are not exposed
merely because a settlement is onchain. Live Economy must never create a second
ledger, event truth, Economic History, accounting path, or synthetic client event.

Light periodic server refresh and restrained animation are sufficient for the
controlled Alpha. If the source fails, show `UNAVAILABLE/DEGRADED`; do not display
false zero activity.

## 5. Workspace and information architecture contract

The primary product is Business-first and organized around work, not database
tables, protocol names, or proof internals. A suitable top-level structure is:

`Dashboard · My Businesses · BUILD · Capital · MIGRATE [Locked] · Account/Profile`.

Inside a Business Workspace:

`Overview · Products & Services · Agents · Commerce & Jobs · Treasury · History · Capital · Site · Settings`.

Exact route/component names remain an implementation choice. Agent and Wallet are
not automatically global silos when Business context is the correct operating
context. Founder/System/Audit and observer/proof surfaces remain separate.

Every area must distinguish:

- read-only observability: what the accepted system knows and can show;
- operational workspace: an authenticated user action that changes state through an
  existing application capability.

An object, count, or data row is not `READY` merely because it exists. Empty,
loading, unavailable, permission-denied, failed, pending, and outcome-unknown
states are different states.

Technical details—x402, ERC-8004, ERC-8183, hashes, Evidence, provenance,
settlement internals, and provider state—are available through `Details`, `Proof`,
`Technical`, or `System` progressive disclosure. Economic History first answers
“what happened in this Business?” before showing “which protocol record is stored?”.

## 6. Visual, mobile, and cost contract

The owner’s UI direction is calm and workspace-oriented: white/off-white surfaces,
clean black typography, generous whitespace, simple cards and borders, clear
hierarchy, quiet sidebar organization, limited lime/green accents, and low visual
noise. It must feel like an active workroom, not a crypto explorer or technical
dashboard. This is an Inomasa identity grounded in Business, Agent activity, USDC,
commerce, settlement, jobs, Capital, Economic History, Evidence, and inspectable
onchain activity—not a literal copy of another product.

Android/mobile is a first-class product surface, not a shrunk desktop layout. The
minimum contract is:

- body text ≥16px; supporting text ≥14px; technical metadata may be 12px only when
  it is not a core action or status;
- comfortable 44×44 CSS-pixel touch targets;
- discoverable primary navigation and a mobile equivalent of the desktop sidebar;
- responsive layout with no horizontal overflow;
- keyboard-friendly forms and clearly discoverable primary action;
- long pages segmented by task/section;
- proof/technical metadata collapsed by default;
- Live Economy does not consume the entire viewport;
- distinct loading, error, empty, permission, and unknown states;
- explicit transaction confirmation state;
- every Product Acceptance journey can be completed from an Android browser.

The Alpha stays near-zero-cost. Prefer the existing Next.js, React, TypeScript,
PostgreSQL/current Neon path, Vercel, Arc Testnet, Circle integrations, and
application/kernel modules. Redis, Kafka, dedicated WebSockets, paid realtime or
event-streaming services, a new realtime database, paid LLMs, extra cloud
microservices, and infrastructure layers are not default requirements. Any
proven blocker must document the simplest alternative and remain an owner proposal.

## 7. Verified-kernel preservation contract

All A–H semantics and accepted evidence remain regression-protected. Product/UI
engineering must call reusable application capabilities and existing ports:

`CLI/script ─┐`
`            ├→ reusable application capability → existing domain/kernel → platform adapters`
`Web UI ─────┘`

Do not introduce:

- a second ledger, event truth, accounting path, or Economic History;
- a parallel commerce path or duplicate Business/Product/Service economic model;
- a duplicate Capital implementation;
- UI-specific settlement or accounting semantics;
- direct provider SDK use from UI or business policy;
- auth logic that replaces Business Control;
- silent schema/domain rewrites for UI convenience;
- separate CLI and Web domain implementations.

The following invariants must remain true: exact USDC quantities and Revenue/Cost
classification; Capital separate from Revenue; provider-attributable Capital
decisions, allocation and later-use linkage; ERC-8004 identity/action linkage;
x402 exact behavior; ERC-8183 lifecycle, escrow, payout/refund and delivery
behavior; Treasury and Circle adapter boundaries; Arc Testnet guards;
settlement/reconciliation; ambiguous outcomes; replay/idempotency; Evidence
provenance; common-control provenance; persistence boundaries; fail-closed
authorization; and mainnet/environment guards.

MIGRATE remains locked. Production, mainnet, public anonymous Product Alpha,
unrestricted Agent authority, and public/Production Capital remain unauthorized.
Arc Privacy Sector is a future-relevant external research primitive only; Inomasa
does not claim confidential onchain execution or current APS integration.

## 8. Engineering realization plan and acceptance

Work proceeds in vertical, dependency-aware slices. Each work must preserve the
kernel, use existing application capabilities, and prove an observable user task.

### Work 1 — Fresh human to Business Workspace

- **Goal:** authenticate an invited human, map a stable Human Principal, show
  controller-scoped My Businesses, select one of four templates, create a BUILD
  Business, and enter its Workspace.
- **Depends on:** accepted Business genesis/control, persistence, template
  definitions, protected Preview boundary, and product-session contract.
- **Uses:** existing Business model, genesis command, repository transaction,
  Business control/read model, and Treasury binding semantics.
- **Protected boundaries:** no MIGRATE, no fixture-as-product shortcut, no second
  Business engine, no unscoped tenant reads, no Production/mainnet authority.
- **User outcome:** a fresh invited user can repeat the flow without developer or
  CLI assistance and sees honest connected/not-configured/degraded states.
- **Engineering acceptance:** lint, typecheck, tests, build, auth/session security,
  authorization and tenant-isolation tests, persistence/replay proof, and client
  secret boundary pass.
- **Product acceptance:** fresh login, template choice, Create Business, My
  Businesses appearance, Workspace entry, second-user isolation, and mobile task
  completion are observed from the application.

### Work 2 — Operational Workspace

- **Goal:** make Product/Service, Agent, Treasury, and controlled test-funding
  surfaces operable in Business context.
- **Depends on:** Work 1 identity/ownership and Workspace shell.
- **Uses:** existing catalog/offer, Agent identity/capability/authority/runtime,
  Treasury/Circle adapter and testnet funding capabilities.
- **Protected boundaries:** Agent identity/runtime/wallet separation, Business
  Treasury separation, no paid LLM requirement, no provider SDK in policy, no new
  accounting or wallet ledger.
- **User outcome:** the controller can create/manage one Product/Service and one
  bounded Agent, understand Treasury state, and complete a testnet funding flow.
- **Engineering acceptance:** domain/adapter tests, auth/authorization, exact
  persistence and idempotency, provider boundary/security checks, and mobile
  component behavior pass.
- **Product acceptance:** actions, states, permissions, confirmations, and honest
  no-provider/no-funding behavior are usable from the application.

### Work 3 — Human-triggered economic operations

- **Goal:** complete one x402 purchase and one ERC-8183 job through the product,
  including settlement and Economic History.
- **Depends on:** Work 2 and existing accepted economic kernel.
- **Uses:** x402 exact rail, ERC-8183 job path, Circle/Arc adapters,
  reconciliation, delivery Evidence, and Economic History read model.
- **Protected boundaries:** one canonical obligation, exact amounts, no blind
  retry after ambiguity, correct Revenue/Cost/Refund semantics, no parallel path.
- **User outcome:** a user can understand what was purchased/worked, whether it
  settled, and what happened afterward.
- **Engineering acceptance:** full economic regression, chain/provider correctness,
  replay/idempotency, ambiguous/failure handling, exact accounting, and database
  reconstruction pass.
- **Product acceptance:** one real controlled Arc Testnet activity, confirmation,
  failure/unknown display, and correctly reconstructed History are observed.

### Work 4 — Controlled Capital and separated observability

- **Goal:** expose a controlled provider-driven Capital journey while keeping
  Founder/System/Audit separate from Business operations.
- **Depends on:** Work 3 Economic History and accepted Capital kernel.
- **Uses:** existing provider mandates, decision material/provenance, execution
  accounts, allocation, later-use linkage, and read-only system proof.
- **Protected boundaries:** Capital is not Revenue or success; provider decision
  remains attributable; common-control is not independent demand; public Capital
  remains closed.
- **User outcome:** a permitted controlled actor can inspect a provider decision,
  allocation, and later-use link without confusing them with Business revenue.
- **Engineering acceptance:** provider/provenance/security tests, exact accounting,
  replay and isolation regressions, and database proof pass.
- **Product acceptance:** controlled Capital action and separated Founder/System/
  Audit views are understandable and scoped.

### Work 5 — Integrated Human Product Alpha acceptance

- **Goal:** prove the complete human journey and hosted artifact from a clean
  accepted source while preserving A–H.
- **Depends on:** Work 1–4 slices, configured authorized test environment, and
  current acceptance gates.
- **Uses:** all existing application/kernel paths and read models; no new truth
  system.
- **Protected boundaries:** Protected Preview remains protected; no public,
  Production, mainnet, unrestricted Agent, or public Capital expansion.
- **User outcome:** fresh and second users can repeat the product journey on
  desktop and Android, with honest states and inspectable evidence.
- **Engineering acceptance:** full browser E2E, auth/authorization/tenant
  isolation, React/component and accessibility regression, mobile browser tests,
  form/state tests, economic/A–H regression, database reconstruction, secret
  boundary, clean build, CI, and artifact-to-commit provenance pass.
- **Product acceptance:** every primary task is completed by users from the app;
  CI green alone is insufficient.

## 9. Acceptance and verification model

**Engineering Acceptance** covers lint, typecheck, unit/integration tests, build,
migrations, database proof, security, provider correctness, economic regression,
replay/idempotency, exact accounting, and clean artifact provenance.

**Product Acceptance** must prove from the application that:

- a fresh user authenticates and receives the correct product identity;
- only owned/controlled resources are visible and mutable;
- one of the four templates can be selected and created into a Business;
- the Business appears in My Businesses and its Workspace is usable;
- Product/Service and bounded Agent tasks work at the stated Alpha scope;
- Treasury/wallet/test-USDC state is understandable and usable;
- at least one controlled Arc Testnet economic activity completes;
- Economic History describes the result correctly;
- failures and ambiguous outcomes are comprehensible;
- Android/mobile task completion works;
- another authorized user can repeat the journey without a code change;
- all A–H kernel regressions remain PASS.

Verification must therefore include full browser E2E, authentication,
authorization, tenant isolation, React/component behavior, accessibility, mobile
browser regression, form interactions, loading/error/empty/permission/unknown
states, end-to-end economic journeys, A–H regression, browser-artifact secret
boundaries, and database reconstruction/proof. “The page rendered” is not
Product Acceptance.

## 10. Operational debt and gates

| Observation | Classification | Required treatment |
| --- | --- | --- |
| H Preview `gitDirty=1`; functional evidence remains valid | Blocker before Human Product Alpha closeout/final hosted proof | produce a clean accepted-commit build and record source commit, clean tree/build, CI, deployment ID, environment, and hosted runtime proof |
| Protected Preview is not yet a clean reproducible final Human Product Alpha artifact | Blocker before Human Product Alpha acceptance | do not invalidate historical H; create new provenance-backed hosted proof |
| Artifact-to-commit provenance gap | Blocker before Human Product Alpha acceptance | bind hosted artifact to accepted commit and observed CI |
| Documentation drift, stale counts/status, README/PROJECT_STATE inconsistency | Blocker before Human Product Alpha closeout | reconcile current status without rewriting historical records |
| Generic runtime error masking / misleading empty states | Blocker before Human Product Alpha acceptance when it obscures a user task | distinguish failure, unavailable, empty, pending, permission, and unknown states |
| Explicit provider/RPC timeout behavior | Blocker before economic Product Acceptance for affected operations | document bounded timeout/unknown handling and prove no blind retry |
| `PG-TLS-SEMANTICS-01` | Non-blocking Alpha debt unless the blocked dependency/TLS change is attempted | preserve current pinned behavior; re-prove certificate/hostname semantics before changing `pg` family or equivalent |
| GitHub Actions internal runtime deprecation warning | Non-blocking Alpha maintenance debt | review current GitHub guidance in a separate focused change |
| Single-operator review/governance | Non-blocking for controlled owner/common-control self-acceptance; gate before broader/private exposure | obtain independent review according to exposure risk |
| Branch/ruleset protection state not fully verifiable from available API/plan evidence | Gate before broader/private-user exposure | verify required checks and governance hardening; never state `main protected: false` from absence of evidence |
| Independent review | Gate before broader/private-user exposure; stronger review/security/governance before public/Production | not a blocker for controlled owner Alpha self-testing |
| Production, mainnet, public anonymous access, public/Production Capital, unrestricted Agent authority, live MIGRATE | Blocker before any public/Production exposure; unauthorized now | require new owner authorization and applicable architecture/security gates |
| External DNS or provider observations already scoped as environment-specific | Informational/monitoring unless they block a selected operation | preserve TLS fail-closed behavior and record only observed scope |

Historical H functional proof is valid. It is not final hosted Human Product Alpha
proof until the clean provenance gate is met.

## 11. Source/media limits and document relationship

The owner-provided screenshots of Wix Symphony were available as visual references
and support only the high-level calm workspace direction recorded above. They do
not override written owner decisions or Inomasa authority, and they are not copied
literally. The uploaded Circle Agents videos were not used as an authority or as a
source of unverified behavior; no behavior is inferred from them here.

This record supplements, rather than replaces, the active Concept & Architecture
and REV2 documents. Accepted A–H implementation truth and historical checkpoint
evidence remain intact. `PROJECT_STATE.md` records the current status and links to
this record. The superseded Canonical Architecture remains historical. No active
architecture authority is silently changed by this record.
