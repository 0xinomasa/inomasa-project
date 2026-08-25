# Accelerated controlled Alpha execution

## Status

Status: `FIRST INTEGRATED ARC TESTNET VERTICAL VERIFIED / SHOWCASE ITERATION ACTIVE`.

This is the live execution contract after B5. B0-B5 remain accepted historical
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

Gateway/Nanopayments is **not selected** by this decision. The payment boundary is
named `selected compatible payment/x402 adapter` until direct settlement has been
proven and the R4 implementation evidence selects a scheme.

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

The first two Circle wallets, two Arc transactions, exact economic allocation, two
paid service executions, and one bounded Agent-triggered repeat purchase are now
proven. This does not claim user custody, Protected Treasury, x402, a durable hosted
Agent/background worker, LLM authority, Reputation, Capital, Production value, or
organic demand.

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
- Circle User-Controlled recovery:
  https://developers.circle.com/wallets/user-controlled/recover-account
- Arc network and asset registry:
  https://docs.arc.io/arc/references/connect-to-arc and
  https://docs.arc.io/arc/references/contract-addresses

## Architecture impact

No Canonical Architecture revision is required by this checkpoint. Business remains
primary; identity, account, and authority remain separate; account assurance is
explicitly lowered to match actual platform-controlled EOA capability; settlement
does not become economic truth until reconciliation/allocation; Evidence remains
separate from Reputation and Capital. The implementation creates a provider adapter
and lower-assurance profile, not a semantic amendment.
