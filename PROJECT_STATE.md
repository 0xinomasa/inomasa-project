# Inomasa project state and takeover

This file is the concise repository-native entry point for a human or AI operator taking over Inomasa engineering. It records current mutable state separately from durable operating rules. Chat history is context only and is never required engineering evidence.

## Current mutable state

| Item | Accepted state |
| --- | --- |
| Source repository | Private `0xinomasa/inomasa-project` |
| Accepted branch | `main` |
| Active product/architecture authority | [`Inomasa Concept & Architecture v1.0`](docs/architecture/inomasa-concept-and-architecture-v1.0.md): `ACCEPTED / ACTIVE` |
| Active Alpha implementation guide | [`Inomasa Alpha Implementation & Testnet Realization v1.0 — REV2`](docs/engineering/inomasa-alpha-implementation-and-testnet-realization-v1.0.md): `ACCEPTED / ACTIVE` |
| Historical architecture status | Inomasa Canonical Architecture v1.0 is `SUPERSEDED / HISTORICAL`; it and B0-B5-era planning remain lineage, not current authority |
| Active realization program | **Controlled Arc Testnet Product Alpha REV2**; Checkpoints A-G are accepted on GitHub `main`; Checkpoint H is the active implementation point |
| REV2 completion status | **IN PROGRESS**; Checkpoints A-G are accepted and verified within their scoped gates; Checkpoint H and the `CONTROLLED ARC TESTNET PRODUCT ALPHA — VERIFIED` completion gate are not verified |
| Standing execution authorization | **ACTIVE — REV2 CHECKPOINTS C-H, SEQUENTIAL ONLY**. The owner authorized continuous execution from Checkpoint C through H on 27 August 2026. Each checkpoint still requires its predecessor accepted on GitHub `main`, checkpoint-specific research/proof/regression, persistent-state closeout, PR/CI/review/merge, and observed accepted-main evidence before advancing. This authorization does not extend beyond H or to Production/mainnet, public anonymous access, live MIGRATE, unrestricted Agent authority, or Production/public Capital exposure, and remains active until completed, revoked, or changed by the owner. |
| Next implementation checkpoint | **REV2 Checkpoint H — Integrated Verification acceptance**: the uninterrupted C-H proof, executable integrated matrix, adversarial regressions, local production runtime/browser proof, build-artifact secret-boundary proof, database verification, and current primary-source review are locally observed; obtain protected Preview/runtime evidence, PR CI/review/merge, accepted-main CI, and continuity closeout before the completion label can change |
| Current execution status | **CHECKPOINT G ACCEPTED / CHECKPOINT H IMPLEMENTED LOCALLY — ACCEPTANCE PENDING** under standing sequential authorization C-H. Protected Preview and accepted-main evidence remain mandatory, and the final Alpha completion label is still unverified |
| Current browser capability | **VERIFIED — ENVIRONMENT-SCOPED**. On 2026-08-28, Ubuntu ARM64 (`aarch64`) launched headless Chromium through `/usr/local/bin/playwright-proot` wrapper version `0.1.18`; a local `data:` page opened, snapshot/evaluation completed with `readyState: complete`, and the session closed. This capability fact remains separate from the accepted E/F/G local application-browser proofs and does not itself prove hosted Preview or product readiness |
| B5 result | `VERIFIED / PASS` historical decision-and-continuity evidence; Human-Controlled Business Entry is lineage rather than the current standalone realization boundary |
| B3 merge evidence | `7dfa25b1d6ce005f7de7c3c06ea19a22e0136ec5` |
| B3 main CI evidence | Engineering verification run `32603268206`, `push/main`, completed successfully |
| B4 acceptance evidence | Pull request `#7`, merge `d2829c35e52fc59d8579e16d88956997cb79e681` |
| B4 accepted-main CI evidence | Engineering verification run `32704891257`, `push/main`, completed successfully, including PostgreSQL proof |
| B5 acceptance evidence | Pull request `#10`, merge `395dfd9aa105cdd95088ffd5602739d6c79cbba5` |
| B5 accepted-main CI evidence | Engineering verification run `32794327644`, `push/main`, completed successfully, including PostgreSQL proof |
| Alpha implementation checkpoint | Commit `724e96b175b2dbe08e24f70a5f98c8f8f95b800a`, pull request `#12`, merge `6ac8045db9bb762b529f145c589dced39b901cf1`; PR verification run `32822885262` and accepted-main run `32823716812` completed successfully with 19/19 tests, production build, and clean PostgreSQL migrations `001`-`004` |
| First integrated Alpha proof | Pull request `#14`; two Circle Developer-Controlled EOA Treasuries `ACTIVE`; settlement `set_arc_snapshot_v1` completed for exact `0.250000` Arc Testnet USDC in transaction `0x887980b47c7c1eeb9f5457aa80323e9b03bd7934008811ef56fbcaf1820b3913`; paid service `svc_arc_snapshot_v1` completed from Arc block `58765304` |
| Bounded Agent proof | Commits `262aa5f` and `8fc9657`; Agent `agt_ops_pilot_buyer_v1` is provider-attributed, operator-invoked, and non-custodial; exact offer/counterparty/per-action/cumulative/expiry/revocation policy issued and consumed authorization `xau_arc_snapshot_agent_v1`; settlement `set_arc_snapshot_agent_v1` completed for `0.100000` Arc Testnet USDC in transaction `0x4e0c30f33cf96364469fa814fe61388199a0ba9cd9581d6b10ee7e09a1f44093`; service `svc_arc_snapshot_agent_v1` completed from Arc block `58768105` |
| Circle Gateway x402 proof | Implementation commit `1c15f7d2a98429d4c62f0ee718f30a624106cfee`, pull request `#16`, merge `8d60744ec7c330a0403ef4787bc21634fbf2ed01`; final PR run `32839024137` and accepted-main run `32839154514` completed successfully. Ops Pilot deposited `1.000000` Arc Testnet USDC to Gateway in transaction `0x2280402061b6a7960efd6d24804a753310eba5e3f193b0a5a66225c11b7c2c53`; Agent payment `pay_arc_snapshot_x402_v1` settled exact `0.010000` USDC through x402 v2 `exact`, provider receipt `3d6239e1-9d29-46a0-bfb8-117578b9d1d4`; Gateway balances became payer `0.990000`, seller `0.010000`, pending zero; service `svc_arc_snapshot_x402_v1` completed from Arc block `58771214` |
| Current continuity checkpoint | REV2 Checkpoint G — Reference Economy & Proof Fixtures is accepted on GitHub `main`; Checkpoint H Integrated Verification is implemented on its working branch with local/private-testnet proof, but remains unaccepted until hosted and GitHub gates complete |
| Checkpoint B acceptance evidence | Pull request `#22`; implementation commit `97ad37446d2701adedd165de19d3e67acc198d3a`; PR verification run `33024043557`; merge commit `104a7e75ced8def6841e86603ef68778baaa2375`; and accepted-main run `33024149185` completed successfully, including 31/31 tests, lint, typecheck, Next.js `16.3.3` production build, and clean PostgreSQL reconstruction through migration `007` plus write/read/rollback proof |
| Checkpoint B runtime evidence | Configured private-testnet migration/write-read/rollback passed; local production HTTP returned `200` for Home and `checkpoint-b-api-proof` plus expected `404` for an unknown site; automated visual browser proof remains unclaimed because `agent-browser` is not installed in the verified Ubuntu Proot profile |
| Checkpoint B generic proof instance | `Checkpoint B API Proof`, Business `biz_checkpoint_b_api_proof_a9f2e7fabf34`, template `api-data-compute@1`, route `/business/checkpoint-b-api-proof`, provenance `COMMON_CONTROL_TEST`, logical Treasury `PENDING`; no wallet provisioning, transfer, independent demand, or new economic activity was claimed |
| Checkpoint C accepted implementation | **VERIFIED / PASS within Checkpoint C scope**. Migration `008` adds generic Business-Agent role/capability/runtime records, recoverable ERC-8004 operations, immutable Action-Intent identity linkage, chain-verified Evidence, and protected Agent detail UI. Circle stays an execution adapter; wallet, Business, Agent, and ERC-8004 identity remain distinct |
| Checkpoint C private-testnet proof | Ops Pilot has two generic Agent records. Buyer Agent `agt_ops_pilot_buyer_v1` is ERC-8004 Agent `886498` at `eip155:5042002:0x8004A818BFB912233c491871b3d84c89A494BD9e`; registration transaction `0x6dbd74350f1a2426fe87e604e6ffca5768b55d38139118750470323ae890fd88` and metadata transaction `0xa34df9a62721a0c72417bd7eb3cd6cc673a055570efeb2aed4038a09e6295a32` were receipt/event/owner/tokenURI verified. Identity-bound payment `pay_arc_snapshot_x402_8004_v1` completed exact `0.010000` testnet USDC with provider receipt `0a58b02e-e158-4465-b8f9-5c2fd2cc51e6`; payer/seller Gateway balances are `0.980000` / `0.020000`, pending zero. Delivery `svc_arc_snapshot_x402_8004_v1` completed from Arc block `59060455`, digest `47f9142bf657663bcd09472da7fe420a7e9161e65a25ec5ba7582cd793603bfe`, and replay returned `ALREADY_COMPLETE`. All provenance is `COMMON_CONTROL_TEST`; Inomasa has ingested no ERC-8004 feedback and makes no claim about unqueried global registry state, a score, or independent demand |
| Checkpoint C acceptance evidence | Pull request `#25`; implementation commit `d9236fe0c95a4770a986494845c1f297eef4b8ba`; final head `1667735838105343cd4d5273895efda2bdff72fd`; final PR verification run `33043930935`; merge commit `d3b26ce6e5e4808d415430d80697a4c78720415d`; and accepted-main run `33044047209` completed successfully, including npm audit with zero vulnerabilities, lint, typecheck, 37/37 tests, Next.js `16.3.3` production build, and fresh PostgreSQL 17 reconstruction through migration `008` plus write/read/rollback proof |
| Checkpoint C runtime verification | Current primary Arc/ERC-8004/Circle sources reviewed; configured private-testnet migration/proof through `008`, idempotent identity/payment/delivery replay, Arc RPC proof, and production HTTP `200` Business/Agent render plus expected unknown-Agent `404` passed. Automated visual browser proof remains unclaimed because `agent-browser` is not installed |
| Checkpoint D accepted implementation | **VERIFIED / PASS within Checkpoint D scope**. Migration `009` implements a protocol-neutral service catalog, offer-bound generic x402 HTTP route with the legacy route retained, an ERC-8183 job/operation ledger, Circle per-leg idempotent reconciliation, historical-block Arc contract/receipt/USDC verification, canonical offchain delivery evidence, and exact payout/refund accounting. ERC-8183 remains a draft; the accepted integration is limited to the selected non-hooked, zero-fee Arc Testnet deployment |
| Checkpoint D private-testnet proof | Arc AgenticCommerce job `182088`, internal `job_commerce_readiness_8183_v1`, reached `COMPLETED` for exact `0.050000` testnet USDC. Funding transaction `0x0502a09790fa4127a0c6726492cfab00d1bcfa4c722bb4e9881690ae927e1ffa`, completion/payout transaction `0x21f84636a01ca34ee0d23743ebcb28140437b5a345032b777b17fd43f9b3c653`, and deliverable commitment `0x21e3af36011b6f9e30706a5159a5dc0428a792a2233f242bde4b414e13f4021a` were chain verified. Six-leg replay returned `ALREADY_COMPLETE`; exactly one Revenue/Service Cost pair exists. Existing x402 payments remain complete and both legacy/generic production HTTP routes returned the committed `402`/`200` flow. Provenance is `COMMON_CONTROL_TEST`; visual browser proof remains unclaimed because `agent-browser` is unavailable |
| Checkpoint D acceptance evidence | Pull request `#27`; implementation commits `b579dd7382d4e5512a9fac160e3a6dc80579296e`, `f53d31bc13973f593f1e8d54797ae16ec7a9caba`, and `56a9c7edfe14b6ad3ad7b73316797c635ad96c17`; PR verification run `33114737524`; merge commit `ce4136a2997f7b4483b1d8d2d51d791ba2d7b2bf`; and accepted-main run `33114924079` completed successfully, including audit with zero vulnerabilities, lint, typecheck, 44/44 tests, Next.js `16.3.3` production build, and fresh PostgreSQL 17 reconstruction through migration `009` plus write/read/rollback proof |
| Checkpoint E accepted implementation | **VERIFIED / PASS within Checkpoint E scope**. A protocol-neutral contextual Economic Activity model and read-only PostgreSQL adapter reconstruct one Activity per obligation from accepted Business, Agent, commerce, accounting, delivery, Evidence, ERC-8004, x402, and ERC-8183 facts. Home/Economy, Business Workspace, and Founder/System surfaces expose dynamic standards badges, distinct complete/failed/pending/unknown states, and source-scoped progressive proof without a second ledger or schema/write-path change |
| Checkpoint E private-testnet proof | Five unique common-control obligations reconstruct as five `COMPLETE` Activities totaling exact non-doubled `0.420000 USDC`; protocol participation is Arc USDC `5`, x402 `2`, ERC-8004 `1`, ERC-8183 `1`; five Revenue and five Service Cost entries remain separate accounting effects. Inventory remains three Businesses, two Agents, eleven Evidence facts, and five deliveries. Both x402 Activities expose provider receipts and no fabricated direct settlement Arc transaction; ERC-8183 job `182088` exposes six unique lifecycle transactions. Ops Pilot and Signal Forge each see five scoped Activities; Checkpoint B API Proof sees zero |
| Checkpoint E runtime/browser verification | Local production Home, Ops Pilot Workspace, generic empty-history Workspace, and Founder/System Dashboard loaded through the accepted Ubuntu Proot Playwright wrapper. Expected counts, roles, protocol badges, ArcScan guards, progressive proof, and the 390-pixel responsive layout were observed with zero console errors or warnings. This is local controlled-Alpha UI evidence, not public access or protected Preview proof |
| Checkpoint E acceptance evidence | Pull request `#30`; implementation commit `5ad080f6beaa182c02fd784a32d08468376f65cb`; focused review recorded PASS; PR verification run `33134596722`; merge commit `b43cfbd901c1906284d11722fc95d4e8ff585357`; and accepted-main run `33134731453` completed successfully, including lint, typecheck, 48/48 tests, Next.js `16.3.3` production build, and fresh PostgreSQL 17 reconstruction through migration `009` plus write/read/rollback proof |
| Checkpoint F accepted implementation | **VERIFIED / PASS within Checkpoint F scope**. Generic Provider, mandate, immutable review material, attributable decision, dedicated execution account, controller-accepted allocation, and bounded later-use records are implemented behind domain and execution ports. Migration `010` adds the Capital model and an exclusive commerce-or-Capital economic source; migration `011` preserves fail-closed common-control or independent provenance. Economic History and UI expose Capital separately from commerce and never classify allocation as Revenue |
| Checkpoint F private-testnet proof | Two common-control Provider fixtures inspected the same material digest: Northstar approved exact `0.200000` USDC while the independent-only mandate declined it without an allocation. The accepted allocation completed in Arc transaction `0xadb90f8da6f304ddf36291c93c68e088db6adbcc6d4f71eb21c4eccfc107d35f`, block `59239291`, and created exactly one `CAPITAL / INFLOW` entry. Linked use `cpu_ops_pilot_northstar_v1` procured a later exact `0.100000` service through transaction `0xe729821842011bc56d1a4f3a43f15ca3e331f41d746d3877fe72d1f03d1666eb`; delivery `svc_capital_funded_snapshot_v1` completed from block `59239769`, digest `c6dbabe7c90017b3ff5974040baef62a1a03d08f990888b6a0329a7132c657c2`. Final proof reports seven complete Activities, commerce volume `0.520000`, Capital volume `0.200000`, thirteen economic entries, fourteen Evidence facts, and six deliveries. Replay retained the original transactions and returned `ALREADY_COMPLETE`; both final-state resubmits failed closed |
| Checkpoint F local/runtime verification | npm audit found zero vulnerabilities; lint, typecheck, 54/54 tests, Next.js `16.3.3` production build, migrations `001`-`011`, database write/read/rollback, and Checkpoint E regression passed. Local production Home, Ops Pilot Workspace, Capital, and Founder/System surfaces rendered the exact final counts and separated volumes; the allocation ArcScan link targeted the verified tx. A 390-pixel viewport had no horizontal overflow and the browser reported zero console errors or warnings |
| Checkpoint F acceptance evidence | Pull request `#32`; implementation commits `a01675fa41788f43d7b516c08dabfb0975bc92ed`, `ee53fb2fde12a763cd235a80aa91a797fecbd36b`, and `3c347eaf0547d187dfa7536836411a016fee388e`; focused review recorded PASS; PR verification run `33151927079`; merge commit `3a789f6b752808d790f121dc5ab5e46828964231`; and accepted-main run `33152100522` completed successfully, including engineering checks and PostgreSQL migration/persistence proof |
| Checkpoint G accepted implementation | **VERIFIED / PASS within Checkpoint G scope**. A fresh four-template common-control population contains four users, four Businesses, four Agents, and two Capital Providers. Reference Workbench composes verified ERC-8004 identity, exact x402 commerce, completed non-hooked zero-fee ERC-8183 work, two provider-specific Capital decisions, an exact allocation, and bounded later use through the accepted generic capability and persistence paths |
| Checkpoint G private-testnet proof | ERC-8004 Agent `886972`; identity-bound x402 exact `0.010000` receipt `3d36d42a-5cfb-4f53-8012-a428514ba56b`; ERC-8183 job `182143` completed exact `0.050000`; fresh providers approved/declined the same `2 / 0.060000` material; exact `0.200000` allocation transaction `0xd5efd5fb98e2d5269a03d37c5f8f4252d1598a86a6343937f4bacf743a2777ac`, block `59273457`; linked exact `0.100000` later-use transaction `0xff07c68236c84f233d6c853ff2c0d81285d97c7edbfb4c76002a53e0feeaf4a4`. Final scoped history is three commerce Activities totaling `0.160000` plus one separate Capital Activity totaling `0.200000`; all provenance is `COMMON_CONTROL_TEST` |
| Checkpoint G local/runtime verification | Replay retained the original external facts and returned terminal/current states; final allocation and settlement resubmits failed closed. npm audit found zero vulnerabilities; lint, typecheck, 56/56 tests, Next.js `16.3.3` production build, migrations `001`-`011`, database write/read/rollback, Checkpoint E/F regressions, baseline/reference x402 HTTP `402`/`200`, and production-browser desktop/390-pixel checks passed with no overflow or console warning/error |
| Checkpoint G acceptance evidence | Pull request `#34`; implementation commits `19aff7e58e15732c0e896cc3b73dd6ce27c19f16`, `16466823bc2aa6c43b7245732dfda0e85d5060fb`, and `c918565bd8c6dc4d633b933aad8f8bd09df3fb02`; focused review recorded PASS; PR verification run `33172052503`; merge commit `4f1f372ab029633e4eff4c1783fe81c0c4f0684c`; and accepted-main run `33172186280` completed successfully, including engineering checks and PostgreSQL migration/persistence proof |
| Checkpoint H implementation candidate | An executable C-H replay plus integrated proof matrix covers the exact accepted proof database; adversarial regressions add not-yet-valid/environment-mismatched authority, no blind resubmission from an ambiguous settlement, and Capital acceptance replay rejection. Normal `npm run verify` now checks that private database/Circle/Vercel environment-variable names do not reach browser artifacts. No schema, dependency, contract, provider execution, or product semantic changed |
| Checkpoint H local/private-testnet evidence | One uninterrupted `npm run alpha:checkpoint-h:proof` passed C, D, E, F, G, and the integrated H matrix: seven Businesses, six Agents, four Capital Providers, eleven complete Activities, exact commerce `0.680000` USDC, separate Capital `0.400000` USDC, twenty economic entries, twenty-two Evidence facts, and nine deliveries, all `COMMON_CONTROL_TEST`. C historical receipt replay used Arc's currently documented public dRPC endpoint because the primary public RPC returned null for that old receipt. Audit zero vulnerabilities, lint, typecheck, 56/56 tests, build, client-artifact safety, migrations `001`-`011`, database write/read/rollback, local production browser, and both x402 HTTP flows passed. Hosted/GitHub acceptance gates remain pending |
| Checkpoint H protected Preview evidence | Vercel deployment `dpl_BvBVwj2WrzD2jm57bit3i8BP8X7w` is `READY` from H commit `d4d5bc7c3a486b5e9a68e16be0de2e5c3e43e359` in `iad1`. Authenticated inspection rendered Home, Founder/System, Reference Workbench, its ERC-8004 Agent, and Capital with the exact integrated state; anonymous `/system` returned HTTP `302` to Vercel SSO without the application shell. No 5xx request was observed. Vercel reported the temporary Preview environment set removed, automation bypass count zero, and Standard Protection still covering all Previews. Runtime logs retained only the known `pg` TLS-semantics warning governed by `PG-TLS-SEMANTICS-01`; it was not a request failure and does not authorize a dependency/TLS change |
| Authority migration local evidence | npm audit (0 vulnerabilities), lint, typecheck, 28/28 tests, Next.js `16.3.3` production build, migrations `001`-`006` already current, database write/read/rollback, local Markdown-link audit, and `git diff --check` passed; no product/provider/database behavior changed |
| Authority migration acceptance evidence | Pull request `#19`; implementation commit `751bd4c4d5e75b7a6fc8087c99034ae05089cf4e`; final PR head `218cdd273e9b6d291703e930aada1e4b768f2057`; final PR verification run `32949059522`; merge commit `d3cba7871204ba91a20094ce4353db0a650933b9`; and accepted-main run `32949201003` completed successfully, including clean PostgreSQL reconstruction/proof |
| B4 local pre-deployment evidence | Node `22.23.2`, npm `10.9.8`; clean install and audit (0 vulnerabilities), lint, typecheck, 6/6 tests, production build, and production-server HTTP `200` with expected Inomasa shell anchors |
| Product implementation boundary | Accepted `main` ends at Checkpoint G: the deterministic Business/economic kernel, generic Business and Agent systems, ERC-8004 identity linkage, generic x402 service capability, ERC-8183 funded-work/accounting, contextual Economic History/UI observability, generic provider-driven Capital, and fresh four-template Reference Economy composition are accepted. Integrated Verification remains Checkpoint H; Production/mainnet and broader exposure remain unauthorized |
| Verified private-testnet state | All accepted fixtures remain synthetic/common-control: Signal Forge, Ops Pilot, Checkpoint B API Proof, the four Reference Economy Businesses, six Agents, and four Capital Providers. The proof database has nine exact settled commerce obligations totaling `0.680000` USDC, two exact Capital allocations totaling `0.400000`, twenty economic entries, twenty-two narrow Evidence facts, and nine complete service executions. Checkpoint B API Proof still has only a `PENDING` logical Treasury and no economic activity; none of this proves independent demand, Production Capital, or real investment performance |
| Repository continuity marker | `src/index.ts` `repositoryBaseline` is intentionally retained as a machine-readable descriptive marker maintained since B1. It is subordinate to the active authority documents and `PROJECT_STATE.md`, and it grants no runtime or product authority |
| Current blocking gate | No blocker currently prevents Checkpoint H acceptance work. `PG-TLS-SEMANTICS-01` remains active only for its scoped dependency change; transient external PostgreSQL connection termination is a retryable execution observation, not an accepted product failure or permission to alter TLS semantics |
| Baseline fixture/product-label status | Signal Forge, Ops Pilot, both accepted buyer Agents, all four Reference Economy Businesses, and all four Capital Providers remain controlled proof fixtures. Their rendered commerce/Capital state is not generic product capacity, independent demand or underwriting, public availability, or active roadmap authority |
| Next.js security baseline | Next.js `16.3.3` is the selected patched Active LTS runtime following the [official 2026-08-25 security release](https://nextjs.org/blog/august-2026-security-release); pull request `#18`, merge `97608da2755bde50e900f71d5c94db9c931a7685`, and accepted-main run `32945917201` passed without product or database changes |
| First deployment evidence | Vercel deployment `dpl_HLPGUzp74Z1Yt3DunwgXvLVMddAt` from `48a980411f409f86f9e69fdf0b8e9a2119d17eac`, incorrectly targeted Production, ended `ERROR` (`STATIC_BUILD_NO_OUT_DIR`) |
| B4 protected Preview evidence | Vercel deployment `dpl_az1jRshRMZYn57RbFxsvkozLJZ2k` from accepted `main` commit `d75bcd5472f35f0cc962c6a420473957915153f6`; target `preview`, state `READY` |
| Deployment protection evidence | Anonymous request redirected to Vercel SSO without the shell; authorized request rendered expected shell anchors; temporary automation bypass removed and Vercel Authentication remained enabled |
| Alpha protected Preview evidence | Deployment `dpl_6XgtJVdU9uQPUb3jMz7g7UnodGKZ`; target Preview, state `READY`, protected render displayed both Businesses, exact amount, tx hash, `COMPLETE`, `REVENUE`, and `SERVICE_COST`; anonymous access remained HTTP `302` to Vercel SSO |
| Agent Alpha protected Preview evidence | Deployment `dpl_6rJLRfDT5SVXs35vbnDpEWLkkcK6`, target Preview, state `READY`; protected render displayed the Agent, scoped offer, `0.100000 / 0.200000 USDC` allowance, second settlement, and `COMPLETE`; anonymous access remained HTTP `302`; future-Preview env count and automation-bypass count were restored to zero |
| x402 Alpha protected Preview evidence | Deployment `dpl_2QPTA8bHtcK8BSzbw6PhzSN132Nu`, target Preview, state `READY`; protected render displayed Gateway x402, exact `0.010000 USDC`, receipt, and `COMPLETE`; protected endpoint returned HTTP `402` plus `PAYMENT-REQUIRED`, then HTTP `200` plus `PAYMENT-RESPONSE` for the committed paid payload; anonymous access remained HTTP `302` |
| Deployment state | The executed Alpha has a protected Preview `READY`; automation-bypass count and configured future-Preview environment-variable count were restored to zero after proof; no Production deployment or authority was created |

The inherited `PASS WITH WORKAROUND` is the Ubuntu Proot Codex sandbox limitation documented in [`docs/engineering/environment-and-safety.md`](docs/engineering/environment-and-safety.md). It is not a persistence failure and is not a requirement on other devices.

## Open mandatory gates

- `PG-TLS-SEMANTICS-01` — **ACTIVE**. Blocks `pg` 9, `pg-connection-string` 3, or an equivalent TLS-semantics change until certificate and hostname verification are re-proven. It does not block the pinned B3 foundation.

Do not infer changes to `PG-TLS-SEMANTICS-01` from a newer version, provider
dashboard message, or prior chat. Its status changes require committed evidence and
an observed successful `main` CI run.

## Open non-blocking maintenance observations

- `CIRCLE-DNS-INTEGRITY-01` — **ACTIVE / ENVIRONMENT-SCOPED / NON-BLOCKING**.
  The local mobile-network resolver returned a non-Circle certificate for
  `api.circle.com`; TLS failed closed. Checkpoint C used a current DNSSEC-valid
  answer, independently verified the Circle hostname/certificate, applied a
  temporary single-host mapping, and removed it after provider reconciliation.
  Future operators must follow
  [`environment-and-safety.md`](docs/engineering/environment-and-safety.md); never
  persist an edge IP or weaken TLS.

- `GHA-ACTIONS-RUNTIME-01` — **ACTIVE / NON-BLOCKING**. Accepted-main authority
  migration run `32949201003` passed, but GitHub still warned that
  `actions/checkout@v4` and
  `actions/setup-node@v4` target deprecated Node.js 20 internally and were forced
  to run on Node.js 24. This does not change the repository's Node.js 22
  application/runtime contract and did not fail verification. Before changing the workflow,
  review current primary GitHub Actions guidance and verify a focused CI update;
  do not mix that maintenance into product realization.

- `CIRCLE-DNS-ANDROID-01` — **ACTIVE / ENVIRONMENT-SCOPED / NON-BLOCKING**.
  The current ISP resolver intercepted `api.circle.com` as
  `internetpositif.ioh.co.id`, causing correct TLS hostname verification to stop
  Circle calls. DNSSEC-valid DNS-over-HTTPS returned Circle's Cloudflare
  addresses and TLS verification then passed. A temporary exact host pin was used
  only for the observed private-testnet operations and removed afterward. Never
  disable TLS verification; prefer a trusted Private DNS/VPN or another clean
  network before subsequent provider operations.

## Durable continuity rules

1. GitHub `main`, committed specifications, migrations, tests, CI evidence, and explicit gate records are the engineering continuity source.
2. [`docs/architecture/inomasa-concept-and-architecture-v1.0.md`](docs/architecture/inomasa-concept-and-architecture-v1.0.md) is the active product and system-architecture authority.
3. [`docs/engineering/inomasa-alpha-implementation-and-testnet-realization-v1.0.md`](docs/engineering/inomasa-alpha-implementation-and-testnet-realization-v1.0.md) is the active Alpha implementation guide and cannot silently amend the Concept & Architecture contract.
4. Devices are replaceable development clients. Android + Termux + Ubuntu Proot is proven, not architecturally required.
5. Operators and AI tools are replaceable. Codex, OpenCode, ChatGPT, another AI, or a human engineer receives no authority from chat history or tool identity.
6. PostgreSQL semantics and the internal persistence boundary are durable; Neon is the provider used for B3 hosted proof, not an application boundary.
7. Credentials and recovery material are supplied through authorized channels outside Git. Never commit or paste them into documentation, issues, CI logs, or chat.
8. After every significant checkpoint decision or accepted merge, update this file
   in the same change whenever practical. Record the latest completed checkpoint,
   evidence, open holds, and exact next execution point. A future operator must not
   need historical chat to discover state.

## Invariant destination, adaptable execution route

The engineering destination is set by the two active authority documents, accepted
state and next checkpoint in this file, repository safety rules, acceptance
criteria, and required verification evidence. An execution route is adaptable: it
is a scoped profile selected for the actual device, operating system, operator, AI
tool, and infrastructure capabilities in front of the operator.

- Select the safest, least-privilege route that can satisfy the same gate in the actual environment.
- Commands, tools, sequencing, and provider administration may differ between profiles, but the route must not weaken constraints, acceptance criteria, or required evidence.
- Treat Android/Ubuntu Proot procedures and workarounds as scoped to that proven profile. Do not copy them to a capable Linux laptop, Windows/macOS environment, another AI tool, or a human workflow unless their actual constraints justify it.
- Equivalent evidence must demonstrate the same acceptance criteria even when the route differs.
- Never claim an environment or operator route is `VERIFIED` by analogy with another route.

This repository is the navigation and handoff system: it preserves the destination, current state, constraints, blockers, acceptance criteria, known profiles, and evidence. The next competent operator chooses the route; the repository determines what must remain true and what proof must be produced.

Environment/profile statuses mean:

- `VERIFIED` — the stated profile and scope actually passed the required checks, with observed evidence.
- `SUPPORTED/TARGET` — expected to be viable, but the relevant clean bootstrap and verification have not yet been fully observed.
- `UNSUPPORTED/BLOCKED` — known not to satisfy current requirements, or blocked until a documented constraint is resolved or a safe workaround is proven.

Statuses are scoped. Passing CI does not verify a local workstation, and verifying one tool on one operating system does not verify another route.

## Supported takeover environments

| Environment | Status | Notes |
| --- | --- | --- |
| Android + Termux + Ubuntu ARM64 Proot | `VERIFIED` for B0 and the recorded local scope | Node 22/NVM/npm work; Codex uses the recorded supervised profile because its normal sandbox is `UNSUPPORTED/BLOCKED` in this environment. |
| GitHub-hosted Ubuntu runner | `VERIFIED` for CI scope | Node 22, clean install, engineering checks, and ephemeral PostgreSQL proof passed. This does not verify an interactive workstation. |
| Laptop/PC with a suitable Linux environment, WSL, or macOS | `SUPPORTED/TARGET` | Use the safest route available there and pass the clean-clone procedure before claiming local readiness. No device-specific repository state is required. |

Native Windows outside WSL is `SUPPORTED/TARGET`, not `VERIFIED`. It requires an environment-appropriate clean bootstrap route and observed evidence; evaluating that route does not change the architecture.

## Clean-clone takeover

Prerequisites are authorized GitHub access, Git, NVM, and a platform capable of running Node.js 22 and npm. Start without database or provider credentials:

```bash
git clone https://github.com/0xinomasa/inomasa-project.git
cd inomasa-project
git switch main
git pull --ff-only
git status --short
cat PROJECT_STATE.md
cat AGENTS.md
nvm install
nvm use
node --version
npm --version
npm ci
npm audit
npm run verify
git diff --check
git status --short
```

Expected baseline: Node `22.x`, a clean dependency install, no unexplained audit finding, lint/typecheck/tests/production build passing, no whitespace errors, and an unchanged worktree. Before accepting work, inspect the latest `main` GitHub Actions run and every open gate above.

Database work additionally requires separately authorized credentials for an isolated non-production PostgreSQL database:

```bash
umask 077
cp .env.example .env.local
chmod 600 .env.local
# Supply authorized values locally without printing them.
npm run db:verify
```

The expected proof is successful connection, migration observation, parameterized write/read verification, and transaction rollback verification. Never point this proof at production.

## Current external service inventory

| Service/provider | Current role | Architectural status | Credential handling / replacement |
| --- | --- | --- | --- |
| GitHub | Private source repository and Actions CI | Engineering continuity source, not product architecture | Authorized account access outside Git; replacement hosting requires an explicit continuity migration. |
| npm registry | Locked Node dependency retrieval | Package distribution only | `package-lock.json` is authoritative; do not change dependencies merely to work around a transient outage. |
| Standards-compatible PostgreSQL | Shared persistence technology | Required persistence contract behind the internal boundary | Generic `DATABASE_URL` / `DATABASE_DIRECT_URL`, supplied outside Git. |
| Neon | Dedicated hosted development database used for B3 proof | Current provider only; no Neon API in application/domain code | If unavailable, provision an authorized compatible PostgreSQL database and replay migrations plus `db:verify`. |
| Next.js `16.3.3` | Controlled-Alpha application runtime used by the protected Preview | Patched Active LTS engineering framework, subordinate to active Inomasa product architecture | The 2026-08-25 security maintenance changed only the pinned Next.js package family and lockfile metadata; future security concerns require new current evidence. |
| Arc Testnet | Required Alpha chain and current real-execution target | Exact chain/asset registry and the first real USDC settlement are verified | Chain ID `5042002`; testnet identifiers and facts must never be reused as mainnet authority. |
| Circle Developer-Controlled Wallets | Selected and verified Alpha EOA Treasury execution adapter | Two platform-controlled external account bindings are active behind an Inomasa port; neither is identity, user custody, or Protected Treasury | API key, registered entity secret, and wallet-set ID stay outside Git; User-Controlled EOA remains the user-custody/exit reference path. |
| Circle Gateway / Nanopayments | Selected and verified Alpha x402 v2 `exact` rail | One-time EOA deposit, Circle Signing API, public Gateway facilitator, and provider-reported receipts sit behind Inomasa x402 and persistence ports | No private key is introduced; exact payloads are persisted before facilitator handoff. The EOA deposit and seven-day minimum signature validity are explicit operational/security tradeoffs; generic x402 data remains portable while the Gateway adapter is replaceable. |
| Vercel | Deployment provider; project `inomasa` hosts the protected Alpha Preview | Provider implementation only, not an architecture boundary | Framework Preset `Next.js`, Node `22.x`, Vercel Authentication on all Previews, Git Fork Protection enabled, no Preview environment variables, and no remaining automation bypass after proof. `inomasa.vercel.app` remains intentionally unaliased because the current plan cannot protect production domains. See [`docs/engineering/deployment-foundation.md`](docs/engineering/deployment-foundation.md). |
| Codex / OpenCode / ChatGPT | Optional engineering operators | Replaceable tools, never authority or state storage | Local/provider credentials remain outside Git; all tools follow `AGENTS.md`. |

The repository now contains generic Business, Agent, commerce, Economic History,
and provider-driven Capital systems; chain-verified Arc Testnet ERC-8004 and
ERC-8183 paths; Circle Developer-Controlled EOA and Gateway x402 adapters; and
identity-bound economic activity. Private-testnet state has three common-control
Businesses, two Ops Pilot Agents, two Capital Providers, six settled commerce
obligations totaling `0.520000` USDC, one exact `0.200000` Capital allocation,
thirteen economic entries, fourteen narrow Evidence facts, and six complete
service deliveries. Gateway reports two exact `0.010000` x402 receipts; the funded
ERC-8183 job and all direct commerce/Capital transfers retain their scoped Arc
proof. No credential is committed, and no hosted Agent, Agent wallet custody, LLM
authority, independent demand, Production Capital, Production database, or
Production deployment exists.

## Recovery and takeover rules

- **Current device unavailable:** use another suitable workstation, clone `main`, and complete the clean-clone takeover. Do not copy an old working directory as the new source of truth.
- **ChatGPT or an AI tool unavailable:** a human or alternative AI reads this file, `AGENTS.md`, source hierarchy, safety documentation, Git history, and CI. No conversation reconstruction is required.
- **Codex unavailable or unsafe:** use OpenCode or a human workflow. On Ubuntu Proot, retain the B0 limitation; elsewhere use the least-privilege supported mode.
- **PostgreSQL provider unavailable:** do not redesign application code. Provision an authorized standards-compatible PostgreSQL development database, set generic local variables, replay versioned migrations, and run `npm run db:verify`.
- **GitHub temporarily unavailable:** preserve the last verified clone and work offline only when safe. Do not declare a merge/gate accepted until the authoritative origin and `main` CI are available again.
- **CI unavailable:** local evidence may diagnose work, but cannot replace the required observed `main` CI evidence for an accepted gate.
- **Active authority document missing or unreadable:** continue only mechanical,
  non-semantic diagnosis. Restore the accepted repository copy from Git history
  before structural, domain, authority, or product work.
- **Credential loss or suspected compromise:** do not record recovery material here. Stop affected access, use the provider/account recovery process, rotate credentials, and re-run the relevant verification before resuming.

## Exact next step

Complete **REV2 Checkpoint H — Integrated Verification acceptance** from the
implemented and locally proven working-branch candidate. Create and inspect a
protected Preview without Production exposure, then complete
PR CI/review/merge, accepted-main CI, and Continuity Closeout before changing the
Alpha completion label.

Do not treat accepted G composition or local evidence as H acceptance, and do not
expand beyond Checkpoint H to Production/mainnet, public anonymous access, live
MIGRATE, unrestricted Agent authority, or Production/public Capital exposure.
Follow the active [Alpha
Realization guide](docs/engineering/inomasa-alpha-implementation-and-testnet-realization-v1.0.md).
