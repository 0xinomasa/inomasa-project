# Post-H Product Realization Record

**Status:** NORMATIVE PRODUCT-REALIZATION AUTHORITY AFTER A–H
**Current state:** `KERNEL VERIFIED` · `WORK 1 ACCEPTED` · `HUMAN-OPERABLE BUSINESS PRODUCT ALPHA NOT YET VERIFIED / REALIZATION IN PROGRESS`
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

The record does not claim that the product layer is already fully implemented. It
defines what the product-realization work must realize and how that realization
will be proven. Work 1 is now an accepted implementation slice; Work 2–5 remain
unexecuted.

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
- Work 1 — Fresh human to Business Workspace — is accepted on GitHub `main` through
  pull request `#40`. Its implementation head is
  `b4e006e2114df3a045acc615b6b11f6a00355b5f`, merge commit is
  `27b30747c4a2fd14b1b29a1ee221fb99c893bd1a`, and Engineering verification run
  `33279953605` completed successfully. The accepted slice provides controlled
  invited product authentication/session, stable Human Principal mapping,
  controller-scoped My Businesses, direct selection of the four BUILD templates,
  Business creation/persistence, tenant-isolated Business Workspace entry, and the
  accepted product shell without changing the A–H semantic kernel.
- Work 1 product acceptance observed fresh invited-user login, template selection,
  Business creation, persistence, Workspace entry, and two-way second-user tenant
  isolation from the application. The corrected protected Vercel Preview
  `dpl_6BoHhm2v6WGQp7C1dkcLd6Cb5rV9` was built from the exact Work 1 head commit and
  remained protected by Vercel Authentication.

### 2.2 Not verified yet

**Human-Operable Business Product Alpha as a whole is NOT YET VERIFIED.** Work 1
acceptance does not imply completion of the following remaining product-realization
requirements:

- Product/Service, Agent, Treasury/funding, commerce/jobs, and Economic History
  must become operable from the product at their stated Alpha scope;
- failures, unknown outcomes, permissions, loading, empty states, and degraded
  dependencies must remain understandable across those operational journeys;
- controlled x402 and ERC-8183 economic operations must be executable and
  reconstruct correctly from the human product;
- controlled Capital must become product-operable while remaining separate from
  Revenue and from Founder/System/Audit observability;
- final integrated fresh-user and second-user journeys must work on desktop and
  Android from a clean accepted hosted artifact;
- a final hosted proof must be reproducible from a clean accepted commit while all
  A–H and Work 1 regressions remain passing.

Do not convert a fixture into a product claim, a proof into a user journey, a
Vercel Deployment Protection gate into product authentication, or a declarative
`READY` value into operational readiness.

### 2.3 Current Work 1 state

Work 1 was implemented on `codex/work-1-human-product-alpha` and is now:

`IMPLEMENTED · OWNER-ACCEPTED WITH DEFERRED NON-BLOCKING UX FINDINGS · MERGED TO MAIN`.

Acceptance evidence:

- implementation head `b4e006e2114df3a045acc615b6b11f6a00355b5f`;
- pull request `#40`;
- merge commit `27b30747c4a2fd14b1b29a1ee221fb99c893bd1a`;
- Engineering verification run `33279953605`, successful;
- corrected protected Preview `dpl_6BoHhm2v6WGQp7C1dkcLd6Cb5rV9`, sourced from
  the exact implementation head;
- owner-observed two-user persistence and two-way tenant isolation, plus mobile
  product-path checks.

Work 1 acceptance closes only the Fresh-human-to-Business-Workspace slice. Work
2–5 have not started.

The following owner UX findings are deliberately deferred to an integrated product
UX corrective pass rather than treated as Work 1 blockers:

- improve contrast and visual treatment of the three primary Build / Migrate /
  Capital choices; the product intent does not require those choices to remain
  literal boxes/cards unless the owner explicitly requires that primitive;
- make Live Economy materially more compact, especially on desktop and mobile,
  while restoring useful protocol-context signals such as x402, ERC-8004 and
  ERC-8183 without turning the landing into a protocol dashboard;
- evaluate whether `Live Economy` belongs as a peer top-navigation item when the
  three primary product paths are Build, Migrate and Capital;
- remove or progressively disclose engineering-facing copy that still leaks into
  normal product surfaces;
- improve landing hierarchy and page length while preserving the accepted calm,
  workspace-oriented direction;
- perform final desktop acceptance at normal browser zoom in addition to overview
  screenshots.

### 2.4 Deployment containment after Work 1 merge

The Work 1 merge exposed an operational deployment side effect that was not part
of the accepted product scope. Because Vercel Git integration treated `main` as
the Production branch, merge commit
`27b30747c4a2fd14b1b29a1ee221fb99c893bd1a` automatically created Production
deployment `dpl_8Uwgxnw5bNSCgrY3Spa868RUnDgp`. This did **not** grant Production
authority and did not change the product acceptance boundary.

Containment was completed without rollback or product-code changes:

- the Vercel project `inomasa` was paused; direct verification of the Production
  domain returned HTTP `503` with `DEPLOYMENT_PAUSED`;
- the project-level GitHub repository connection was removed, so ordinary Git
  pushes/merges no longer automatically trigger Vercel deployments;
- existing protected Preview artifacts remain available and continue to require
  Vercel Authentication;
- the Neon development PostgreSQL connection and its existing environment
  configuration were intentionally left unchanged;
- no `vercel.json`, new deployment project, Production secret, database change, or
  kernel change was introduced as part of containment.

Production, public anonymous Product Alpha, and Production/public Capital remain
unauthorized. Reconnecting Git auto-deployment or resuming Production requires a
separate explicit owner decision and the applicable exposure gates.

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

### Work 1 — Fresh human to Business Workspace — ACCEPTED

- **Accepted evidence:** pull request `#40`; implementation head
  `b4e006e2114df3a045acc615b6b11f6a00355b5f`; merge
  `27b30747c4a2fd14b1b29a1ee221fb99c893bd1a`; Engineering verification run
  `33279953605`; protected Preview `dpl_6BoHhm2v6WGQp7C1dkcLd6Cb5rV9`; owner
  product acceptance including two-user tenant isolation.
- **Goal:** authenticate an invited human, map a stable Human Principal, show
  controller-scoped My Businesses, select one of four templates, create a BUILD
  Business, and enter its Workspace.
- **Depends on:** accepted Business genesis/control, persistence, template
  definitions, protected Preview boundary, and product-session contract.
- **Uses:** existing Business model, genesis command, repository transaction,
  Business control/read model, and Treasury binding semantics.
- **Protected boundaries:** no MIGRATE, no fixture-as-product shortcut, no second
  Business engine, no unscoped tenant reads, no Production/mainnet authority.
- **User outcome:** an invited user can complete the accepted entry flow without
  developer or CLI assistance, with persistence and tenant isolation observed.
- **Engineering acceptance:** lint, typecheck, tests, build, auth/session security,
  authorization and tenant-isolation tests, persistence/replay proof, and client
  secret boundary passed for the accepted slice.
- **Product acceptance:** fresh login, template choice, Create Business, My
  Businesses appearance, Workspace entry, second-user isolation, and mobile path
  behavior were observed from the application. Deferred visual findings above do
  not reopen Work 1 unless a real regression is found.

### Work 2 — Operational Workspace

- **Status:** not started.
- **Goal:** make Product/Service, Agent, Treasury, and controlled test-funding
  surfaces operable in Business context.
- **Depends on:** accepted Work 1 identity/ownership and Workspace shell.
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

- **Status:** not started.
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

- **Status:** not started.
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

- **Status:** not started.
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

Work 1 has satisfied the subset covering invited authentication, stable product
identity, owned-resource visibility, four-template Business creation, My Businesses,
Workspace entry, second-user isolation, and the observed mobile entry path. The
remaining bullets are still required for Work 2–5 and final Human Product Alpha
acceptance.

Verification must therefore include full browser E2E, authentication,
authorization, tenant isolation, React/component behavior, accessibility, mobile
browser regression, form interactions, loading/error/empty/permission/unknown
states, end-to-end economic journeys, A–H regression, browser-artifact secret
boundaries, and database reconstruction/proof. “The page rendered” is not
Product Acceptance.

## 10. Operational debt and gates

| Observation | Classification | Required treatment |
| --- | --- | --- |
| H Preview `gitDirty=1`; functional evidence remains valid | Historical blocker superseded for Work 1 entry-slice provenance, still relevant to final Human Product Alpha hosted proof | retain historical H evidence; final Work 5 proof must still bind a clean accepted integrated source |
| Work 1 protected Preview is source-bound to exact implementation head | Accepted Work 1 evidence | preserve deployment/source/CI evidence; do not reinterpret it as final Work 5 proof |
| Final integrated Protected Preview is not yet a clean reproducible Human Product Alpha artifact | Blocker before Work 5 / Human Product Alpha acceptance | create new provenance-backed hosted proof only at the appropriate integrated stage |
| Documentation drift, stale Work 1 status, README/PROJECT_STATE inconsistency | Resolved by the Work 1 continuity closeout once merged | keep future accepted merges synchronized through Continuity Closeout |
| Deferred integrated UX findings from Work 1 | Non-blocking for accepted Work 1; required input to later integrated UX correction | preserve findings in §2.3 and address them before final Product Alpha owner acceptance unless superseded by an explicit owner decision |
| Accidental Git-triggered Production deployment after Work 1 merge | Contained operational incident; no Production authority | keep Vercel project paused and Git auto-deployment disconnected until a separately authorized deployment model is selected; existing protected Previews may remain |
| Generic runtime error masking / misleading empty states | Blocker before Human Product Alpha acceptance when it obscures a user task | distinguish failure, unavailable, empty, pending, permission, and unknown states |
| Explicit provider/RPC timeout behavior | Blocker before economic Product Acceptance for affected operations | document bounded timeout/unknown handling and prove no blind retry |
| `PG-TLS-SEMANTICS-01` | Non-blocking Alpha debt unless the blocked dependency/TLS change is attempted | preserve current pinned behavior; re-prove certificate/hostname semantics before changing `pg` family or equivalent |
| GitHub Actions internal runtime deprecation warning | Non-blocking Alpha maintenance debt | review current GitHub guidance in a separate focused change |
| Single-operator review/governance | Non-blocking for controlled owner/common-control self-acceptance; gate before broader/private exposure | obtain independent review according to exposure risk |
| Branch/ruleset protection state not fully verifiable from available API/plan evidence | Gate before broader/private-user exposure | verify required checks and governance hardening; do not infer protection state from unrelated evidence |
| Independent review | Gate before broader/private-user exposure; stronger review/security/governance before public/Production | not a blocker for controlled owner Alpha self-testing |
| Production, mainnet, public anonymous access, public/Production Capital, unrestricted Agent authority, live MIGRATE | Blocker before any public/Production exposure; unauthorized now | require new owner authorization and applicable architecture/security gates |
| External DNS or provider observations already scoped as environment-specific | Informational/monitoring unless they block a selected operation | preserve TLS fail-closed behavior and record only observed scope |

Historical H functional proof remains valid. Work 1 has its own accepted protected
Preview evidence. Neither is the final hosted Human Product Alpha proof required by
Work 5.

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
