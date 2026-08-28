# Accelerated controlled Alpha execution

## Status

Document classification: `VERIFIED BASELINE / HISTORICAL EXECUTION RECORD`.

Checkpoint verdict: `CONTROLLED ARC TESTNET ALPHA WITH X402 VERIFIED`.

This file preserves the exact implementation decisions, failures, recovery, and
proof from the accelerated Alpha. It is no longer the live execution contract.
Current implementation direction is
[`Inomasa Alpha Implementation & Testnet Realization v1.0 — REV2`](inomasa-alpha-implementation-and-testnet-realization-v1.0.md),
and current authority is defined by [`source-hierarchy.md`](source-hierarchy.md).
Signal Forge, Ops Pilot, and the buyer Agent remain valid regression fixtures, not
the generic product model or an instruction that Capital must be implemented next.

This was the live execution contract after B5. B0-B5 remain accepted historical
lineage. The old standalone B6 Agent Wallet, B7 x402, and B8 Background Execution
sequence is retired. The final R1-R5 meanings are retained as causal checkpoints
inside one accelerated vertical build, not as documentation-first phases:

1. capability/control/provider adjudication;
2. deterministic Human-controlled Business entry and Treasury binding;
3. deterministic commerce and Arc settlement;
4. paid-service adapter and durable execution;
5. bounded Agent delegation and adversarial readiness.

## Alpha proof target

```text
common-control Human operator
  -> deterministic Business genesis
  -> explicit Business control
  -> logical Treasury + replaceable account binding
  -> versioned service offer and accepted obligation
  -> selected compatible payment adapter
  -> real Arc Testnet USDC settlement
  -> exact revenue/cost allocation
  -> settlement-gated Arc snapshot service delivery
  -> narrow provenance-preserving Evidence
  -> application-visible state
```

The first economic graph uses two versioned templates:

- **Signal Forge** supplies `arc-market-snapshot` data;
- **Ops Pilot** depends on that snapshot to supply a
  `commerce-readiness-brief` automation service.

Both actors are synthetic/common-control in the initial economy. The relationship
is useful for proving system causality, not organic market demand.

## Circle/Arc implementation decision

### Selected Alpha profile

Circle Developer-Controlled **EOA** on `ARC-TESTNET` is selected as the first
Business Treasury execution adapter.

Why it is selected:

- Circle documents Arc Testnet support for Developer-Controlled EOA wallets;
- the server-side SDK supports idempotent wallet creation, transfer submission,
  transaction observation, and balance lookup;
- EOA works for direct Circle wallet transfers and does not foreclose the current
  Gateway/Nanopayments EOA-only path;
- the one-operator controlled Alpha legitimately permits platform participation;
- the adapter remains behind an Inomasa Treasury port and binding history.

Correct classification and limitations:

- custody/control profile: `DEVELOPER_CONTROLLED / PLATFORM_CONTROLLED_EXTERNAL`;
- it is not user custody;
- it is not canonical Principal or Business identity;
- it is not yet an Inomasa Protected Treasury;
- credential/entity-secret recovery and rotation have not yet been exercised;
- platform custody, legal, and operational consequences must be reassessed before
  any public or mainnet use.

### Alternatives retained

- Circle User-Controlled EOA remains the primary user-custody/exit reference path.
  It offers user signing and documented PIN/security-question recovery, but adds a
  client challenge/authentication flow that is not required for the fastest
  one-operator Alpha.
- Circle SCA/MSCA is not the primary Alpha account because current Gateway
  Nanopayments requires an EOA signature path; smart accounts remain candidates for
  later protected control profiles.
- Circle Agent Wallet is deferred to bounded delegation. Arc Testnet is supported,
  but Circle's custom spending policies are documented as mainnet-only, so Inomasa
  must not claim provider-enforced testnet Agent budgets.
- External wallets remain a manual/reference fallback, not the integrated primary.

Circle Gateway/Nanopayments with x402 v2 `exact` is now selected for the Alpha
machine-payment rail after the observed proof below. The direct Circle transfer
adapter remains valid for ordinary Treasury transfers; Gateway is not promoted to
the semantic owner of obligations, authority, accounting, or Evidence.

The selection adds `@circle-fin/x402-batching` `3.4.0`, x402 core/evm `2.23.0`,
and their required `viem` surface. A generic Inomasa x402 port and persisted
protocol objects isolate Circle-specific signing/facilitator behavior in
`src/platform/`. Replacing Gateway would require a new rail proof, not a rewrite of
Business, authority, obligation, accounting, or service-delivery semantics. The
tradeoffs are a one-time EOA deposit, Circle operational dependency, and Gateway's
live minimum authorization validity of `604800` seconds. Public/mainnet price and
operational suitability remain unadjudicated.

## REV2 Checkpoint C ERC-8004 execution profile

This section is the implementation record for REV2 Checkpoint C. It does not amend
the active Concept & Architecture or Alpha REV2 authority.

Current primary sources were rechecked on 27 August 2026 before execution:

- Arc's official Agent registration tutorial identifies Arc Testnet chain
  `5042002`, Identity Registry
  `0x8004A818BFB912233c491871b3d84c89A494BD9e`, Reputation Registry
  `0x8004B663056A597Dffe9eCcC1965A193B7388713`, and the current RPC endpoint
  `https://rpc.testnet.arc.io`;
- the current ERC-8004 specification defines the portable identity pair as
  `agentRegistry + agentId`, requires a registration file bound back to that pair,
  permits a base64 `data:` URI, and separates identity/reputation/validation from
  payments;
- the same specification prohibits an Agent owner or approved operator from giving
  feedback to itself. Common-control execution therefore records the real economic
  context and that Inomasa has ingested no feedback, rather than manufacturing a
  reputation score or claiming unqueried global registry state;
- the installed Circle Developer-Controlled Wallet SDK `10.8.0` retains
  idempotent `createContractExecutionTransaction` with Arc Testnet, contract
  address, ABI signature/parameters, and source EOA address.

Selected implementation:

- a new bounded `modules/agent/` owns generic Business-Agent role, capabilities,
  runtime, status, and the provider-neutral ERC-8004 contract;
- PostgreSQL migration `008` enriches the prior Agent fixture table without
  replacing it, persists an idempotent ERC-8004 reconciliation state machine, and
  adds an immutable optional identity reference to Action Intent;
- the existing Ops Pilot Circle EOA submits registry calls as a
  platform-controlled execution account. It is explicitly not Agent identity,
  Business identity, user custody, or Protected Treasury;
- registration uses `register()` first, observes the emitted `agentId`, then calls
  `setAgentURI(agentId, dataUri)`. This second transaction is required to bind the
  final registration JSON back to the actual onchain ID without an untruthful
  placeholder;
- Arc RPC proof binds chain ID, successful receipts, `Registered` and `URIUpdated`
  events, owner, `ownerOf`, and exact `tokenURI` before local state becomes
  `VERIFIED`;
- a new x402 action may name only the requester's already-verified identity. The
  identity snapshot is persisted on the Action Intent, so later identity changes
  cannot silently rewrite which identity was used;
- Agent detail exposes relationship, runtime, capabilities, portable identity,
  common-control provenance, identity-bound economic activity, and the absence of
  feedback ingested by Inomasa without deriving a universal score or claiming
  unqueried global registry state.

Alternatives and consequences:

- a hosted HTTPS or IPFS registration file would reduce URI gas size but add a new
  hosting/content-availability dependency. The bounded Alpha selects an onchain
  base64 data URI for reversibility and self-contained proof; `setAgentURI` allows
  later replacement;
- a newly provisioned dedicated wallet would separate registry ownership from the
  existing Business execution account, but would add another custody object before
  a distinct control requirement exists. The selected EOA owner is transferable
  under ERC-721 and remains clearly classified as platform-controlled;
- using only an internal ID would avoid two transactions but would fail the REV2
  interoperability obligation. Treating ERC-8004 as the Business or wallet would
  violate active architecture invariants;
- validation calls are deferred because Checkpoint C has no real validator need.
  External reputation feedback is likewise not fabricated under common control;
- no dependency or vendor was added. Existing `viem`, Circle, PostgreSQL, and Arc
  adapters are reused. Lock-in is limited to the selected submission adapter and
  Arc registry deployment; domain references and reconciliation remain portable.

Primary sources:

- https://docs.arc.io/arc/tutorials/register-your-first-ai-agent
- https://docs.arc.io/arc/references/rpc-endpoints
- https://eips.ethereum.org/EIPS/eip-8004
- https://github.com/erc-8004/erc-8004-contracts
- https://developers.circle.com/api-reference/wallets/developer-controlled-wallets/create-contract-execution-transaction

Observed Checkpoint C accepted proof on 27 August 2026:

- Ops Pilot retained two Agent records through the generic repository; the buyer
  Agent is still `agt_ops_pilot_buyer_v1`, while
  `agt_ops_pilot_observer_v1` proves a second role/capability without a wallet or
  forced onchain identity;
- ERC-8004 identity: Agent ID `886498`, portable registry
  `eip155:5042002:0x8004A818BFB912233c491871b3d84c89A494BD9e`;
- registration transaction:
  `0x6dbd74350f1a2426fe87e604e6ffca5768b55d38139118750470323ae890fd88`;
- metadata transaction:
  `0xa34df9a62721a0c72417bd7eb3cd6cc673a055570efeb2aed4038a09e6295a32`;
- identity-bound Action Intent `int_arc_snapshot_x402_8004_v1` settled exact
  `0.010000` testnet USDC through payment
  `pay_arc_snapshot_x402_8004_v1`, provider receipt
  `0a58b02e-e158-4465-b8f9-5c2fd2cc51e6`;
- post-batch Gateway balances: payer `0.980000`, seller `0.020000`, pending zero;
- paid delivery `svc_arc_snapshot_x402_8004_v1` completed from Arc block
  `59060455`, output SHA-256
  `47f9142bf657663bcd09472da7fe420a7e9161e65a25ec5ba7582cd793603bfe`;
- replay returned `ALREADY_COMPLETE` for the same payment and delivery;
- local production HTTP rendered the Business with both Agents and the Agent detail
  with ID, registry state, exact action, common-control provenance, and no
  Inomasa-ingested feedback; an unknown Agent returned HTTP `404`;
- this is real Arc Testnet identity and provider-reported testnet commerce under
  synthetic/common control. It is not independent demand, user custody, universal
  reputation, Production value, or a direct per-payment Arc transaction hash.
- acceptance: pull request `#25`, implementation commit
  `d9236fe0c95a4770a986494845c1f297eef4b8ba`, final head
  `1667735838105343cd4d5273895efda2bdff72fd`, PR run `33043930935`, merge
  `d3b26ce6e5e4808d415430d80697a4c78720415d`, and accepted-main run
  `33044047209` all completed successfully.

## REV2 Checkpoint D commerce execution profile

This section records the Checkpoint D implementation and private-testnet proof. It
does not amend either active authority and does not promote an ERC draft or one Arc
deployment into Inomasa product ownership.

Current primary sources were rechecked on 27-28 August 2026 before implementation
and execution:

- Arc's official Agentic Economy documentation selects x402 for instant resource
  purchase and ERC-8183 for funded work with a deliverable and evaluator;
- Arc's current ERC-8183 tutorial publishes AgenticCommerce deployment
  `0x0747EEf0706327138c69792bF28Cd525089e4583`, Arc Testnet USDC
  `0x3600000000000000000000000000000000000000`, a non-hooked path, and the
  deployed lifecycle ABI;
- EIP-8183 remains a `DRAFT`. Its current state machine is
  `Open -> Funded -> Submitted -> Completed/Rejected/Expired`; completion pays the
  provider, while reject/expiry returns escrow to the client. The evaluator is a
  trusted role and the standard supplies no dispute resolution;
- the deployed Arc tutorial ABI differs from some current EIP prose: the provider
  sets price through `setBudget(uint256,uint256,bytes)` and funding uses
  `fund(uint256,bytes)`. Inomasa pins the observed deployment ABI in the Arc adapter
  rather than silently treating the draft and deployment as identical;
- Circle Developer-Controlled Wallet contract execution remains the selected
  signing/submission adapter. x402 v2 remains an exact, CAIP-2-scoped instant
  payment protocol, and Circle Gateway receipts remain provider facts rather than
  direct per-payment Arc transaction hashes.

Selected implementation:

- `modules/commerce` owns protocol-neutral offer definitions, transaction-shape
  selection, ERC-8183 statuses/transitions, terminal replay rules, and payout versus
  refund economic meaning;
- a data-driven service catalog and `/api/alpha/services/[offerId]` make the x402
  HTTP capability generic by offer. The former snapshot path is retained as a
  compatibility/regression endpoint and both routes validate that the supplied
  payment is committed to that exact offer before returning a challenge or output;
- migration `009` adds an ERC-8183 job commitment and a unique per-leg operation
  ledger. `UNCREATED` prevents application state from pretending that a job exists
  onchain before the create receipt is verified. Every Circle operation has its own
  stable idempotency key, provider transaction ID, Arc hash, block, and recoverable
  `OUTCOME_UNKNOWN` state;
- the Arc adapter verifies chain, deployed contract/token/zero-fee profile, exact
  non-hooked job fields, successful receipts, historical contract state at each
  receipt block, and one exact USDC escrow/payout/refund transfer where required;
- offchain delivery persists the exact JSON payload plus a canonical recursive-key
  SHA-256, so its digest remains reconstructible after PostgreSQL `jsonb` reorders
  object keys; the separate onchain `bytes32` commitment remains the protocol fact;
- the bounded proof reuses the accepted Ops Pilot EOA as client/evaluator and
  Signal Forge EOA as provider. These accounts are platform-controlled execution
  infrastructure, not Business identity, Agent identity, user custody, Protected
  Treasury, or evidence of independent demand;
- funding is an escrow movement and creates no Revenue or Service Cost. Only a
  chain-verified `Completed` payout atomically settles the obligation, records one
  Revenue/Service Cost pair, records delivery, and writes source-scoped Evidence.
  `Rejected`/`Expired` records `REFUNDED`, cancels the obligation, and creates no
  revenue/cost pair because the returned escrow is not new income;
- the Alpha rejects non-zero platform/evaluator fees for this deployment. This
  keeps the exact `0.050000` service accounting true; supporting a fee-bearing
  deployment would require an explicit fee allocation model and new proof.

Need, alternatives, consequences, cost/lock-in, and reversibility:

- ERC-8183 is required by REV2 for work that naturally needs escrow, deliverable,
  and evaluation. Reusing direct USDC or x402 would lose that job-state contract;
  building a custom escrow would duplicate a suitable external primitive and
  expand security ownership;
- a third-party evaluator or hook could broaden policy, but adds trust, liveness,
  and callback risk without a Checkpoint D need. Client-as-evaluator and the zero
  hook are the smallest truthful common-control Alpha profile;
- no dependency, vendor, hosted service, or custom contract was added. Existing
  `viem`, Circle, Arc RPC, PostgreSQL, and the external Arc reference deployment are
  reused. Cost is six testnet contract calls plus gas and `0.050000` escrow;
- lock-in is confined to the Circle execution adapter and the selected Arc
  deployment/ABI. Business, offer, obligation, accounting, delivery, and Evidence
  stay internal and provider-neutral. A future conforming deployment/provider can
  replace the adapters after registry, ABI, fee, state, exact-transfer, and replay
  proof; no rewrite of Business meaning is required;
- because ERC-8183 is still draft, Production/mainnet use, hooks, arbitrary fees,
  independent evaluators, and generalized dispute handling remain unauthorized.

Primary sources:

- https://docs.arc.io/build/agentic-economy
- https://docs.arc.io/arc/tutorials/create-your-first-erc-8183-job
- https://docs.arc.io/arc/references/rpc-endpoints
- https://eips.ethereum.org/EIPS/eip-8183
- https://github.com/erc-8183/base-contracts
- https://developers.circle.com/api-reference/wallets/developer-controlled-wallets/create-contract-execution-transaction
- https://developers.circle.com/gateway/nanopayments/quickstarts/buyer
- https://developers.circle.com/gateway/nanopayments/quickstarts/seller
- https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md

Observed Checkpoint D implementation proof on 28 August 2026:

- ERC-8183 job `182088`, internal
  `job_commerce_readiness_8183_v1`, completed exact `0.050000` Arc Testnet USDC
  with `COMMON_CONTROL_TEST` provenance;
- create transaction
  `0x37c99edd8d27096c8a2381b46ba3f0ae0af8b1f8905bb3205deb073da3e4cd57`;
- provider budget transaction
  `0x83635226dbc70bedc5591131f692b598c9e75c32741f8bcd8f3d91a1dd6807e7`;
- client approval transaction
  `0x07af8bd7b1711db739dd99f2ccacbbecb436433b924f4377ca038d680433cd88`;
- exact escrow funding transaction
  `0x0502a09790fa4127a0c6726492cfab00d1bcfa4c722bb4e9881690ae927e1ffa`;
- deliverable submission transaction
  `0x1b27621671120749de3ee4cd784489dc2de37086837b96b306413e91d997fdef`,
  with commitment
  `0x21e3af36011b6f9e30706a5159a5dc0428a792a2233f242bde4b414e13f4021a`;
- evaluator completion and exact provider payout transaction
  `0x21f84636a01ca34ee0d23743ebcb28140437b5a345032b777b17fd43f9b3c653`;
- replay returned `ALREADY_COMPLETE` for all six legs; the proof found exactly
  six unique completed operation transactions, one exact two-entry economic pair,
  one completed delivery, and chain-verified job/payout Evidence;
- accepted x402 payments `pay_arc_snapshot_x402_v1` and
  `pay_arc_snapshot_x402_8004_v1` remained `COMPLETE`. Production HTTP returned
  the committed `402` challenge and paid `200` output on both legacy and generic
  offer routes. Automated visual browser proof remains unclaimed because
  `agent-browser` is unavailable in the verified Ubuntu Proot profile;
- this is real Arc Testnet escrow/payout under synthetic common control. It is not
  independent work demand, service quality, user custody, Production value, or a
  claim that every ERC-8183 implementation has the same ABI or fee profile.
- acceptance: pull request `#27`; implementation commits
  `b579dd7382d4e5512a9fac160e3a6dc80579296e`,
  `f53d31bc13973f593f1e8d54797ae16ec7a9caba`, and
  `56a9c7edfe14b6ad3ad7b73316797c635ad96c17`; PR run `33114737524`; merge
  `ce4136a2997f7b4483b1d8d2d51d791ba2d7b2bf`; and accepted-main run
  `33114924079` all completed successfully.

## REV2 Checkpoint E Economic History execution profile

This section records the selected Checkpoint E read model and its bounded local
proof. Economic Activity is contextual observability over accepted economic and
protocol facts; it is not a second ledger, a protocol-state clone, or a claim that
common-control testnet activity is independent demand.

Current primary sources were rechecked on 28 August 2026 before implementation:

- Arc Testnet remains chain ID `5042002`, with ArcScan at
  `https://testnet.arcscan.app`;
- Arc's official connection and RPC references remain the registry authority for
  chain identity and explorer routing. Only a syntactically valid Arc transaction,
  address, or `arc-block:<number>` source can become a corresponding ArcScan link;
- Circle Gateway x402 remains provider-reported at the per-payment boundary. Its
  receipt must remain visible as a provider reference and must not be rendered as
  a direct Arc transaction merely to produce an explorer link.

Selected implementation:

- `modules/economic-history` owns protocol-neutral contextual status, outcome,
  protocol participation, and summary semantics. One obligation becomes one
  Economic Activity even though exact accounting retains a seller Revenue entry
  and buyer Service Cost entry;
- a read-only PostgreSQL repository reconstructs each Activity from existing
  Business, offer, obligation, settlement, x402, ERC-8004, ERC-8183, delivery,
  Evidence, Agent, and economic-entry records. No migration, materialized activity
  table, or duplicate write path was added;
- conservative status precedence preserves `OUTCOME_UNKNOWN`, then `FAILED`, then
  `PENDING`; only fully reconciled settlement and required delivery/job state can
  become `COMPLETE`. Rejected or expired ERC-8183 work is terminal context only
  after an observed refund and never becomes successful delivery;
- Home exposes the system Economy view, each Business Workspace exposes activity
  scoped to that Business and its counterparty/economic role, and `/system`
  exposes Founder/System inventory, status, volume, protocol, and effect summaries;
- protocol badges are derived per Activity. Technical proof is progressively
  disclosed with source scope and verification class; application records,
  provider receipts, and content digests remain plain references, while only real
  Arc transaction/address/block references receive ArcScan links;
- the completed-volume summary counts the obligation amount once. Revenue and
  Service Cost category counts remain separately visible as accounting effects
  without doubling the Activity or volume.

Need, alternatives, consequences, cost/lock-in, and reversibility:

- Checkpoint E requires a coherent economic history across the existing generic
  Business, Agent, commerce, accounting, delivery, and Evidence boundaries. Keeping
  this policy in the application composition root would couple UI routes to table
  details; putting it in persistence would make infrastructure own economic
  meaning. The bounded module plus read adapter preserves the repository boundary;
- an append-only activity projection or external index could improve scale, but at
  Alpha volume it would introduce synchronization, replay, migration, and truth
  divergence risk without proof need. The selected join-based read model costs
  several bounded queries and can later be replaced by a proven projection without
  changing the Activity contract;
- no dependency, vendor, hosted service, schema, or write-side behavior was added.
  Lock-in is limited to the current PostgreSQL read adapter and ArcScan URL shape;
  the domain model and UI consume provider-neutral Activity/proof types;
- removal is reversible by deleting the read adapter and its three surfaces. The
  accepted ledger, obligations, protocol operations, deliveries, Evidence, and
  provider facts remain untouched;
- public indexing, analytics claims, independent-demand claims, Production/mainnet,
  Reputation inference, and Capital interpretation remain outside Checkpoint E.

Primary sources:

- https://docs.arc.io/arc/references/connect-to-arc
- https://docs.arc.io/arc/references/rpc-endpoints
- https://testnet.arcscan.app

Observed local Checkpoint E proof on 28 August 2026:

- five unique obligations reconstructed as five `COMPLETE` Activities with exact
  non-doubled volume `0.420000 USDC` and `COMMON_CONTROL_TEST` provenance;
- dynamic protocol counts: Arc USDC `5`, x402 `2`, ERC-8004 `1`, ERC-8183 `1`;
- ten exact accounting effects remain visible as five Revenue and five Service
  Cost entries; system inventory remains three Businesses, two Agents, eleven
  Evidence facts, and five deliveries;
- both x402 Activities expose provider-reported settlement receipts and no direct
  settlement Arc transaction; the identity-bound payment may independently expose
  its real ERC-8004 Arc transaction;
- ERC-8183 job `182088` exposes six unique Arc lifecycle transactions plus its
  contract, application delivery source, and content digest;
- both fixture Businesses see five scoped Activities and generic Checkpoint B
  proof Business sees zero, demonstrating empty-history behavior without inventing
  commerce;
- `npm run alpha:checkpoint-e:proof`, lint, typecheck, and 48/48 tests passed.
- the accepted Ubuntu Proot Playwright wrapper opened the local production Home,
  Ops Pilot Workspace, generic empty-history Business, and System Dashboard. It
  observed the expected counts and dynamic badges, opened proof disclosure, found
  no horizontal overflow at 390 CSS pixels, and reported zero console errors or
  warnings after the application icon was added;
- protected Preview evidence remains unclaimed until it is observed in a later
  checkpoint;
- acceptance: pull request `#30`; implementation commit
  `5ad080f6beaa182c02fd784a32d08468376f65cb`; PR run `33134596722`; merge
  `b43cfbd901c1906284d11722fc95d4e8ff585357`; and accepted-main run
  `33134731453` all completed successfully. Protected Preview remains a later
  integrated-verification obligation and is not implied by this Checkpoint E proof.

## Exact Arc registry

- network: Arc Testnet only;
- chain ID: `5042002`;
- RPC: `https://rpc.testnet.arc.network`;
- USDC ERC-20 interface: `0x3600000000000000000000000000000000000000`;
- economic USDC quantity: 6 decimals;
- native gas USDC representation: 18 decimals;
- explorer: `https://testnet.arcscan.app`.

Application accounting uses only the six-decimal ERC-20 economic quantity. Native
gas quantities and network fees remain separate fields.

## Implemented checkpoint

- two deterministic/versioned Business templates and a coherent dependency graph;
- canonical-style opaque Human and Business identifiers independent of wallets;
- explicit controller and common-control classification;
- single-use genesis request uniqueness in PostgreSQL;
- append-oriented Business control, Business event, and Treasury-binding records;
- exact integer micro-USDC value handling;
- service offer, obligation, authorization, submission, unknown/failure, and
  completion state models;
- settlement-gated paid service execution with digest-bound Arc network output;
- PostgreSQL owner tables for Business, commerce, settlement, economic entries, and
  service execution plus narrow Evidence facts;
- Circle SDK isolated in a platform adapter;
- Circle configuration fails closed outside explicit non-mainnet environments;
- deterministic local bootstrap is idempotent;
- application dashboard displays runtime classification, Businesses, dependency,
  Treasury state, Arc registry, obligation/settlement state, and explicit
  not-executed service state;
- live read-only Arc RPC connectivity has returned chain ID `5042002`, a moving
  block head, and deployed bytecode at the configured USDC interface.

The first two Circle wallets, direct Arc transfers, exact economic allocation,
three paid service executions, bounded Agent authority, and one Gateway x402
machine payment are now proven. This does not claim user custody, Protected
Treasury, a durable hosted Agent/background worker, LLM authority, Reputation,
Capital, Production value, or organic demand.

## Observed implementation proof

- implementation commit: `724e96b175b2dbe08e24f70a5f98c8f8f95b800a`;
- pull request: `#12`;
- PR verification run: `32822885262`, successful with Node `22.23.2`, npm
  `10.9.8`, zero audit vulnerabilities, 19/19 tests, production build, and clean
  PostgreSQL reconstruction through migrations `001`-`004`;
- protected Preview: `dpl_BHtdiU4F18tJYWnSa77BTAh9pT63`, source commit
  `724e96b175b2dbe08e24f70a5f98c8f8f95b800a`, environment `preview`, state
  `READY`, Node `22.x`;
- anonymous Preview request: HTTP `302` to Vercel SSO;
- authenticated Preview render: Alpha shell, both templates, Arc chain ID, and
  explicit not-configured/no-ledger/no-Evidence states observed;
- post-proof automation-bypass count: zero; Vercel Authentication and Git Fork
  Protection remained enabled;
- runtime warning/error query after the authenticated request returned no events.

## Observed first integrated Arc proof

- environment: `PRIVATE_ARC_TESTNET`;
- actors: synthetic/common-control; software and Arc execution: real testnet;
- Circle payer Treasury: Ops Pilot EOA
  `0xcd4194d3cab4fe5e306ac397f8896b4b8e0f7ede`;
- Circle seller Treasury: Signal Forge EOA
  `0xd1d26154d2a493a0be3a30f8e8ae5498bd12f144`;
- obligation: `obl_arc_snapshot_v1`, exact `0.250000 USDC`;
- Circle provider transaction: `300ea7f4-9392-570b-9907-3cd6da1a1f4a`,
  `COMPLETE`;
- Arc transaction:
  `0x887980b47c7c1eeb9f5457aa80323e9b03bd7934008811ef56fbcaf1820b3913`,
  block `58765237`, successful Circle USDC `transfer` of `250000` micro-USDC;
- exact economic allocation: Signal Forge `REVENUE / INFLOW`, Ops Pilot
  `SERVICE_COST / OUTFLOW`, both common-control and each posted once;
- paid service: `svc_arc_snapshot_v1`, `COMPLETE`, source Arc block `58765304`,
  digest `e22f9142f36a6ec47235f73b143fe44295d9e89da0f9ef41a0cd2e7566a7d97d`;
- Evidence: chain-verified settlement fact and provider-reported service-output
  fact remain distinct;
- replay proof: repeated reconciliation remained `COMPLETE`, repeated service
  execution returned `ALREADY_COMPLETE`, and resubmission from `COMPLETE` was
  rejected;
- protected Preview: `dpl_6XgtJVdU9uQPUb3jMz7g7UnodGKZ`, `READY`; authenticated
  render exposed the actual amount, tx hash, settlement, revenue, and cost while
  anonymous access remained HTTP `302` to Vercel SSO;
- post-proof Vercel state: automation bypass count zero, future-Preview environment
  variable count zero, no Production exposure;
- runtime log scan contained only the already-recorded `pg` TLS-semantics warning;
  no application request failure was observed.

The initial transfer attempt returned Circle `API parameter invalid` because the
SDK's permissive type accepted `walletId + tokenAddress` while Circle's current Arc
guide requires `walletAddress + blockchain + tokenAddress`. No provider transaction
ID was returned, so Inomasa retained `OUTCOME_UNKNOWN`. Circle transaction listing
showed only the faucet funding transfer, a corrected request passed fee estimation,
and one retry with the stored idempotency key succeeded. The adapter and regression
test now enforce the documented request shape.

An earlier Preview attempt was provider-blocked before build because the commit used
the unverified local author `root@localhost.localdomain`. The branch commit metadata
was corrected to the repository identity
`Inomasa <131157449+0xinomasa@users.noreply.github.com>`; no application change or
protection weakening was used to bypass the provider check.

## Observed bounded Agent proof

- Agent principal: `agt_ops_pilot_buyer_v1`, distinct from Business and wallet;
- provider-of-record: `biz_ops_pilot`; runtime: deterministic
  `OPERATOR_INVOKED`, software `deterministic-buyer@1`;
- Standing Grant: `grt_ops_pilot_snapshot_v1`, Human grantor
  `usr_alpha_operator`, non-delegable, offer `off_arc_snapshot_v2`, counterparty
  `biz_signal_forge`, exact per-action ceiling `0.100000 USDC`, cumulative
  allowance `0.200000 USDC`, expiring 1 September 2026;
- authority path: Action Intent `int_arc_snapshot_agent_v1` -> policy `ALLOW`
  (`WITHIN_PERSISTED_AUTHORITY`) -> Execution Authorization
  `xau_arc_snapshot_agent_v1` -> obligation `obl_arc_snapshot_agent_v1`;
- allowance after one consumed authorization: `0.100000 / 0.200000 USDC` used;
- Circle provider transaction: `ce68b327-be10-5714-9475-d2941d15d73d`;
- Arc transaction:
  `0x4e0c30f33cf96364469fa814fe61388199a0ba9cd9581d6b10ee7e09a1f44093`;
- exact Arc token transfer: Ops Pilot -> Signal Forge, `0.100000 USDC`, verified
  against chain `5042002`, configured USDC interface, receipt, payer, and payee;
- service execution: `svc_arc_snapshot_agent_v1`, `COMPLETE`, source
  `arc-block:58768105`, output SHA-256
  `42cecb68f122f46eba0e175cb93c58f457870f982b6ca6a65d0fb148fa34ab81`;
- replay proof: Agent preparation returned `ALREADY_CONSUMED` / `ALREADY_EXISTS`,
  reconciliation stayed `COMPLETE`, service execution returned
  `ALREADY_COMPLETE`, and resubmission from `COMPLETE` failed closed;
- policy tests deny wrong requester, offer, counterparty, per-action amount,
  exhausted allowance, expiry, and revoked grant;
- protected Preview: `dpl_6rJLRfDT5SVXs35vbnDpEWLkkcK6`, `READY`; protected
  render showed the Agent scope, allowance, second settlement and completion;
  anonymous access stayed HTTP `302`, temporary future-Preview environment
  variables were removed, and the automation bypass was revoked (remaining zero).

The Agent did not possess wallet custody or submit an independent wallet signature.
The platform executed the already authorized Business obligation through the same
Circle Treasury adapter. This proves bounded delegated operation, not a hosted Agent
runtime or x402 machine-payment exchange.

## Observed Circle Gateway x402 proof

- implementation checkpoint: `1c15f7d2a98429d4c62f0ee718f30a624106cfee`,
  pull request `#16`;
- selected provider package: `@circle-fin/x402-batching` `3.4.0`; protocol x402
  v2, scheme `exact`, network `eip155:5042002`;
- live Gateway registry: contract
  `0x0077777d7EBA4688BDeF3E311b846F25870A19B9`, Arc domain `26`, minimum
  signature validity `604800` seconds, USDC
  `0x3600000000000000000000000000000000000000`;
- funding: Ops Pilot approved Gateway in successful Arc transaction
  `0x3a3629a9d6b755d921b918eaab0cc849b5dc1c057dbece54c5e06068a5335cde`,
  block `58770843`, then deposited exact `1.000000 USDC` in successful transaction
  `0x2280402061b6a7960efd6d24804a753310eba5e3f193b0a5a66225c11b7c2c53`,
  block `58770884`;
- authority: Agent `agt_ops_pilot_buyer_v1`, Human-issued non-delegable grant
  `grt_ops_pilot_x402_v1`, exact offer `off_arc_snapshot_x402_v1`, exact
  counterparty `biz_signal_forge`, `0.010000` per-action maximum and `0.020000`
  total allowance;
- commitment chain: `int_arc_snapshot_x402_v1` -> policy decision -> consumed
  `xau_arc_snapshot_x402_v1` -> obligation `obl_arc_snapshot_x402_v1` ->
  settlement `set_arc_snapshot_x402_v1` -> payment
  `pay_arc_snapshot_x402_v1`;
- signing: Circle Developer-Controlled Wallet Signing API produced the EIP-712
  EIP-3009 signature; no local private key was introduced. The exact signed payload
  was digest-bound and persisted before facilitator handoff;
- provider outcome: Gateway verified payer
  `0xcd4194d3cab4fe5e306ac397f8896b4b8e0f7ede` and returned settlement receipt
  `3d6239e1-9d29-46a0-bfb8-117578b9d1d4` for exact `0.010000 USDC` to Signal
  Forge;
- independent balance observation: payer Gateway balance `0.990000`, seller
  Gateway balance `0.010000`, both pending batches `0`;
- classification: the per-payment outcome is `PROVIDER_REPORTED` from
  `CIRCLE_GATEWAY_X402`; it is not falsely assigned a direct Arc transaction hash.
  The deposit transactions remain independently Arc-observed facts;
- economic result: Ops Pilot `SERVICE_COST / OUTFLOW` and Signal Forge
  `REVENUE / INFLOW`, exact `0.010000 USDC`, common-control provenance, each
  posted once;
- paid service: `svc_arc_snapshot_x402_v1`, source Arc block `58771214`, output
  SHA-256 `d9f0a6bef580aa7ce9150840bce004ba39c590dc8407677109c74ac794994e84`;
- HTTP proof: the protected resource returned HTTP `402` with
  `PAYMENT-REQUIRED`; the committed signed request returned HTTP `200` with
  `PAYMENT-RESPONSE` and the paid service output. Repeated purchase and service
  commands returned `ALREADY_COMPLETE` without a second payment or delivery;
- local verification: lint, typecheck, 28/28 tests, production build, migrations
  `001`-`006`, database write/read and rollback proof, and zero npm audit findings;
- implementation-head verification: GitHub Actions run `32838374285`, successful;
- final PR verification: run `32839024137`, successful; merge
  `8d60744ec7c330a0403ef4787bc21634fbf2ed01`; accepted-main run
  `32839154514`, successful;
- protected Preview: `dpl_2QPTA8bHtcK8BSzbw6PhzSN132Nu`, target Preview,
  `READY`; anonymous access returned HTTP `302` to Vercel SSO, protected render
  exposed the exact x402 state, protected API repeated the `402`/`200` header
  proof, and temporary Preview variables plus automation bypass were restored to
  zero;
- runtime log scan contained only the active `pg` TLS-semantics warning; no
  application request failure was observed.

The first Circle typed-data request failed validation because the provider requires
an explicit `EIP712Domain` declaration even though the SDK input type did not add
it. The adapter now serializes that domain explicitly. The first facilitator
verify returned HTTP `400` because the x402 v2 envelope omitted the required
`resource` field. No settlement occurred; Inomasa added that field around the same
stored signature without changing or re-signing payer, payee, value, nonce, or
validity. Both failures remain implementation evidence rather than manufactured
PASS states.

Gateway's seven-day minimum validity makes the exact signed payload an effect
commitment boundary once handed to the facilitator. Revocation can prevent an
unconsumed Inomasa authorization from reaching that boundary; it cannot erase an
already handed-off EIP-3009 authorization or rewrite a completed result. Ambiguous
settlement must retain and reconcile the same stored payload rather than sign a
new nonce.

## Checkpoint F selected implementation route

Status: `IMPLEMENTED / EXTERNAL PROOF PENDING` until the controlled allocation,
later economic use, full regression, and accepted-main evidence are observed.

Generic CAPITAL is represented by reusable Provider, mandate, review, decision,
dedicated execution-account, allocation, and later-use records. Multiple Providers
inspect the same content-addressed decision material under their own mandates; the
system persists attributable approval or decline instead of producing a platform
score. An approved allocation becomes executable only after explicit acceptance by
the active Business controller.

The selected Alpha instrument is `CONTROLLED_TEST_ALLOCATION` with return profile
`NONE`. This is a bounded testnet proof shape, not a loan, security, repayment
promise, final legal product, or Production exposure. Capital provenance fails
closed to `COMMON_CONTROL_TEST` when either the Provider fixture or reviewed
Business history is common-control. A dedicated Circle Developer-Controlled EOA
executes an exact direct Arc Testnet USDC allocation. Inomasa records exactly one
`CAPITAL / INFLOW` effect only after Circle completion and exact Arc receipt/event
verification; it never posts the allocation as Revenue.

The schema change is needed because accepted economic entries previously required
a commerce obligation and settlement, which would falsely make Capital look like a
sale. Alternatives considered were embedding Capital in commerce, keeping it only
in Evidence/JSON, or adding a separate Capital ledger. Those routes respectively
misclassify meaning, weaken relational integrity, or create competing economic
truth. The selected extension retains one economic-entry table with an exclusive
commerce-or-Capital source constraint. It adds no dependency or hosted service.
PostgreSQL and Circle lock-in do not increase beyond the accepted adapters; tables
and ports remain vendor-neutral, the Circle implementation is replaceable, and the
versioned migrations are reversible before any Production authority exists.

Current primary sources reviewed for execution:

- Circle Developer-Controlled Wallets overview and application-policy boundary:
  https://developers.circle.com/wallets/dev-controlled
- Circle EOA creation and idempotent wallet provisioning:
  https://developers.circle.com/wallets/dev-controlled/create-your-first-wallet
- Circle documented cross-wallet transfer shape:
  https://developers.circle.com/wallets/dev-controlled/transfer-tokens-across-wallets
- Arc deployment/faucet guide and Arc payment foundation:
  https://docs.arc.io/arc/tutorials/deploy-on-arc and
  https://docs.arc.io/build/payments

Circle's public faucet is an external funding dependency for the dedicated Provider
EOA. Testnet faucet funding is operational setup, not Business revenue, independent
demand, Provider performance, or a Capital allocation itself.

## Completed external proof sequence

All eleven steps below were observed successfully on 25 August 2026. They remain
the recovery/replay sequence; completion does not authorize Production or broader
Agent authority.

1. Securely create/register the Circle entity secret and API key outside Git.
2. Create or select one dedicated Alpha wallet set and configure the three private
   environment variables.
3. Run migrations and deterministic bootstrap in `PRIVATE_ARC_TESTNET`.
4. Provision the two EOA Treasury accounts idempotently.
5. Fund the payer account through the Circle Faucet.
6. Persist one offer, terms snapshot, obligation, and Human execution authorization.
7. Submit a small Circle transfer on Arc Testnet.
8. Treat timeouts/empty provider results as `OUTCOME_UNKNOWN`; reconcile before any
   retry.
9. After Circle reports completion and the Arc transaction is observed, post the
   seller revenue and buyer service cost once. Arc verification must bind the exact
   payer, recipient, amount, successful receipt, chain, and configured USDC log.
10. Execute the paid `arc-market-snapshot` service only after settlement is
    `COMPLETE`; persist its output digest and delivery Evidence.
11. Display transaction/explorer, obligation, settlement, allocation, service
    delivery, and Evidence facts in the protected Preview.

## Primary implementation evidence

- Circle Developer-Controlled Wallet quickstart:
  https://developers.circle.com/wallets/dev-controlled/create-your-first-wallet
- Circle Arc Testnet transfer guide:
  https://developers.circle.com/wallets/dev-controlled/transfer-tokens-across-wallets
- Circle supported wallet blockchains/account types:
  https://developers.circle.com/wallets/supported-blockchains
- Circle Agent Wallet supported blockchains and policy limitation:
  https://developers.circle.com/agent-stack/agent-wallets/supported-blockchains
  and https://developers.circle.com/agent-stack/agent-wallets/wallet-operations/custom-policies
- Circle Gateway Nanopayments EOA limitation:
  https://developers.circle.com/gateway/nanopayments/quickstarts/buyer
- Circle Gateway x402 seller integration:
  https://developers.circle.com/gateway/nanopayments/quickstarts/seller
- Circle Developer-Controlled Wallet typed-data signing:
  https://developers.circle.com/api-reference/wallets/developer-controlled-wallets/sign-typed-data
- Circle User-Controlled recovery:
  https://developers.circle.com/wallets/user-controlled/recover-account
- Arc network and asset registry:
  https://docs.arc.io/arc/references/connect-to-arc and
  https://docs.arc.io/arc/references/contract-addresses

## Architecture impact at the checkpoint

At the time of this proof, no revision to the then-active Canonical Architecture
was required. That architecture is now `SUPERSEDED / HISTORICAL`; the statement is
retained as checkpoint provenance, not current authority. The implementation facts
remain valid: Business stayed primary; identity, account, and authority remained
separate; account assurance matched the actual platform-controlled EOA capability;
settlement required reconciliation/allocation before economic posting; and Evidence
remained separate from Reputation and Capital. The implementation created a
provider adapter and lower-assurance profile, not a semantic amendment.
