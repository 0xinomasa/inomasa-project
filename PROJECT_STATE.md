# Inomasa project state and takeover

This file is the concise repository-native entry point for a human or AI operator taking over Inomasa engineering. It records current mutable state separately from durable operating rules. Chat history is context only and is never required engineering evidence.

## P3 Work checkpoint — local verification 2026-09-20; published 2026-09-21

- Publication: [draft PR #52](https://github.com/0xinomasa/inomasa-project/pull/52),
  implementation commit `ec2e2327133ddf508490da7c223bfdeeb7da50b7`; remote tree
  matches the staged local tree exactly. No main merge. GitHub had not created
  a verification run for this head at the last check; native PostgreSQL remains
  pending, not passed. Vercel reports `live: false`, latest deployment BLOCKED.
- Branch/worktree: `codex/p3-work-account-wallet`, `inomasa-p3-work`; base
  `963281f1a23cc989dadc4ec27d0340cc44acd3fd`, confirmed unchanged on GitHub.
  P2 remains accepted. Owner authorized P3 here after the phone PostgreSQL freeze.
- Sources: owner-uploaded `Inomasa_Product_Realignment_Map(2).md` is the active
  roadmap's P2-accepted snapshot, plus P1 correction §§8.1–8.2, final consolidation
  and final visual pages 5–6. It is not a new roadmap. Phone mounts/state are not
  assumed accessible. The older +411/-14 continuity is deliberately not imported.
- Implemented first slice: explicitly selected LOCAL_DEVELOPMENT email entry,
  isolated opaque server session, `/account` P1-oriented desktop/mobile layout,
  expiry/logout/revocation, and additive migration 017. Unverified email grants
  no Account, legacy principal or Business rights. The retained legacy login is
  compatibility only; its continued availability is not proof of safe cutover.
- Account persistence includes challenge-bound, app/environment-scoped identity
  completion, token rotation and durable identity uniqueness. Its verifier is a
  server-only interface tested with synthetic identities, not a Circle adapter.
  There is no HTTP endpoint accepting a claimed provider identity as proof.
  Wallet connection is honestly unavailable; BUILD is disabled on the new page.
- Database isolation: fresh empty on-disk PGlite 0.5.8 database, loopback listener,
  explicit synthetic URLs and no copied private configuration. Migrations 001–017
  and `db:verify` passed after enabling the harness's connection multiplexer.
  Initial cross-process connection attempt was isolated by Work networking;
  subsequent default single-connection harness rejected overlapping connections.
  Fixes affect the external test harness only. This is PostgreSQL-compatible
  proof, not native PostgreSQL concurrency/isolation certification.
- Checks observed: lint, typecheck, 101 tests, optimized build and complete
  compatible database proof passed. Account proof covers same-email isolation,
  provider failure/wrong app, rotation, replay, logout during verification,
  expiry, same-identity recovery/concurrency and persistence across reconnection.
  Native PostgreSQL CI, live Circle authentication/recovery, legacy binding and
  owner usability acceptance remain open. Browser verification passed at 1360×1000 and 390×844: email entry, reload,
  logout/server revocation, fresh-context redirect, legacy-access availability,
  legacy API denial for new cookies and cross-origin rejection. No page errors
  or mobile horizontal overflow; screenshots visually reviewed. The truncated
  cached Chromium executable was re-extracted from its existing archive and its
  font paths corrected in the external harness. No application workaround.
- No old database, phone file, wallet, funding, allowance or provider configuration
  was changed. P0 NOT SUBMITTED remains accepted historical evidence.

## Current mutable state

| Item | State and evidence scope |
| --- | --- |
| Source repository | Private `0xinomasa/inomasa-project` |
| Accepted branch | `main` |
| Active product/architecture authority | Owner-accepted P1 Product & Experience Baseline and Final Visual Design Package, with the latest explicit roadmap corrections. Concept & Architecture v1.0 retains unaffected contracts. Exact sources and precedence: [source hierarchy](docs/engineering/source-hierarchy.md). |
| Active Alpha implementation guide | [`Inomasa Alpha Implementation & Testnet Realization v1.0 — REV2`](docs/engineering/inomasa-alpha-implementation-and-testnet-realization-v1.0.md): `ACCEPTED / ACTIVE` |
| Post-H Product Realization authority | [Post-H Product Realization Record](docs/engineering/post-h-product-realization.md) retains applicable semantics and dated A–H/Work 1–5 evidence; its former sequence and superseded experience choices no longer direct current work. See the source hierarchy's explicit corrections. |
| Historical architecture status | Inomasa Canonical Architecture v1.0 is `SUPERSEDED / HISTORICAL`; it and B0-B5-era planning remain lineage, not current authority |
| Active realization program | **P0 COMPLETE / P1 ACCEPTED / P2 COMPLETE — OWNER ACCEPTED / P3 IN PROGRESS / P4–P9 NOT STARTED.** The canonical `Inomasa_Product_Realignment_Map.md` governs realignment. Existing A–H kernel and accepted/merged Work 1–5 remain the engineering baseline; draft #49–#51 are distinct from accepted main. |
| REV2 completion status | **VERIFIED CONTROLLED ARC TESTNET ECONOMIC/SYSTEM KERNEL** within the exact controlled Arc Testnet scope and A–H evidence below; Human-Operable Business Product Alpha remains **NOT YET VERIFIED** |
| Standing execution authorization | Owner authorized P3 implementation in ChatGPT Work from published P2 and uploaded sources, without opening Termux or retrieving interrupted phone work. Isolated code/tests/local application are in scope; live provider spending/provisioning, old transactions, deployment and main merge retain separate gates. |
| Historical step-3 implementation/preparation checkpoint | **Step 3 is implemented and independently verified in draft PR #51, `codex/work-economic-requirements`, stacked on unmerged #50 and #49.** Code head `60d2bfff5de622ae22687edb2a693a0e0c912e7a` passed native PostgreSQL CI `34243042485` and twelve isolated browser checks. Live work-linked Arc payment and Android owner acceptance remain open. Preserve phone evidence and inspect actual state before integration or any transaction. |
| Current execution status | P2 COMPLETE / OWNER ACCEPTED; P3 IN PROGRESS. Local email entry and Account persistence foundation implemented; live Circle, wallet provisioning/recovery and legacy Business binding remain unimplemented/unverified. |
| Next phase gate | Continue P3 as described below; P4 requires ready Personal Wallet and P3 acceptance. P3 itself is already authorized. |
| P0 financial action result | Old allowance **NOT SUBMITTED**, with no pending transaction for that action, based on accepted P0. No reopening of old approval, funding or purchase plans. |
| Current browser capability | **VERIFIED — ENVIRONMENT-SCOPED**. On 2026-08-28, Ubuntu ARM64 (`aarch64`) launched headless Chromium through `/usr/local/bin/playwright-proot` wrapper version `0.1.18`; a local `data:` page opened, snapshot/evaluation completed with `readyState: complete`, and the session closed. The accepted E/F/G/H local application-browser proofs, protected H Preview evidence, and Work 1 owner/browser evidence are recorded separately; this capability fact alone does not prove final integrated Human Product Alpha readiness |
| Work 1 acceptance evidence | Pull request `#40`; implementation head `b4e006e2114df3a045acc615b6b11f6a00355b5f`; merge commit `27b30747c4a2fd14b1b29a1ee221fb99c893bd1a`; Engineering verification run `33279953605` completed successfully. Local verification recorded lint, typecheck, production build, 64/64 tests, auth/session, tenant/controller isolation, replay/idempotency, MIGRATE locked behavior, Live Economy semantics, and client-secret boundary PASS. |
| Work 1 product acceptance evidence | Owner-observed invited login, four-template BUILD entry, Business creation/persistence, My Businesses/Workspace entry, and two-way second-user tenant isolation. The corrected protected Preview was deployment `dpl_6BoHhm2v6WGQp7C1dkcLd6Cb5rV9` from exact Work 1 head `b4e006e2114df3a045acc615b6b11f6a00355b5f`; deferred non-blocking UX findings are retained in the Post-H Product Realization record. |
| Work 2 acceptance evidence | Pull request `#42`; implementation head `66dfffd8c8ad21dc0fcc4c9e74d8e7dc53e76e91`; merge commit `9fc197895a2db49398620d7355cbb7d79f549364`; PR Engineering verification run `33289735811` and accepted-main run `33303102348` completed successfully. Local verification recorded lint, typecheck, production build, 68/68 tests, migration `012`, PostgreSQL persistence/rollback, auth and tenant isolation, replay/idempotency, client-secret boundary, and A–H regression PASS. |
| Work 2 product acceptance evidence | A controller operated Product/Service drafts, bounded Agents, Treasury provisioning, and funding-state refresh through the Business Workspace. Exact replay retained one Product/Service and one Agent; a second controller received fail-closed `404` responses for page and mutation access; desktop and 390×844 mobile browser checks had no horizontal overflow or bottom navigation. A Circle Developer-Controlled Arc Testnet EOA was provisioned through the product UI at `0x13945cf5e1821e1db2032458c01cf2661763daea`; exact `0.010000` setup funding was chain-verified in transaction `0x82c61bdf88c1bf0d9e54a753285830278d1666be0a8465d16c6dca6fcdbfd868`, block `59580511`, and the UI reported `FUNDED`. This remains `OPERATIONAL_TEST_SETUP / COMMON_CONTROL_TEST`, not Revenue, Capital, commerce, custody, or Production evidence. |
| Work 3 acceptance evidence | Pull request `#44`; implementation commits `9da67ac16ea33b50271555726949e12f4730e4f5` and `43faec172ec23990a6762f054f43e77003be0e17`; merge commit `72318b4b99385af431d529c22a5f518733bb719b`; final PR Engineering verification run `33337590302` and accepted-main run `33337675145` completed successfully. Local verification recorded lint, typecheck, production build, 75/75 tests, migration `013`, isolated fresh-database-compatible PostgreSQL persistence/application/replay/tenant proof, client-secret boundary, provider timeouts, product proof, and A–H regression PASS. The superseded PR run `33337010157` correctly failed because the first persistence proof depended on pre-existing A–H rows; the final proof creates and removes an isolated canonical fixture instead of weakening CI or seeding hidden state. |
| Work 3 product acceptance evidence | Through the tenant-scoped Business Workspace, a controller confirmed canonical x402 request `ecde08a8-9e42-40bb-9b8b-6df56678f203` for exact `0.010000` USDC with Gateway provider receipt `a97aedd7-33bf-4950-98f3-26b2be9fc99a`, and canonical ERC-8183 request `c541899c-3a67-4d08-8375-b39b503ede11` for exact `0.050000` USDC, protocol job `182405`, six verified Arc lifecycle receipts, and payout transaction `0x0d1018b1c9f782738e622bd0856a69918b4fdc7cd1dfab0b37975cec3df70f57`. Failed pre-settlement request `c27ba734-cf8b-4823-b6de-161c45e92c69` remained visibly failed with no settlement attempt, Revenue, economic entries, or delivery. Exact replay retained one request; hidden offers and invalid/cross-tenant/unauthenticated mutations failed closed. Desktop and 390×844 production-local browser verification reported zero console errors/warnings, no horizontal overflow, and no bottom navigation. Exact `0.100000` setup funding transaction `0x77a3d0dcede1101d7f0f1be4bfece708eea5596845ae8f5628072b62de5cfdc3` remains `OPERATIONAL_TEST_SETUP / COMMON_CONTROL_TEST`, not commerce, Revenue, Capital, custody, or Production evidence. |
| Work 4 acceptance evidence | Pull request `#46`; implementation commits `624a345b1cc548463015044893b6e86663911520` and `251e999d7353d2a64dcd7e7e7568a3dedac76f42`; merge commit `b7879be06d70b299c43ba6eef7c62483c1cf2a31`; final PR Engineering verification run `33353646282` and accepted-main run `33353765607` completed successfully. Local verification recorded `npm run verify`, 75/75 tests, current migrations through `013`, self-cleaning PostgreSQL Capital context/tenant/acceptance/replay proof, Work 3 exact product proof, client-secret boundary, full A–H regression, and `git diff --check` PASS. Superseded PR run `33353319394` correctly failed strict lint on redundant initial proof assignments; commit `251e999` removed the assignments without weakening the rule or proof. |
| Work 4 product acceptance evidence | Authenticated `/capital` and Business Workspace Capital projections now read only provider decisions for Businesses under the active controller. Provider/risk-bearer attribution, mandate, declined versus approved outcome, controlled allocation state, dedicated platform-controlled execution-account meaning, exact terms, Arc proof, and bounded later-use linkage remain inspectable while Capital stays separate from Revenue and universal scoring. An offered allocation can be explicitly accepted only by the active Business controller; the action is replay-safe and changes only the accepted kernel state to `AUTHORIZED`, without submitting a provider transfer. The self-cleaning database fixture proved this action, cross-Business rejection, controller isolation, replay, and cleanup. Two accepted controller fixtures saw only Ops Pilot or Reference Workbench respectively; cross-tenant Workspace access returned `404`. Desktop `1440×900` and Android `390×844` browser checks reported no app error overlay, horizontal overflow, or bottom navigation. No live provider allocation, Production/public Capital exposure, Vercel change, or deployment occurred. |
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
| Current continuity checkpoint | Accepted main `ca1e9178abca916289ac11229163be11e2f2a951` includes Work 5 #48. Corrective branch `codex/work-5-closeout-corrective-pass` ends at `175498bb1fa740cc88ba6cbfe9ab4620792197b9`; its work is preserved as the parent of `codex/local-arc-proof`. |
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
| Checkpoint H accepted implementation | **VERIFIED / PASS within Checkpoint H scope**. An executable C-H replay plus integrated proof matrix covers the exact accepted proof database; adversarial regressions add not-yet-valid/environment-mismatched authority, no blind resubmission from an ambiguous settlement, and Capital acceptance replay rejection. Normal `npm run verify` checks that private database/Circle/Vercel environment-variable names do not reach browser artifacts. No schema, dependency, contract, provider execution, or product semantic changed |
| Checkpoint H local/private-testnet evidence | One uninterrupted `npm run alpha:checkpoint-h:proof` passed C, D, E, F, G, and the integrated H matrix: seven Businesses, six Agents, four Capital Providers, eleven complete Activities, exact commerce `0.680000` USDC, separate Capital `0.400000` USDC, twenty economic entries, twenty-two Evidence facts, and nine deliveries, all `COMMON_CONTROL_TEST`. C historical receipt replay used Arc's currently documented public dRPC endpoint because the primary public RPC returned null for that old receipt. Audit zero vulnerabilities, lint, typecheck, 56/56 tests, build, client-artifact safety, migrations `001`-`011`, database write/read/rollback, local production browser, and both x402 HTTP flows passed |
| Checkpoint H protected Preview evidence | Vercel deployment `dpl_BvBVwj2WrzD2jm57bit3i8BP8X7w` is `READY` from H commit `d4d5bc7c3a486b5e9a68e16be0de2e5c3e43e359` in `iad1`. Authenticated inspection rendered Home, Founder/System, Reference Workbench, its ERC-8004 Agent, and Capital with the exact integrated state; anonymous `/system` returned HTTP `302` to Vercel SSO without the application shell. No 5xx request was observed. Vercel reported the temporary Preview environment set removed, automation bypass count zero, and Standard Protection still covering all Previews. Runtime logs retained only the known `pg` TLS-semantics warning governed by `PG-TLS-SEMANTICS-01`; it was not a request failure and does not authorize a dependency/TLS change |
| Checkpoint H acceptance evidence | Pull request `#36`; implementation commit `d4d5bc7c3a486b5e9a68e16be0de2e5c3e43e359`; final head `bffad0eda4fcb1d9a11170e697345c3bf2e06e7d`; focused review recorded PASS; final PR verification run `33206484542`; merge commit `fcb80e96966f95a8c49cbf105f932c378910b39e`; and accepted-main run `33206624023` completed successfully, including engineering checks and PostgreSQL migration/persistence proof |
| Authority migration local evidence | npm audit (0 vulnerabilities), lint, typecheck, 28/28 tests, Next.js `16.3.3` production build, migrations `001`-`006` already current, database write/read/rollback, local Markdown-link audit, and `git diff --check` passed; no product/provider/database behavior changed |
| Authority migration acceptance evidence | Pull request `#19`; implementation commit `751bd4c4d5e75b7a6fc8087c99034ae05089cf4e`; final PR head `218cdd273e9b6d291703e930aada1e4b768f2057`; final PR verification run `32949059522`; merge commit `d3cba7871204ba91a20094ce4353db0a650933b9`; and accepted-main run `32949201003` completed successfully, including clean PostgreSQL reconstruction/proof |
| B4 local pre-deployment evidence | Node `22.23.2`, npm `10.9.8`; clean install and audit (0 vulnerabilities), lint, typecheck, 6/6 tests, production build, and production-server HTTP `200` with expected Inomasa shell anchors |
| Product implementation boundary | The accepted kernel and Work 1–4 slices remain intact; Work 5 implementation is merged. The local continuation adds bounded AI proposals, operator-configured existing-business context, and external JSON delivery behind the existing paid-service authorization. No second ledger, schema migration, wallet model, or hosted service is added. |
| Verified private-testnet state | All accepted fixtures remain synthetic/common-control: Signal Forge, Ops Pilot, Checkpoint B API Proof, the four Reference Economy Businesses, the Work 2 Provider Lab, seven Agents, and four Capital Providers. The accepted A–H regression projection remains nine exact settled commerce obligations totaling `0.680000` USDC, two exact Capital allocations totaling `0.400000`, twenty economic entries, twenty-two narrow Evidence facts, and nine complete service executions; Work 3 product-operation evidence is recorded separately above and is not silently folded into those kernel counts. Checkpoint B API Proof still has only a `PENDING` logical Treasury and no economic activity; none of this proves independent demand, Production Capital, or real investment performance |
| Repository continuity marker | `src/index.ts` `repositoryBaseline` is intentionally retained as a machine-readable descriptive marker maintained since B1. It is subordinate to the active authority documents and `PROJECT_STATE.md`, and it grants no runtime or product authority |
| Historical pre-P0/P1 journey evidence and holds | New live AI generation, real configured-source paid delivery, actual Arc proof attributable to the new journey, and final Android/owner acceptance remain open. Historical A–H receipts are not evidence that the new integrations ran. Native PostgreSQL CI and current source/build evidence must accompany review. Hosted proof is deferred by owner instruction; `PG-TLS-SEMANTICS-01` retains its original scoped meaning. |
| Baseline fixture/product-label status | Signal Forge, Ops Pilot, both accepted buyer Agents, all four Reference Economy Businesses, and all four Capital Providers remain controlled proof fixtures. Their rendered commerce/Capital state is not generic product capacity, independent demand or underwriting, public availability, or active roadmap authority |
| Next.js security baseline | Next.js `16.3.3` is the selected patched Active LTS runtime following the [official 2026-08-25 security release](https://nextjs.org/blog/august-2026-security-release); pull request `#18`, merge `97608da2755bde50e900f71d5c94db9c931a7685`, and accepted-main run `32945917201` passed without product or database changes |
| First deployment evidence | Vercel deployment `dpl_HLPGUzp74Z1Yt3DunwgXvLVMddAt` from `48a980411f409f86f9e69fdf0b8e9a2119d17eac`, incorrectly targeted Production, ended `ERROR` (`STATIC_BUILD_NO_OUT_DIR`) |
| B4 protected Preview evidence | Vercel deployment `dpl_az1jRshRMZYn57RbFxsvkozLJZ2k` from accepted `main` commit `d75bcd5472f35f0cc962c6a420473957915153f6`; target `preview`, state `READY` |
| Deployment protection evidence | Anonymous request redirected to Vercel SSO without the shell; authorized request rendered expected shell anchors; temporary automation bypass removed and Vercel Authentication remained enabled |
| Alpha protected Preview evidence | Deployment `dpl_6XgtJVdU9uQPUb3jMz7g7UnodGKZ`; target Preview, state `READY`, protected render displayed both Businesses, exact amount, tx hash, `COMPLETE`, `REVENUE`, and `SERVICE_COST`; anonymous access remained HTTP `302` to Vercel SSO |
| Agent Alpha protected Preview evidence | Deployment `dpl_6rJLRfDT5SVXs35vbnDpEWLkkcK6`, target Preview, state `READY`; protected render displayed the Agent, scoped offer, `0.100000 / 0.200000 USDC` allowance, second settlement, and `COMPLETE`; anonymous access remained HTTP `302`; future-Preview env count and automation-bypass count were restored to zero |
| x402 Alpha protected Preview evidence | Deployment `dpl_2QPTA8bHtcK8BSzbw6PhzSN132Nu`, target Preview, state `READY`; protected render displayed Gateway x402, exact `0.010000 USDC`, receipt, and `COMPLETE`; protected endpoint returned HTTP `402` plus `PAYMENT-REQUIRED`, then HTTP `200` plus `PAYMENT-RESPONSE` for the committed paid payload; anonymous access remained HTTP `302` |
| Work 1 protected Preview evidence | Deployment `dpl_6BoHhm2v6WGQp7C1dkcLd6Cb5rV9`; target Preview, state `READY`; source commit `b4e006e2114df3a045acc615b6b11f6a00355b5f`; existing Vercel project `inomasa`; owner review and automated runtime verification were performed against the protected artifact. |
| Deployment state | Work 1 merge commit `27b30747c4a2fd14b1b29a1ee221fb99c893bd1a` unintentionally triggered Production deployment `dpl_8Uwgxnw5bNSCgrY3Spa868RUnDgp` through the then-active Git integration. This was not authorized Production scope. The Vercel project was paused and the Production domain was directly verified to return HTTP `503 DEPLOYMENT_PAUSED`; the project-level GitHub repository connection was then removed. Existing protected Preview artifacts remain available. No `vercel.json`, Production resume, database change, or secret change was introduced by containment. |

The inherited `PASS WITH WORKAROUND` is the Ubuntu Proot Codex sandbox limitation documented in [`docs/engineering/environment-and-safety.md`](docs/engineering/environment-and-safety.md). It is not a persistence failure and is not a requirement on other devices.

## P2 local access and readiness revision — 2026-09-13

**ACTIVE OWNER DECISION:** localhost Alpha entry accepts typed email without
invitations, an email allowlist or application-entry OTP. This replaces the
invited-entry target for the local profile only. Existing application code still
uses invitations and derives a principal from email; removing only the invitation
check would expose existing Business control and is not an acceptable realization.

P0 COMPLETE, P1 ACCEPTED, P2 COMPLETE — OWNER ACCEPTED, and P3–P9 NOT STARTED.
The six-system/P1 design is retained. This record updates readiness planning,
not implementation. Finalization incorporates the owner's 2026-09-13 corrections
into the single canonical Second Brain roadmap at
`/mnt/second-brain/Project/inomasa-project/Product Baseline/Inomasa_Product_Realignment_Map.md`
(metadata, §§2/3/5 and §9) under explicit permission, and checks consistency with
these six repository documents.
Earlier replacement-text proposals are now applied, not a second roadmap.
Project Instructions, P1, PDFs, History and the extraction manifest are untouched.
All 17 files remaining in the former nested P2 package were relocated into the
single `Product Baseline/` directory with their relative paths, sizes and SHA-256
checksums unchanged. The empty `P2 Baseline/` parent was then removed. This path
change gives the accepted product sources a stage-neutral home through P9 and
beyond; it does not rename documents, alter product decisions, or make the
manifest a live folder index.

### P3 proposal: durable Account, one contextual authentication flow

Owner refinement: an established Account must survive session changes. Temporary
entry context is not a newly created durable Account on every visit. The technical
mechanisms below are accepted as the P3 readiness plan; implementation and
provider verification remain outstanding.

1. Typed email opens an unverified local entry context without invitation,
   allowlist or application-entry OTP. Use an opaque session identity independent
   of email. Two fresh browsers entering the same email receive no shared rights;
   no legacy Business names, balances, Work or wallet IDs are disclosed.
2. Keep a durable internal Account ID and server-side binding from validated
   Circle user identity, scoped by provider application/environment, to that
   Account and its existing controller relationships. Session IDs are replaceable
   access credentials, never Account IDs. Email is a contact/display attribute,
   not authority. After authentication, resolve the existing binding first;
   create a new Account only when no binding exists, with concurrency protection.
3. Offer one contextual “Continue to your account” action for setup or recovery,
   with the already entered email prefilled and editable before authentication.
   The proposed Circle UCW email OTP authenticates durable Account/wallet access;
   it is not an OTP gate on application entry. Explain that protected existing
   data cannot be restored by typing email alone. Reuse valid authenticated
   application/provider sessions within their actual scopes; do not demand
   email or OTP again on every navigation or force a second independent login.
   Retain any provider-required wallet initialization/signing approval.
4. Validate the provider session on the server, bound to the initiating local
   session/challenge. Never trust browser email, IDs or success flags as proof.
   Resolve the bound wallet before provisioning. Persist one provisioning request
   and reconcile unknown outcomes before retry; provider failure must not create
   a replacement Account/wallet. A zero-balance ready wallet needs no funding.
5. Preserve Account, wallet binding and Business ownership across browser close,
   logout, cookie loss and device change. A valid session resumes directly; after
   proof is lost, the same verified identity restores the same Account and wallet.
   Logout invalidates application access and clears provider session material/
   private caches, not persistent bindings or data. Expired wallet credentials
   may require contextual reauthentication without replacing a still-valid
   application Account. Unbound temporary drafts are explicitly temporary and
   cannot be recovered by email; never describe them as a durable Account.
6. Legacy continuity is a prerequisite for replacing old access, not a promise
   to migrate every old account in the first experiment. Retain the existing
   legacy access path until the owner's existing principal has a proven
   return/recovery path. Retention is not proof that this path is safe or
   recoverable; both the relevant access checks and return path remain to prove.
   This is a compatibility route, not an invitation
   requirement on normal email-only local entry. A retained cookie alone is
   insufficient because it expires. Before cutover, demonstrate fresh-session
   access using valid legacy control proof, or an explicitly authorized binding
   of that exact principal to the verified destination identity with attribution.
   Newly verifying a matching legacy email is insufficient. If legacy access
   cannot be re-established, keep the old path unchanged and stop cutover pending
   scoped owner-assisted recovery; do not invent credentials or silently rekey.
   Associate the existing principal, not copied Businesses or merged accounts.
   Broad migration tooling and unrelated legacy accounts can wait.
7. Load Business choices from server-checked control relationships of the
   recovered Account. Preserve deep-link/mutation checks and the Business of
   pending decisions when switching. Personal Wallet recovery does not migrate
   old DCW Treasury bindings or grant spending authority. Keep economic records,
   old principal IDs and controller provenance intact.

This local convenience profile is restricted to a deliberately selected isolated
localhost execution profile, not a hostname string trusted from the browser or
an automatic relaxation of PRIVATE_ARC_TESTNET controls. P3 must verify loopback
serving and server request/session boundaries before sensitive access. It is not
a public deployment model or evidence of independent controllers/demand at P6.

### Current official Circle evidence, reviewed 2026-09-13

Circle documents social, email-OTP and PIN authentication. Its email route needs
configured SMTP and email access for recovery. Retain email OTP for the wallet
as the simplest proposal consistent with the selected direction; neither PIN nor
another custody product is substituted to remove app-entry OTP.
[Authentication methods](https://developers.circle.com/wallets/user-controlled/authentication-methods).

The Web SDK handles user challenges; the tutorial describes loading an existing
wallet for an initialized user. Its email sandbox example does not itself prove
delivery to the owner's inbox. Use a working test email delivery route for the
owner trial; enterprise email operations and production availability are not P2
requirements.
[Web SDK](https://developers.circle.com/sdks/user-controlled/web-sdk),
[wallet tutorial](https://developers.circle.com/wallets/user-controlled/build-a-wallet-app).

The authenticated user endpoint returns the user identity using a user token;
server validation is the proposed binding boundary.
[Get user](https://developers.circle.com/api-reference/wallets/user-controlled-wallets/get-user-by-token).
Circle lists both EOA and SCA for user-controlled Arc Testnet accounts. Select one
supported profile before the first provisioning attempt according to actual setup
cost and needed features, without forcing Treasury features into Personal Wallet.
[Supported blockchains](https://developers.circle.com/wallets/supported-blockchains).
Exact SDK/session expiry, callbacks, provider configuration and costs remain
first-P3 checks. These are documentation observations, not provider-account or
runtime verification; no OTP, wallet or provider configuration action was executed.

### R01–R11 dependency and evidence timing

This is a refinement of the canonical roadmap's existing IDs, not a new roadmap.

| Requirement | Dependency / near-term contract | Evidence due |
| --- | --- | --- |
| R01 Account/Personal Wallet | Temporary entry separate from durable Account; verified identity restores existing bindings; legacy return path before cutover | First P3: same Account/wallet after session loss or device change, no duplicate provisioning; real wallet auth requires scoped provider permission |
| R02 Account/Business scope | R01 and existing server-side control records; no email-derived legacy rights | P3: two separate browser contexts, guessed IDs/deep links denied, no leakage/switching confusion; independent-controller proof still P6 |
| R03 Formation | R01/R02 and Personal Wallet readiness; consumes R05/R06's minimum coordination/context contract | P4: resumable AI-assisted creation and one genesis; full schema/catalog design not required at P2 |
| R04 Readiness | R03 plus Treasury binding and R07 executable offering dependencies | P4: Created/readiness/launch distinguished, failed dependency not advertised as ready |
| R05 Orchestrator | R02 scope, R06 context, existing bounded authority; retain recoverable Work | Minimum at P4; bounded operation/model-cost/recovery proof at P5; no universal agent runtime required first |
| R06 Brain | Stable Business identity and R02 access; inputs/assumptions/decisions separate | Minimum at P4; durable, source-attributed work knowledge at P5; supported model replacement at P6 |
| R07 Offering/customer | R03/R04 and existing commerce/fulfillment; immutable committed terms | P4–P5: one supported offering/order fulfilled consistently; broad connector/catalog coverage deferred |
| R08 Economic decision | R02 authority/context, R07 terms, canonical economic path | P5: enforce actual amount/fee scope and reconcile uncertainty before real financial use; P3 handles only its actual provider/setup costs |
| R09 History | Existing ledger plus R05/R07/R08 work/decision/delivery/use links | P5: explain the complete cycle without double-counting transfers; P7 adds funded loop |
| R10 Reuse/core acceptance | Working P3–P5 journey | P6: distinct Business/controller contexts, supported model reuse and owner Android/desktop acceptance; local email entry alone proves no independence |
| R11 CAPITAL/closure/CONNECT | P6 sufficient core proof → P7 funded loop → P8 integrated acceptance | A09/A10 and CAPITAL mechanism at P7; no permanent score prohibition; CONNECT remains conditional P9 |

### Remove avoidable work while keeping concrete safeguards

- End local Arc Litepaper lookup. Its historical missing-path note below is closed
  as a work item, not resolved by inventing a file. If Arc information is needed,
  use [arc.io](https://www.arc.io/) and linked official documentation.
- Reuse P0, inspected PDFs, manifest-at-extraction evidence and unchanged code
  findings. Recheck only an affected change, uncertain effect or relevant gate.
  No repeated audit, rendering, old financial retry or proof-data reconstruction.
- Do not seek repeated permission for routine work within an authorized slice.
  New actual costs, control changes, external writes and irreversible actions
  still need authority covering their concrete scope.
- Do not require production hosting, public signup, enterprise SMTP, mainnet,
  complete custody evolution or broad device testing before the first local flow.
  Start with the owner's actual browser; check a second representative browser
  after the path works, before closing P3. Full core Android/desktop acceptance
  remains P6 and integrated acceptance P8.
- Plan R01–R11 interfaces/dependencies now; defer detailed later-stage schemas,
  all agent types, general services, CAPITAL instruments and CONNECT design.
  Retain minimum Brain/Orchestrator/readiness commitments for P4 planning.
- Use this state file, source hierarchy and existing roadmap/PR records.
  No additional planning document or duplicate roadmap is needed.

### Data, branch/PR and first-P3 gates

Before the first write-based test, the implementer must identify and verify a
separate test database target and credentials that cannot mutate historical proof
data. Do not merely relabel the active database or run current db:verify on it:
that command migrates and writes fixtures (A15). Use synthetic test data, disabled
live wallet/model side effects by default, and make the exact target explicit.
Isolation need not mean a new database provider or production infrastructure.
No database inspection/provisioning is authorized in this pass.

Selected planning base: inspected commit
`e176e80a4261b1bafd4ca9b689027e61bd848863` on #51 lineage, retaining #49/#50's
Work/resource code. After authorization, use an isolated worktree and focused P3
branch from that commit; leave the current dirty checkout untouched. Carry the
latest reviewed six-document delta explicitly, not all uncommitted files or
stash-pop. The selected base commit does not contain these local documentation
updates; verify the resulting worktree's actual instructions and continuity before
implementation, rather than following the old base's next task.
Preserve substantive PROJECT_STATE continuity, next-env.d.ts, all browser
artifacts, both stashes and private configuration. If the base has changed,
inspect only the intervening relevant delta before carrying this plan forward.
P2 planning created no branch/worktree; its documentation is now authorized for
commit and push on the existing branch. Eventual PRs must state their #51
ancestry and separate new work from the existing stack; merging that stack is not
a P2 prerequisite or evidence of P1 product acceptance. Recheck deployment
triggers only before a separately authorized remote operation.

### One bounded first-P3 experiment and acceptance measures

1. Before writes: prove the chosen isolated database/role cannot modify existing
   proof data; use synthetic Accounts/Businesses and disabled live provider/model
   effects. Record target identity and isolation evidence, never credentials.
2. In the owner's actual browser: email-only entry, a temporary context and
   contextual authentication with prefilled email. Deterministic adapter checks
   first exercise persistent Account lookup, existing-wallet reuse, expired
   session, timeout/concurrent initialization and foreign-Business denial.
3. Under separate provider/configuration/cost authority: validate actual Circle
   app/email delivery, select one supported EOA/SCA profile and prove one UCW
   setup followed by recovery of that same wallet. No funding, purchase or
   allowance is part of this experiment. A mock does not close wallet readiness.
4. Compare persistent Account ID, wallet binding and authorized Business set
   before/after browser close, logout, cookie loss and a second independent
   browser context representing device/session loss. Same verified identity
   must recover the same IDs; the same typed email without proof recovers none.
   A second physical device is not required for this initial mechanism test.
5. Before old access is replaced, separately demonstrate the owner's legacy
   return/binding path after session loss under its scoped authority. Rehearse
   with synthetic legacy fixtures first; a real historical binding is not
   authorized by this documentation. Keep old access available until it passes.

Success requires no duplicate Account/wallet, no foreign or historical data
leakage, no lost old control, honest recoverable failure/unknown states, and no
repeated email/OTP while applicable authentication remains valid. The owner must
understand which step restores protected access and be able to return to the same
Account without operator-reading OTPs. Tokens/credentials stay out of evidence.
A supported second-browser compatibility check follows the working path before
P3 closes; broader Android/desktop core acceptance stays P6. P4 genesis still
requires P3 wallet readiness, not a mock or documentation claim.

### P2 closure acceptance and later evidence

- Owner accepted the completed P2 plan: durable Account/session contract, simple contextual
  UCW flow, legacy-before-cutover guard, selected branch base, preservation/data
  plan, first-P3 success criteria and R01–R11 dependency timing.
- P2 closure was accepted after authorized synchronization of the canonical
  roadmap directly updated the affected sections, including R01/§9.5–9.6. No
  additional P2 planning blocker remains. Provider/runtime and legacy cutover
  proof remain at the explicit P3/later gates and are not claimed complete.
- Early P3, not P2 closure proof: actual isolation, SDK/session behavior, working
  email delivery, provider identity stability, supported wallet profile/cost and
  real same-wallet recovery. Any failure stops the affected slice, not all
  planning. The implementer records observed evidence at the tested revision.
- Before legacy cutover: owner-specific fresh-session legacy recovery or verified
  association as above. This gate cannot be deferred merely because bulk migration
  is deferred. Material changes in control, actual costs or recovery dependence
  require an explicit recommendation and appropriate owner authority.
- Later: R03–R09 evidence at P4/P5; R10/P6 reuse/core acceptance; R11/P7 CAPITAL
  mechanism/A09/A10 and funded loop; P8 integrated closure; conditional P9 CONNECT.
  Their complete schemas/designs are not prerequisites for closing P2.

P2 is COMPLETE — OWNER ACCEPTED on 2026-09-13. Do not start P3 automatically.
No live proof, merge or new document is
needed in this pass; implementation and provider actions need their own scope.
All earlier local changes and historical evidence are retained; no code,
configuration, database or external service state is changed. The dated 2026-09-12
records below remain historical: their invited-entry assumptions, pending planning
and Arc Litepaper location follow-up are superseded by this revision.

Finalization validation: the actual before/after content differences in the
roadmap and six repository documents were inspected, not only links/formatting.
The roadmap's extraction checksum changes intentionally; its manifest and other
Second Brain source contents are not edited. The Product Baseline relocation
preserved all 17 remaining files byte-for-byte. git diff --check succeeded, 43 local
Markdown references resolved, and branch/HEAD/stash list plus content hashes of
next-env.d.ts and all 31 browser artifacts matched the pre-edit snapshot.
These checks do not constitute application tests or P3 acceptance.

## P2 inspection and documentation alignment — 2026-09-12

The owner accepted the preceding inspection report and authorized alignment of
six active documentation files only. **P2 IN PROGRESS; P3–P9 NOT STARTED.**
These local edits await owner review and are not committed or accepted into main.
The [source hierarchy](docs/engineering/source-hierarchy.md) identifies the
canonical roadmap, accepted P1, exact device-local paths and explicit corrections;
this continuity note is not another roadmap.

### Evidence carried forward and PDF clarification

The inspection confirmed branch `codex/work-economic-requirements`, HEAD
`e176e80a4261b1bafd4ca9b689027e61bd848863`, and all 22 manifest entries'
byte lengths/SHA-256. Required P1/instructions sources were read and the relevant
Concept/REV2/Post-H/checkpoint sections inspected. Remote/provider status and
old test results remain dated evidence; this pass does not reverify them.

| PDF identity (under the catalogued package's `output/pdf/`) | Original pages | Captured images | Unique pages visually inspected |
| --- | --- | --- | --- |
| `Inomasa_Final_Visual_Design_Package_2026-09-11.pdf` | 20 | 21: `visual-01`–`visual-20` plus page-1 `visual-probe` | 20 |
| `Inomasa_P1_Platform_System_Model_2026-09-10.pdf` | 4 | 6: `model-01`–`model-06` | 4 |

The existing `model-04.png`/`model-05.png` captures are byte-identical;
`model-06.png` is another view of page 4. Retained captures 04/06 show `4 / 4`
in the viewer. This clarification uses existing artifacts at
`/tmp/inomasa-p2-pdf.zBWlH9`, without rerendering or repeating the full review.
Image counts do not establish page counts. The preceding review was visual,
not merely text extraction, and proves no application runtime/usability.
The two exploratory PDFs remain integrity-checked history. Temporary captures
are not required portable project state.

### Preserved P0 and local continuity

P0 is COMPLETE by the owner's accepted reconciliation, without a new database
or transaction inspection. Migrations 015/016 are already applied on the recorded
device. Preserve research-only Agent `agt_product_15c7e41dfe2af99bffb519dc2c42`,
Work `wrk_016bbbe3dec99bfbe691ccf8dcea10d7` and proposal
`b2abdd52-6b89-4260-a48c-ade81f71d429`. The old allowance is definitively
**NOT SUBMITTED**, with no pending transaction for that action. Old balances,
fee estimates and financial plans below are historical, not renewed authority.

Before this pass, local changes were `PROJECT_STATE.md` (+411/-14),
generated `next-env.d.ts` (+2/-2) and untracked `.playwright-cli/`.
The two retained stashes are `stash@{0}` (“preserve Android live Gemini proof
before PR51 takeover 2026-09-09”) and `stash@{1}` (“preserve phone work-5
continuity before local arc proof 2026-09-07”). Recovered Android observations
and the old next-step text remain intact, explicitly historical.

### Second Brain path reconciliation — 2026-09-12

After the documentation alignment, the owner moved historical references within
Second Brain. A path-only check found the dated historical roadmap at
`/mnt/second-brain/Project/inomasa-project/History/Inomasa_Product_Realignment_Map_2026-09-09.md`
and Canonical Architecture at
`/mnt/second-brain/Project/inomasa-project/History/Inomasa_Canonical_Architecture_v1.0.docx`;
both SHA-256 values match their original `BASELINE_MANIFEST.json` entries. The
undated active roadmap and all catalogued P1 sources remain in their recorded
locations. The manifest is retained as the package-at-extraction record and is
not rewritten to mirror later folder curation.

The manifest identity `project_sources/03-Arc-Litepaper-2025.pdf` was not found
under the project Second Brain by filename or recorded SHA-256 during this check.
`History/Nexia_Litepaper_v1.1.pdf` is a different file and is not substituted.
This is an unresolved current path only, not evidence that the manifest content
was corrupt. Report its current location when available; do not infer its contents.
No Second Brain file was moved, deleted or changed by this reconciliation.

### Alignment and remaining P2

This pass aligns `AGENTS.md`, this file, root `README.md`, and engineering
`source-hierarchy.md`, `architecture-invariants.md`, `README.md`.
Concept/REV2/Post-H, historical sources and Second Brain remain untouched.
No new document or baseline-package copy is created.

The prior inspection corroborated roadmap §9/R01–R11 gaps: Account/Personal
Wallet, AI-assisted formation/Brain/Orchestrator, real readiness, reusable Work,
Work-to-History, fee enforcement and audit A09/A10/A15. Existing canonical
economics, authority, persistence and the resource bridge remain the foundation;
this documentation change fixes none of those application gaps.

After owner review, remaining P2 work is to make R01/R02's P3 access/identity/
wallet/recovery contract concrete, protect historical principals and Businesses,
and resolve or explicitly bound provider/profile/cost/device uncertainties with
responsibility, evidence and timing. Current provider runtime is UNVERIFIED here.
Any deferred first P3 proof needs its own scope before broader implementation.
Establish isolation before later write-based database verification.

Invited access remains the current implementation boundary, not a permanent
product decision. Carry roadmap §5's “Join the Alpha” and “Circle User-Controlled
Wallet” notes with honest control/recovery information. CAPITAL evaluation is
P7 after P6 and before P8 closure; CONNECT is P9 conditional. No permanent
universal-score prohibition, new score or expanded authority is adopted.

Documentation checks found no whitespace errors or broken local references
(43 checked). The six file contents matched the reviewed edits; historical
continuation/old next-step text was preserved. Content hashes confirmed unchanged
`next-env.d.ts` and all 31 `.playwright-cli/` artifacts; branch/HEAD and both stash
list entries matched the pre-edit snapshot. These are documentation/preservation
checks only. Tests/build/server, migrations, database/provider/wallet/transaction
actions and remote Git/deployment operations were not run.
P2 still needs owner review, a concrete P3 plan and bounded material uncertainties.
Stop for review; do not start P3.

## P2 documentation publication scope

The owner authorized one P2 documentation commit on the existing working branch.
The staged PROJECT_STATE carries P2 decisions, accepted P0 summaries, source
locations and future gates; the older detailed Android continuity additions and
their historical next-step edits stay intact in the local working file, outside
this commit. Their existence is recorded here without attributing them to P2.
The committed pre-existing historical text is retained under explicit historical
headings. Transfer the separate local continuity deliberately in future work.

Before publication, GitHub reported the working branch at e176e80, PR #51 open/
draft with auto-merge unset, no repository webhooks, and only the engineering
verification workflow (no deploy step). The Vercel connected-app check reported
both Inomasa projects with Git link null; the primary project reported live false.
This supports the authorized branch push without automatic deployment. The push
can run the existing PR verification; it is not a local test or deployment claim.

## Historical continuation evidence

The following dated #49–#51 and Android sections preserve observations and prior
execution directions. Their unfinished financial journey is not the active task.
Current P2 authorization and the P0 NOT SUBMITTED result above take precedence.

## PR #49 local continuation verification (historical scope)

The source tree was reconstructed from the exact Git objects at corrective head
`175498bb1fa740cc88ba6cbfe9ab4620792197b9`; all source blob identities and the
head tree were checked before changes. This preserves the three corrective
commits after Work 5. No main merge, deployment, new database provider,
production dependency, lockfile change, contract deployment, or new schema
migration was part of that PR #49 continuation. The later work slice below adds migration `015`.

| Evidence | Observed scope |
| --- | --- |
| Corrective baseline | Node 22 `npm run verify` passed before changes: 81 tests, lint, types, build and browser-secret boundary. |
| Current unit/engineering gates | Node 22.22.0 `npm run verify` passed locally: lint, types, 92/92 tests, build, and secret-name scan of 18 browser artifacts for 10 private environment names. New tests cover structured AI output, tampered/expired/cross-principal proposal proofs, provider failures, source authorization, URL/size bounds and actual local-origin handling. Implementation head `b63aedafe1e3466d36c379098a243372e3978bd7` also passed [Engineering verification run `34066094336`](https://github.com/0xinomasa/inomasa-project/actions/runs/34066094336) in [draft PR #49](https://github.com/0xinomasa/inomasa-project/pull/49). The PR remains unmerged. |
| Database proof | All migrations through `014`, previous Work 2/3/4/5 persistence checks, and new `runLocalProductPersistenceProof` passed on isolated PGlite 0.5.8 with its socket server. The new proof checks retained AI/source context, source replay conflicts, tenant isolation, pending distinct Treasury records, rejection before COMPLETE settlement, output/evidence integrity, exactly one delivery, no financial posting by delivery, and fixture cleanup. This is a PostgreSQL-compatible local test; it is not a native PostgreSQL 17 result. Native PostgreSQL 17 verification also passed in run `34066094336`, job `101574994778`, including clean migrations and `db:verify`; this is separate from the earlier PGlite result. |
| Local browser proof | A fresh migrated temporary database, a separate loopback HTTP source, the actual Next.js local server and Chromium 149 passed ten checks: anonymous mutation rejection, honest unconfigured AI/no creation, login + BUILD creation + workspace, cross-origin rejection, CONNECT source + workspace, replay and changed-manifest rejection, 390×844 overflow check, second-principal workspace/source isolation, no premature payment/resource delivery, and no uncaught page error. This verifies the changed paths, not every old product journey. |
| Browser environment | `agent-browser` could not start its daemon here; direct Playwright controlled an isolated Chromium installation instead. The browser's font directory required an environment-only correction. Test helpers stayed outside the repository; application dependencies and Android setup were not changed. |
| Newly observed application correction | Next's local request URL used `localhost` while the browser sent `127.0.0.1`. The new endpoints now compare Origin with the actual Host plus request protocol; cross-site, missing, different-port/protocol and malformed hosts still fail closed. Temporary diagnostics were removed. |
| Live integration limits | No Gemini key/model entitlement, owner Neon connection or Circle execution credentials are available in this workspace. No live AI generation or new Arc payment was executed. A connected loopback source and synthetic settled database row cannot be presented as that evidence. |
| Continuity | This existing state file, README, AGENTS and Post-H section 12 carry the bounded continuation. The optional Second Brain path was unavailable here; no alternate state authority was created. |

## Work-linked economic requirements continuation — 2026-09-08

The owner explicitly authorized step 3 after the first work slice. The clean
source was PR #50 head `d7c078c4b376d499ab1a13cdaa258edabdd9e80c`, independently
rechecked open/unmerged on GitHub. Work is on `codex/work-economic-requirements`;
PR #49, PR #50, main and the phone checkout are preserved. Post-H section 13.6
records the selected bridge and its limits before implementation.

Migration 016 adds default-private offer sharing, one optional resource requirement
per work, and an attributed saved resource input. A seller explicitly shares an
active instant-resource offer with other invited Alpha Businesses in the same
environment. Sharing never grants workspace access. An unconfirmed requirement
can be declined; a confirmed purchase retains delivery even after sharing withdrawal.

The requirement freezes purpose, offer/terms, price, recipient and canonical request
identity. Human confirmation uses an active purchase Agent with verified economic
identity and the existing bounded grant/obligation/payment preparation. Confirmation
and the canonical request commit together. Changed terms, lost visibility and changed
work reject the transaction. PREPARE replay checks the original purchasing Agent.
The default runtime still uses Circle; a read-only requirements port enables isolated
composition testing without keys or provider calls.

Work cannot bypass a pending resource by reading a free replacement. Only matching
COMPLETE payment/settlement and completed, digest-checked Arc delivery become its
stored input. Analysis includes the resource/purpose/authority references in its
input digest. The financial kernel remains the only poster of Revenue/Service Cost;
attachment and analysis never pay or post again. One selected resource is an initial
capability limit, not a general relationship cardinality. Agent-generated procurement,
arbitrary resource executors, shared budgets and expanded Capital remain unimplemented.

Observed so far: Node 22 `npm run verify` passed 99 tests, lint, typecheck, build and
client-secret scanning (18 artifacts / 10 names). Isolated PGlite `db:verify` applied
001–016 and passed all existing proofs plus actual canonical PREPARE composition
with two controllers, opt-in/revocation, changed-price rollback, withdrawal during
provider discovery, exact replay, wrong Agent rejection, pending/unknown/payment-only
holds, corrupt delivery rejection, saved paid input analysis, and exactly one request,
one delivery and two canonical postings. Provider identities/signatures/outcomes were
explicitly synthetic. No real transfer, model call, wallet provisioning or old-data
mutation occurred.

Twelve browser checks passed on actual Next.js/Chromium with a fresh isolated
PGlite database: existing BUILD/Agent entry, private offers, explicit cross-controller
sharing, requirement/confirmation, pending-source holds, withdrawal after confirmation,
application stop/restart, paid input reuse through an AI quota retry, owner review,
390/1440-pixel layouts without horizontal overflow, private work isolation, and exactly
one purchase with two canonical postings and one delivery. Screenshots were visually
inspected. No uncaught page error was observed; expected conflict/quota responses
remain visible. Circle capability discovery, signatures/settlement, Arc and Gemini
responses were synthetic, not live provider proof. Browser helpers/certificates stayed
outside the repository. A local TLS certificate-name mismatch and a truncated local
browser binary were corrected in that test environment only; application TLS and
Android configuration were not weakened.

The exact reviewed tree `2adb8352d0d78428ad3562eee0e662f0542c2c29` was persisted as
code commit `60d2bfff5de622ae22687edb2a693a0e0c912e7a` in draft [PR #51](https://github.com/0xinomasa/inomasa-project/pull/51),
base `codex/business-work-continuation`. Native PostgreSQL 17 and all engineering
checks passed in [run `34243042485`](https://github.com/0xinomasa/inomasa-project/actions/runs/34243042485),
job `102117840152`. These are observed checks on the code head, separate from the
isolated browser provider simulation. PR #49/#50 remain open and unmerged; no main
merge or device mutation occurred. Vercel was rechecked paused with unchanged
configuration time and no deployment action. This section and Exact next step
are the continuity closeout; the direction document for Second Brain separately
retains rationale and limitations.

## Persisted Business work continuation — 2026-09-08

Post-H section 13 records the owner's new five-step sequence and the mapping
from existing code before implementation. Step 1 alignment is complete for this
slice; step 2 now has persisted research work in the existing Business module.
It is a bounded capability and a basis for further discovery, not a finalized
universal Agent architecture or an economic loop already completed.

The separate branch `codex/business-work-continuation` starts from exact PR #49
head `42aa51cf7554f5190cae24e377c547effbf51ebd`. GitHub's original branch was
rechecked unchanged before continuation. The source initially had no changes;
the phone checkout and its uncommitted state are not accessible here. Accepted
main and PR #49 have not been replaced. Vercel was read-only checked: project
`inomasa` remains paused (`live: false`) with no repository link and unchanged
update time. No deployment is part of this work.

### Implementation and boundaries

Migration `015` adds Business work and execution attempts. Existing Business,
Agent, controller and environment checks govern work creation and execution.
Objectives and criteria are immutable for an exact request identity. Short
transactions claim one step, save an attempt before the provider call, and fence
completion by revision, attempt token and lease. Work survives a process stop;
expired attempts become OUTCOME_UNKNOWN before a separate explicit retry.
Completed observations are reused, completed work never calls the model again,
and the controller must accept or reject generated output with a review note.

The first capability observes public Arc Testnet data, then uses an explicit
Gemini model through a provider-neutral port. It performs no financial actions.
Each work allows at most three AI attempts; this is not a global account quota.
Provider errors, unavailable access and invalid output are visible. Model output
has input/output digests and attribution, not a claim of truth or payment.
The Workspace uses its existing shell plus work/criteria/result/review controls;
no screen-by-screen approval workflow or application redesign is introduced.

No production package, lockfile, hosting, database provider, custody meaning or
financial kernel is changed. Local fixtures and model/source responses used for
mechanics proof are synthetic. Historical money and evidence are untouched.

### Verification and remaining evidence

Final local Node 22.22.0 `npm run verify` passed 99/99 tests, lint,
typecheck, build and a scan of 23 browser artifacts for 10 private environment
names. The isolated PGlite/socket profile applied migrations 001–015 and passed
`db:proof`, including existing proofs. New work proof covers two separate
controllers/Businesses using the same executor, replay conflicts, concurrent
claim exclusion, persisted source reuse, stale completion rejection, expired
source/model attempts, missing provider, quota/invalid-output failures, human
review, retired-Agent denial, a three-attempt ceiling and no financial entries.
PGlite is PostgreSQL-compatible, not a native PostgreSQL 17 result.

The actual Next.js app and Chromium passed twelve isolated browser checks:
existing Business/Agent entry, exact work replay, origin rejection, persisted
source step, app-process restart and reopening, visible quota failure, explicit
AI retry without source replay, 390×844 and 1440×900 no-overflow states, mandatory
human review, cross-controller read/mutation rejection, and zero new financial
entries/obligations/settlements or uncaught page errors. Source/model transports
were injected outside the repository and external browser requests were blocked.
This is synthetic application mechanics evidence, not live integration evidence.

An explicit label association fixed the new Agent selector's accessible name.
The new form now uses the existing light product colors and padded result cards.
Screenshots were visually inspected after correction. The Next.js development
indicator is disabled through its documented setting; compile/runtime errors
remain visible. Browser restoration required re-extracting a truncated test
binary and correcting its environment-only font path. Reopening a page after
app restart avoided an HMR navigation race in the helper; no application recovery
check was bypassed. These helper repairs changed no Android installation.

Implementation commit `3da4a7c2fc79319b9068c0104fb7acf8b04ddc51` is stored in
[draft PR #50](https://github.com/0xinomasa/inomasa-project/pull/50), based on PR
#49's separate branch. [Engineering verification run `34187149689`](https://github.com/0xinomasa/inomasa-project/actions/runs/34187149689),
job `101937676607`, completed successfully on that implementation: dependency
installation, `npm run verify`, and `npm run db:verify` against native PostgreSQL
17 all passed. This is separate from the PGlite/browser profile. PR #50 remains
unmerged and does not change accepted main. The follow-up documentation commit
records this observed result; subsequent PR checks remain visible in GitHub.
No new live Gemini generation, Arc observation, payment or Capital allocation is
claimed from this workspace. The owner-reported phone transcript separately
records live Gemini BUILD and one `arc-data-lokal` Business with pending Treasury;
that success must be inspected before further phone operations, never recreated
as an automated test. This repository cannot claim direct verification of the
phone's unsynced configuration or runtime.

Cross-controller activated-offer discovery remains a concrete step-3 gap: the
current product lookup requires one controller to own buyer and seller. Economic
requirements, work-to-payment/delivery/use links, enriched History/Capital,
another live model and final mobile/desktop owner acceptance remain open. The
new internal work record is not an ERC-8183 funded job or a second ledger.

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

- `GHA-ACTIONS-RUNTIME-01` — **ACTIVE / NON-BLOCKING**. Checkpoint H accepted-main
  run `33206624023` passed, but GitHub still warned that
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
2. Accepted P1 and the canonical roadmap govern product realignment; Concept & Architecture retains unaffected contracts. See [source hierarchy](docs/engineering/source-hierarchy.md) for identities, locations and explicit corrections. Product acceptance is separate from accepted main implementation.
3. [`docs/engineering/inomasa-alpha-implementation-and-testnet-realization-v1.0.md`](docs/engineering/inomasa-alpha-implementation-and-testnet-realization-v1.0.md) is the active Alpha implementation guide and cannot silently amend the Concept & Architecture contract.
4. Devices are replaceable development clients. Android + Termux + Ubuntu Proot is proven, not architecturally required.
5. Operators and AI tools are replaceable. Codex, OpenCode, ChatGPT, another AI, or a human engineer receives no authority from chat history or tool identity.
6. PostgreSQL semantics and the internal persistence boundary are durable; Neon is the current hosted development provider, not an application boundary.
7. Credentials and recovery material are supplied through authorized channels outside Git. Never commit or paste them into documentation, issues, CI logs, or chat.
8. After every significant checkpoint decision or accepted merge, update this file
   in the same change whenever practical. Record the latest completed checkpoint,
   evidence, open holds, and exact next execution point. A future operator must not
   need historical chat to discover state.

## Invariant destination, adaptable execution route

The engineering destination follows the applicable source hierarchy, accepted P1,
canonical roadmap, retained kernel contracts, current checkpoint, safety rules, acceptance
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

These are operational reference commands, not instructions to execute during the
current documentation-only P2 pass. First obtain the owner-designated product
sources by their identities in the source hierarchy; a clean clone need not
contain this device's Second Brain mount. Report missing sources without guessing.

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
| Neon | Dedicated hosted development database used for controlled development/proof | Current provider only; no Neon API in application/domain code | Existing development connection remains intentionally configured outside Git. If unavailable, provision an authorized compatible PostgreSQL database and replay migrations plus `db:verify`. |
| Next.js `16.3.3` | Controlled-Alpha application runtime used by the protected Preview | Patched Active LTS engineering framework, subordinate to active Inomasa product architecture | The 2026-08-25 security maintenance changed only the pinned Next.js package family and lockfile metadata; future security concerns require new current evidence. |
| Arc Testnet | Required Alpha chain and current real-execution target | Exact chain/asset registry and the first real USDC settlement are verified | Chain ID `5042002`; testnet identifiers and facts must never be reused as mainnet authority. |
| Circle Developer-Controlled Wallets | Selected and verified Alpha EOA Treasury execution adapter | Two platform-controlled external account bindings are active behind an Inomasa port; neither is identity, user custody, or Protected Treasury | API key, registered entity secret, and wallet-set ID stay outside Git; User-Controlled EOA remains the user-custody/exit reference path. |
| Circle Gateway / Nanopayments | Selected and verified Alpha x402 v2 `exact` rail | One-time EOA deposit, Circle Signing API, public Gateway facilitator, and provider-reported receipts sit behind Inomasa x402 and persistence ports | No private key is introduced; exact payloads are persisted before facilitator handoff. The EOA deposit and seven-day minimum signature validity are explicit operational/security tradeoffs; generic x402 data remains portable while the Gateway adapter is replaceable. |
| Vercel | Deployment provider; project `inomasa` retains protected Alpha Preview artifacts | Provider implementation only, not an architecture boundary | Framework Preset `Next.js`, Node `22.x`, Vercel Authentication protects Previews. Production is currently project-paused after the accidental Work 1 merge-triggered deployment; the project-level GitHub repository connection is disconnected, so Git pushes/merges do not auto-deploy. Existing Preview artifacts remain available. Do not reconnect Git or resume Production without explicit owner authorization and applicable gates. See [`docs/engineering/deployment-foundation.md`](docs/engineering/deployment-foundation.md) for historical B4 evidence. |
| Codex / OpenCode / ChatGPT | Optional engineering operators | Replaceable tools, never authority or state storage | Local/provider credentials remain outside Git; all tools follow `AGENTS.md`. |

The repository contains the accepted generic Business, Agent, commerce, Economic History,
provider-driven Capital, Arc Testnet ERC-8004/ERC-8183, Circle EOA, and Gateway x402
kernel paths described by A–H, plus accepted Work 1 product entry, Work 2
Operational Workspace, Work 3 human-confirmed economic operation, and Work 4
controller-scoped provider-driven Capital slices.
The accepted A–H private-testnet regression projection is recorded above as seven Businesses, six
Agents, four Capital Providers, `0.680000` USDC of settled commerce, `0.400000`
USDC of separate Capital allocation, twenty economic entries, twenty-two Evidence
facts, and nine complete service deliveries; all remain synthetic/common-control
proof fixtures. The canonical roadmap defines the remaining human product realization; Post-H
retains applicable semantics and dated evidence under the source hierarchy.
No credential is committed, and no hosted Agent, Agent wallet custody, LLM
authority, independent demand, Production Capital, Production database, or
currently serving authorized Production deployment exists.

## Recovery and takeover rules

- **Current device unavailable:** use another suitable workstation, clone `main`, and complete the clean-clone takeover. Do not copy an old working directory as the new source of truth.
- **ChatGPT or an AI tool unavailable:** a human or alternative AI reads this file, `AGENTS.md`, source hierarchy, safety documentation, Git history, and CI. No conversation reconstruction is required.
- **Codex unavailable or unsafe:** use OpenCode or a human workflow. On Ubuntu Proot, retain the B0 limitation; elsewhere use the least-privilege supported mode.
- **PostgreSQL provider unavailable:** do not redesign application code. Provision an authorized standards-compatible PostgreSQL development database, set generic local variables, replay versioned migrations, and run `npm run db:verify`.
- **GitHub temporarily unavailable:** preserve the last verified clone and work offline only when safe. Do not declare a merge/gate accepted until the authoritative origin and `main` CI are available again.
- **CI unavailable:** local evidence may diagnose work, but cannot replace the required observed `main` CI evidence for an accepted gate.
- **Required source missing or unreadable:** report the exact document identity
  and location from the source hierarchy. Continue only unaffected inspection.
  Do not assume a repository copy replaces an owner-designated P1 source, that
  another device has the same mount, or that a summary supplies missing meaning.
- **Credential loss or suspected compromise:** do not record recovery material here. Stop affected access, use the provider/account recovery process, rotate credentials, and re-run the relevant verification before resuming.

## Exact next step

Continue the same P3 branch from the published first-slice checkpoint in draft
PR #52. Local browser verification and publication are complete. Implement
Circle UCW contextual authentication and verified Account/Business bindings using
current official provider contracts. Native PostgreSQL proof is required in CI.
Before live setup, identify the approved Circle application, usable email delivery,
wallet profile and any cost/authority needed; do not request or put secrets in chat.
Test wallet lookup/reconciliation before creation and real recovery before declaring
readiness. Prove legacy return before replacing any legacy access. P3 remains open.

Use the last observed file/Git/test state when resuming; a check of the preceding
step is not authorization to repeat an uncertain provider operation. Do not restart
P2, reapply phone stashes or reopen old financial actions.

## Historical next step — preserved 2026-09-09 record

The remainder of this section is the previous next-step text, retained verbatim
for continuity. Its financial-approval boundary and five-step order are superseded
as active directions by P0 and the P1/P2 roadmap. It is not an execution instruction.

Step-3 implementation is reviewable in draft PR #51 on
`codex/work-economic-requirements`, based on PR #50 head
`d7c078c4b376d499ab1a13cdaa258edabdd9e80c`. Code commit
`60d2bfff5de622ae22687edb2a693a0e0c912e7a` passed isolated database/browser proof
and native PostgreSQL CI run `34243042485`. Inspect the actual branch/remote head
and any subsequent documentation commit; do not force the checkout back to this
code checkpoint. Do not reimplement the bridge or repeat successful setup.

The first unverified part of step 3 is its live, owner-controlled Arc journey on
the actual device. First inspect phone changes and reconcile the stacked #49/#50/#51
continuation without discarding local work. Validate the existing private configuration
without printing it, and use the saved Business rather than recreating genesis.
Prepare a concrete resource requirement with its purpose, exact offer/amount/recipient,
and already authorized buying Agent before any new payment. Until those inputs and
access are available, code review and read-only preparation may continue here.
Do not silently advance to step 4 History/Capital implementation.

Do not reset or replace the phone's `codex/local-arc-proof` checkout, its
PROJECT_STATE observations, private configuration, stash or Arc Data Lokal genesis.
After integration is actually selected, inspect the phone's migration state and apply
only missing 015/016 through the existing authorized administrative connection.
Mutation-based `db:verify` requires an isolated database, never old proof data.

Live economic acceptance still requires exact amount, recipient and authority,
PRIVATE_ARC_TESTNET, current provider access, funded dedicated Business accounts
and the existing economic Agent identity. Inspect uncertain provider/chain effects
before retrying. Synthetic integration proof is not a live Arc payment or Android
owner acceptance. No real amount or recipient is selected by this record.

Following step 3, step 4 connects work/input/output evidence to contextual Economic
History and provider-driven Capital; step 5 expands reuse, providers and usability.
CONNECT remains a later entry into the same system. No main merge, Vercel deployment,
Git auto-deployment reconnection, new hosted provider or expanded financial authority.
