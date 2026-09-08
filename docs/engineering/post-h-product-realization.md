# Post-H Product Realization Record

**Status:** NORMATIVE PRODUCT-REALIZATION AUTHORITY AFTER A–H
**Current state:** `KERNEL VERIFIED` · `HUMAN-OPERABLE BUSINESS PRODUCT ALPHA NOT YET VERIFIED / REALIZATION IN PROGRESS`
**Scope:** controlled Arc Testnet, Protected Preview, owner/common-control Alpha only
**Baseline:** accepted GitHub `main` at `3647e3462bf0c77024209b5550a6f04ca5e53e1e`

**Owner-authorized continuation, 2026-09-06:** the next proof runs on localhost,
including Android/Termux/Ubuntu, before any hosting. Work 5 implementation is on
main through #48 (`ca1e9178abca916289ac11229163be11e2f2a951`); its corrective
continuation ends at `175498bb1fa740cc88ba6cbfe9ab4620792197b9` and is the source
baseline for this work. Product acceptance and new live integration proof remain
outstanding. Section 12 records the current scope amendment; earlier statements
about unstarted work, hosted-first acceptance, excluded AI creation, and locked
MIGRATE describe the earlier boundary and are superseded only within that section's
explicitly bounded scope. A–H evidence and economic semantics remain unchanged.

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

## 12. Local proof continuation authorized by the owner

The owner authorized implementation after an independent review, with actual
Arc/USDC economics as a structural requirement. Continue the existing application
and corrective work. Use normal engineering execution; screen-by-screen design
approval is not the development method. Explain technical work to the owner in
Indonesian followed by the technical term in parentheses, every time.

The bounded additions are AI-assisted BUILD and an operator-configured connection
to an existing business's HTTP JSON source. CONNECT is the product wording for
this narrow MIGRATE capability, not a second Business model or a bulk migration
system. Opening a configured source does not open arbitrary remote URLs, public
access, independent demand, or wallet migration. The server binds each source to
one invited Human Principal, retains external provenance, and creates the same
Business/control/workspace/pending Treasury records used by BUILD. Existing
external operations, customer information, wallets and historical payments are
not imported or represented as Inomasa-originated economic facts.

AI assists drafting and requires human acceptance through existing Business
creation. A model response cannot grant authority, move funds, execute code or
create Capital. No configured provider, rejected output and an unavailable
provider must remain distinct from successful AI generation. Gemini's documented
HTTP API is a replaceable initial adapter, configured only when the operator has
authorized access. Model selection is explicit; there is no paid subscription,
SDK dependency or automatic provider fallback. Alternatives were manual template
creation (retained) and a new agent framework (unnecessary for a bounded draft).
Costs and quotas remain those of the configured provider; request/output limits
and no automatic retries bound individual calls. Removing this adapter leaves
the existing creation and economic paths intact.

An existing Web2 JSON resource may be delivered after the canonical paid-service
authorization. The connector adds source verification and delivery only; payment,
settlement, USDC posting and Economic History retain their existing owners.
The source and observed result remain external facts, not chain-verified facts.
The alternative, replacing the external business application or deploying a new
payment protocol, is unnecessary. The connector adds no hosted service or package;
its fixed read-only source configuration can be replaced without changing the
Business identity or financial model. A change to a bound source requires an
explicit connection change, never silent retargeting of an existing paid offer.

Proof must distinguish local tests, controlled external HTTP execution, live AI
generation, and actual Arc Testnet money movement. Gateway receipts remain
provider-reported batched-payment evidence; individual Arc transaction links must
come from direct settlement or ERC-8183 chain evidence. A connected source or a
generated draft alone does not prove the economic thesis. Capital keeps its
accepted controlled provider-driven scope and is not a prerequisite for the first
BUILD/CONNECT commercial loop.

Vercel remains paused/disconnected. No deployment, Vercel configuration, new
database provider, new contract, mainnet transaction or public exposure is part of
this continuation. The existing Neon configuration can be used from localhost;
isolated databases remain mandatory for destructive reconstruction tests.

## 13. Owner-selected closed Alpha direction and code alignment — 2026-09-07

This section records the owner's subsequent explicit direction. It supersedes
section 12's sequencing of CONNECT as the immediate blocker, not the accepted
financial kernel or the evidence of earlier work. The owner selected this order:

1. Align Alpha design and retained/relaxed/open boundaries.
2. Realize a Business work item from objective to reviewed output, including recovery.
3. Connect its resource need to bounded authority, Arc payment and actual resource use.
4. Reconstruct its economic context and provider-driven Capital/use loop.
5. Prove reuse across additional Businesses, providers, failure states and screen sizes.

CONNECT remains the second entry into the same Business system and follows this
operational proof. Work continues here when code/data/tool access permits; the
phone is required for its uncommitted state, locally held access, and actual
Android acceptance. No transfer of Second Brain or phone state is implied.

### 13.1 Retain, relax, and leave open

Retain Business/control/Agent/Treasury separation, fail-closed tenancy, exact USDC,
bounded authorization, ambiguous-effect reconciliation, one canonical financial
posting, source-scoped Evidence, common-control labels, and provider-owned Capital
judgment. Keep one modular application and the current PostgreSQL provider.

Relax the old limitation of AI to genesis drafting: selected research work may
use an intelligence provider after creation. Operator-invoked deterministic
Agents remain valid for their earlier proof. A runtime label or Agent object is
not proof of active reasoning. Alpha's small population and four templates are
not architectural population/capability limits. UI composition may change with
actual operating needs; no per-screen approval process is introduced.

Still open: broader capability catalogue, cross-controller offer discovery/access,
standing budgets for new work shapes, automatic provider fallback, general-purpose
agent scheduling, external Agent execution, future custody profiles, independent
outcome evaluation, and Capital instruments beyond CONTROLLED_TEST_ALLOCATION.
Approval of the direction does not select all these designs or widen exposure.

### 13.2 Mapping to the existing implementation

| Existing location | Retained responsibility | Required delta and sequence |
| --- | --- | --- |
| `modules/business/model.ts`, `creation-assistance.ts`, `platform/ai/gemini.ts` | Business genesis, human-reviewed proposal, attributed generation | Preserve successful BUILD; add post-genesis work without creating Business again. |
| `modules/agent/model.ts`, `business/operational-workspace.ts` | Agent identity, Business role, research capability | Bind work to an existing active research-capable Agent; do not equate model with Agent. Step 2. |
| `platform/persistence/operational-workspace-repository.ts` | Controller-scoped Business/offer/Treasury | Reuse control lookup; work has its own persisted objective/progress. Current activated-offer lookup requires the buyer controller to also control the seller: cross-controller commerce remains a step-3 gap. |
| `modules/authority/model.ts`, `platform/persistence/agent-authority-repository.ts` | Specific offer/counterparty/action/per-action/cumulative authorization | Step 3 derives economic requests from approved work requirements; never interpret an LLM plan as authority. |
| `app/_commerce/application.ts`, `platform/persistence/product-economic-operation-repository.ts` | Canonical product request, obligation, external execution and reconciliation | Reuse their payment identities and unknown-outcome handling. Internal work is not an ERC-8183 job and must link, not impersonate it. Step 3. |
| `modules/commerce/service-catalog.ts`, `platform/persistence/alpha-service-repository.ts` | Supported execution capabilities, settlement-gated delivery | Bind advertised deliverables to actual executors; a freely named offer does not create that capability. Step 3. |
| `modules/economic-history/model.ts`, `platform/persistence/economic-history-repository.ts` | Contextual projection of source-owned economic facts | Add work/input/output links without a second ledger. No economic entry for merely generating research. Step 4. |
| `modules/capital/model.ts`, `platform/persistence/capital-repository.ts` | Provider mandate, decision, acceptance, allocation and later-use | Extend material from the new work history; existing counts/volume alone do not demonstrate rich work/outcome evaluation. Step 4. |
| `app/app/businesses/[businessSlug]/page.tsx`, `app/_components/` | Reusable authenticated Business Workspace | Add work state, actionable failures and human review inside the existing shell; technical detail stays progressive. Steps 2 and 5. |

### 13.3 Selected first implementation: persisted research work

One versioned capability observes public Arc Testnet data through the existing
read-only Arc adapter, then asks an explicitly configured model to prepare an
attributed analysis for the Business objective and acceptance criteria. The
controller reviews the result. This is a useful bounded executor, not a claim
that every service/template is now executable or that research generated Revenue.

Work owns objective, input snapshot, Agent/context snapshot, step, revision,
attempt history, output and review. The existing financial kernel owns money.
No payment tool, arbitrary URL, shell execution, autonomous loop, or new economic
authority is added by this slice. No onchain Agent registration is needed merely
to draft research; economic/interoperability gates still apply when transacting.

Use additive PostgreSQL work/attempt records within the existing Business module;
no new domain or runtime dependency. Short database transactions serialize claims
and persist results; no transaction remains open during a provider call. A lease
and attempt token fence stale completion. A client supplies the observed revision
so duplicate/replayed step requests cannot accidentally advance a later step.
Each request performs at most one step. Expired execution is recorded as outcome
unknown before an explicit retry, especially because a lost model response may
still have consumed provider quota. Completed work never invokes the provider
again. No claim of exactly-once external generation is made.

Alternatives considered: process-local promises lose work when the phone stops;
reusing an ERC-8183 job falsely imposes funded-work semantics on internal tasks;
a separate workflow service adds infrastructure before this slice needs it.
PostgreSQL storage costs grow with retained inputs/outputs/attempts; bound their
sizes and calls. The implementation is reversible by disabling the new entry
while preserving its records; do not erase prior evidence to roll back a feature.
A future worker can use the same persisted contract after separate proof.

Sources for implementation details: [PostgreSQL row locks](https://www.postgresql.org/docs/17/explicit-locking.html)
and [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output).
Schema conformance does not prove content truth. The pinned Next.js route-handler
guide was read locally; no Next.js upgrade is selected.

### 13.4 Acceptance for the first work slice

Require fresh Business reuse, current controller/Agent checks, immutable objective
on request replay, persisted input reused after process replacement, stale-revision
and stale-attempt rejection, explicit recovery after lost response, visible
unconfigured/quota/invalid-output failure, and human result acceptance. Verify
mobile and desktop states plus no financial writes. Synthetic providers prove
these mechanics only; live AI/source use and owner Android acceptance remain
separate evidence. Steps 3–5 are not complete because this slice passes.


### 13.5 First work slice implementation and proof boundary

The separate `codex/business-work-continuation` implements section 13.3 on top of
PR #49 head `42aa51cf7554f5190cae24e377c547effbf51ebd`: migration 015, a Business
work contract, PostgreSQL work/attempt repository, Gemini analyst adapter,
authenticated work route and existing-Workspace controls. No new runtime package
or economic execution path is introduced. The specific research capability is
selected for the first experiment; it is not a final capability catalogue.

Local verification on Node 22 passed 99 unit/contract tests, lint, types, build,
secret-name boundary checks, the isolated PGlite persistence suite and twelve
synthetic-provider browser checks, including actual app process restart and
cross-controller denial. The explicit Agent-selector label, readable form colors,
result spacing and hidden development indicator were checked in mobile and
desktop screenshots. PROJECT_STATE records exact scope, remote CI status and
remaining live acceptance; this record does not turn synthetic output into live
Arc or AI proof. The phone's successful prior BUILD remains separate evidence.

Step 3 must connect work requirements to real supported resources and existing
bounded economic authorization, including correcting the current same-controller
offer-discovery restriction. No new transfer is authorized by passing step 2.
Step 4 enriches contextual History and provider-specific Capital material without
new truth owners or universal scores. Step 5 proves another live provider,
additional Businesses and broader usability. Shared provider quotas, automatic
scheduling and outcome-quality evaluation remain open beyond this slice.
