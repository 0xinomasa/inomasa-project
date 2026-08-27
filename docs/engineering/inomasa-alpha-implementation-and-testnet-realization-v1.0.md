# Inomasa Alpha Implementation & Testnet Realization v1.0 — REV2

**Bahasa:** Indonesia<br>
**Status:** `ACCEPTED / ACTIVE` — controlled Alpha implementation guide<br>
**Lingkungan target:** Private / Controlled Arc Testnet<br>
**Dokumen induk:** `Inomasa Concept & Architecture v1.0`<br>
**Engineering provenance:** Copy pada accepted GitHub `main` adalah normative engineering copy. Copy Second Brain adalah curated mirror / working source; perubahan baru memperoleh engineering authority setelah diterima ke GitHub `main`.<br>
**Fungsi dokumen:** menerjemahkan Concept & Architecture Inomasa menjadi sistem Alpha yang reusable, dapat diuji, dapat diamati, dan cukup terbuka secara struktur untuk menerima banyak user, Business, Agent, transaksi, dan Capital Provider ketika akses nantinya dibuka.

---

## 1. Tujuan Dokumen

Dokumen ini mendefinisikan realisasi Alpha Inomasa di Arc Testnet.

Alpha bukan kumpulan demo protocol dan bukan sistem yang dibangun khusus untuk beberapa akun test. Alpha harus menjadi **produk Inomasa yang generic secara struktur**, tetapi masih dijalankan dalam private/protected environment sehingga hanya operator dan pihak yang diberi izin yang dapat mengaksesnya.

Perbedaan penting:

```text
System capability ≠ test fixture
Business template ≠ Business instance
Product capacity ≠ jumlah user pengujian
```

Sistem harus mampu menerima `N users`, `N Businesses`, `N Agents`, `N products/services/jobs`, dan `N Capital Providers` tanpa perubahan arsitektur dasar. Jumlah akun atau Business yang dipakai untuk pengujian nanti hanyalah test population.

Alpha digunakan untuk membuktikan tesis besar Inomasa: seseorang dapat membuat Business, menjalankannya dengan bantuan Agent/AI, melakukan aktivitas ekonomi onchain menggunakan primitive Arc, membentuk Economic History yang dapat diperiksa, lalu membuka jalur Capital berdasarkan aktivitas Business tersebut.

---

## 2. Target Alpha

Targetnya adalah sebuah:

**CONTROLLED ARC TESTNET PRODUCT ALPHA**

yang menunjukkan bahwa Inomasa dapat berfungsi sebagai application layer Agentic Commerce di atas Arc/Circle dengan:

- BUILD sebagai jalur aktif untuk membuat Business dari nol;
- MIGRATE sudah tersedia sebagai capability dan boundary, tetapi belum dibuka;
- Agent yang dapat berpartisipasi dalam ekonomi;
- ERC-8004 sebagai default intended onchain identity/interoperability primitive untuk Agent yang relevan;
- x402 untuk instant machine commerce ketika sesuai;
- ERC-8183 untuk discrete contracted work yang membutuhkan budget, escrow, deliverable, evaluator, dan settlement;
- Arc Testnet + USDC sebagai execution/economic substrate;
- Economic History yang menerjemahkan protocol activity menjadi Business context;
- CAPITAL sebagai sistem multi-provider, bukan satu investor hardcoded;
- product experience yang dapat dipahami tanpa protocol knowledge.

Alpha harus memperlihatkan bahwa primitive tersebut dipakai karena kebutuhan bisnis yang nyata di dalam sistem, bukan sekadar badge integrasi.

---

## 3. Prinsip Realisasi Alpha

### 3.1 Generic system first

Implementasi harus membangun capability yang reusable terlebih dahulu.

Contoh:

- `Create Business` bekerja untuk Business baru yang belum pernah ada;
- Agent dapat dibuat/ditambahkan tanpa perubahan kode;
- service/job dapat dibuat dari data;
- Capital Provider baru dapat masuk tanpa menambah branch khusus;
- Business Site dibuat dari data Business, bukan deployment baru.

Signal Forge, Ops Pilot, dan Business lain yang digunakan selama pengembangan adalah **fixtures**, bukan struktur permanen produk.

### 3.2 Template first, not hardcoded Business

BUILD menyediakan empat Business Template, tetapi setiap template dapat menghasilkan banyak Business instance.

```text
Business Template
      ↓
Business Instance 1
Business Instance 2
Business Instance 3
...
Business Instance N
```

Template adalah starting configuration, bukan batas kemampuan Business selamanya.

### 3.3 Strict correctness, flexible product design

Correctness yang tidak boleh dikorbankan:

- no double payment;
- no double economic posting;
- exact USDC accounting;
- no blind retry setelah ambiguous external effect;
- replay/idempotency protection;
- Capital inflow ≠ Revenue;
- refund ≠ new revenue;
- common-control/synthetic provenance tetap jelas;
- external source tidak diklaim sebagai Inomasa-originated truth;
- committed effect tidak dihapus hanya karena permission kemudian dicabut.

Detail UI, component hierarchy, visual layout, schema internal, dan engineering route tetap dapat dioptimalkan selama prinsip tersebut terjaga.

### 3.4 Use before rebuild

Jika Arc, Circle, atau standard Agentic Economy sudah menyediakan primitive yang cukup untuk kebutuhan tertentu, implementasi menguji dan menggunakan primitive tersebut sebelum membuat custom alternative.

Custom machinery hanya ditambah bila ada gap konkret yang dibuktikan oleh kebutuhan produk atau correctness.

---

## 4. Baseline Implementasi yang Sudah Diterima

Alpha tidak dimulai dari nol.

Working implementation saat ini sudah membuktikan secara controlled Arc Testnet:

- Business instances `Signal Forge` dan `Ops Pilot`;
- Business control dan Treasury binding;
- Circle Developer-Controlled EOA;
- direct Arc Testnet USDC settlement;
- exact revenue/cost allocation;
- settlement-gated service delivery;
- bounded Agent operation;
- Circle Gateway + x402 v2 `exact`;
- paid HTTP resource;
- replay protection dan reconciliation;
- narrow provenance/Evidence;
- PostgreSQL persistence;
- protected Vercel Preview;
- lint, typecheck, tests, production build, migrations, audit, dan CI.

Baseline tersebut adalah **control specimen**, bukan target produk akhir.

Realisasi berikutnya tidak melakukan rewrite-from-zero. Sistem yang sudah bekerja digeneralisasi, diperluas dengan ERC-8004 dan ERC-8183, lalu bagian custom yang terbukti redundant dapat dipangkas setelah replacement proof berhasil.

> **Replace by proof, not rewrite by assumption.**

---

## 5. Alpha Product Contract

Alpha wajib memenuhi kontrak produk berikut.

### 5.1 Multiplicity

Secara struktural sistem mendukung:

```text
N Users
N Businesses
N Agents
N Products / Services
N Jobs
N Capital Providers
N Economic Activities
```

Tidak ada business logic yang mengasumsikan jumlah tertentu.

### 5.2 User roles are contextual

Satu user dapat:

- membuat satu atau beberapa Business;
- menjadi customer tanpa memiliki Business;
- menjadi Capital Provider tanpa memiliki Business;
- menjalankan beberapa peran bila diperlukan.

Role tidak boleh memaksa semua user menjadi founder.

### 5.3 Business capabilities

Setiap Business berada dalam Business System yang sama dan dapat mempunyai:

- Workspace;
- Business Site / Storefront;
- Products / Services;
- Agents;
- Commerce;
- Jobs;
- Treasury;
- Economic History / Activity;
- Capital profile;
- Settings;
- technical/audit details bila diperlukan.

### 5.4 Protocol capabilities

- ERC-8004 tersedia bagi Agent yang berpartisipasi dalam onchain Agentic Commerce.
- x402 tersedia untuk instant machine commerce.
- ERC-8183 tersedia untuk discrete contracted work.
- Direct USDC transfer tetap dapat dipakai untuk flow yang memang tidak cocok dengan x402 atau ERC-8183.

User tidak perlu memilih protocol secara manual pada normal product flow. Product logic memilih jalur yang cocok dengan bentuk transaksi.

### 5.5 MIGRATE

MIGRATE sudah menjadi bagian dari product/system model, tetapi tetap:

**LOCKED / NOT YET OPEN**

pada Alpha awal.

Core Business model tidak boleh mengasumsikan bahwa semua Business selamanya berasal dari BUILD.

---

## 6. Empat Business Template BUILD

Empat template adalah design center awal untuk digital-first Business.

### 6.1 API / Data / Compute

Untuk Business yang menjual resource yang terutama dikonsumsi software atau Agent.

Contoh:

- data feed;
- analytics;
- market intelligence;
- inference/compute;
- search;
- verification endpoint;
- processing API.

Natural commerce:

```text
Agent / Software
  → request resource
  → x402 when appropriate
  → resource returned
```

ERC-8183 dapat digunakan jika pekerjaan berubah menjadi custom assignment dengan scope dan deliverable.

### 6.2 SaaS / Micro-SaaS

Untuk Business digital yang menyediakan software/service kepada manusia atau Business lain.

Contoh:

- automation tools;
- analytics products;
- commerce tools;
- productivity software;
- content tools;
- operational software.

Business dapat menjadi orchestrator yang membeli capability dari Business lain melalui x402 atau ERC-8183 lalu menjual hasilnya sebagai produk sendiri.

### 6.3 Agent-as-a-Service

Untuk Business yang menjual kemampuan Agent sebagai service.

Contoh:

- research Agent;
- coding Agent;
- design Agent;
- marketing Agent;
- analysis Agent;
- specialist digital Agent.

ERC-8004 sangat relevan untuk identity/discovery.

Transaksi singkat dapat menggunakan x402. Pekerjaan besar dengan deliverable/evaluator dapat menggunakan ERC-8183.

### 6.4 Web3-native Digital Business

Untuk Business yang produknya memang berhubungan langsung dengan onchain activity.

Contoh:

- onchain analytics;
- transaction verification;
- treasury automation;
- contract monitoring;
- wallet intelligence;
- settlement service;
- onchain accounting;
- evaluation/attestation.

Template ini penting untuk menguji Business yang lahir dari kemampuan onchain itu sendiri.

### 6.5 Template is not a silo

Setelah Business dibuat, template tidak mengunci capability.

SaaS Business dapat menjual API. Web3-native Business dapat mempunyai Agent-as-a-Service. API Business dapat menerima ERC-8183 jobs.

Template hanya mempercepat onboarding dan menyediakan default yang sesuai.

---

## 7. Business Creation & Business Package

`Create Business` adalah entry utama BUILD.

Setelah user memilih salah satu dari empat template dan memberi informasi minimum yang diperlukan, Inomasa membuat Business instance dan Business Package yang reusable.

Business Package secara fungsional mencakup:

- Business Workspace;
- Business Site / Storefront;
- Product & Service capability;
- Agent capability;
- Treasury;
- Commerce / Jobs capability;
- Economic History;
- Capital profile;
- Settings;
- technical/audit access bila dibutuhkan.

Dokumen ini tidak menetapkan field, component, layout, atau default object secara rinci. Detail tersebut adalah ruang engineering/product design selama Product Contract tetap terpenuhi.

---

## 8. Business Site / Storefront

Setiap Business dapat mempunyai halaman publik di dalam satu aplikasi Inomasa.

Contoh konseptual:

```text
/business/<business-slug>
/business/<business-slug>/services/<service-slug>
/business/<business-slug>/agents/<agent-slug>
```

Route final dapat ditentukan implementation.

Business Site bukan deployment Vercel terpisah. Business Site dibuat dari Business data dan reusable page/template system di aplikasi Inomasa yang sama.

### 8.1 Fungsi

Business Site memungkinkan manusia atau Agent:

- memahami Business;
- melihat produk/service;
- melihat Agent yang relevan;
- melakukan atau memulai commerce;
- melihat activity/trust context yang memang pantas dibuka;
- membuka technical proof bila tersedia.

### 8.2 Scope Alpha

Alpha tidak membutuhkan:

- full Wix-style site builder;
- drag-and-drop editor kompleks;
- custom-domain platform;
- CMS besar;
- blogging engine;
- CRM;
- marketing automation suite.

Business Site cukup menjadi generated/template-driven business surface yang ringan dan dapat berkembang nanti.

---

## 9. Agent System

Business dapat memiliki satu atau beberapa Agent.

Agent adalah software actor yang beroperasi dalam Business context. Agent bukan Business dan bukan wallet.

Minimum relation:

```text
User / Principal
      ↓
Business
      ↓
Agent
      ↓
ERC-8004 identity when applicable
      ↓
Economic Action
```

Inomasa menyimpan Business-specific context seperti:

- relationship ke Business;
- role;
- capability;
- status;
- runtime type;
- economic permissions bila diperlukan.

Internal `agent_id` tetap boleh digunakan untuk aplikasi/persistence. Ia tidak menjadi competing onchain identity standard.

LLM tidak wajib untuk semua Agent. Deterministic Agent tetap sah ketika hal yang diuji adalah authority, protocol, atau execution correctness. AI/LLM digunakan ketika benar-benar membantu Business operation atau product behavior yang ingin dibuktikan.

---

## 10. ERC-8004 Realization

ERC-8004 adalah default intended onchain Agent identity/interoperability primitive bagi Agent yang ikut Agentic Commerce di Alpha.

Minimum system capability:

1. Agent dapat diregistrasikan melalui ERC-8004 pada supported Arc Testnet deployment;
2. Inomasa menyimpan reference yang diperlukan untuk product/reconciliation;
3. Agent identity dapat dilihat pada Agent detail;
4. identity yang sama digunakan pada real economic action;
5. feedback/reputation context dapat dikaitkan dengan activity yang nyata;
6. provenance common-control tidak hilang.

Validation capability dapat digunakan ketika evaluator flow benar-benar membutuhkan dan mendukungnya.

Inomasa tidak membuat universal reputation score.

Implementation registry address, SDK version, dan provider specifics wajib diverifikasi kembali dari official Arc/Circle source sebelum execution.

---

## 11. x402 Realization

x402 tetap menjadi default rail untuk **instant machine commerce** ketika pola transaksinya sesuai.

Natural pattern:

```text
Agent / Software
  → request resource
  → payment requirement
  → signed/authorized x402 payment
  → settlement
  → resource/service delivery
  → Economic History
```

Current verified Gateway/x402 implementation dipertahankan sebagai regression baseline.

Required correctness:

- exact amount;
- commitment persisted before ambiguous external handoff where relevant;
- no blind retry;
- reconciliation;
- replay protection;
- provider receipt;
- delivery only once;
- correct revenue/cost classification.

x402 activity dapat ditautkan dengan ERC-8004 Agent identity.

---

## 12. ERC-8183 Realization

ERC-8183 menjadi default intended primitive untuk pekerjaan yang secara natural membutuhkan:

- client;
- provider;
- budget;
- funded escrow;
- deliverable;
- evaluator;
- complete/reject/expiry outcome;
- payout/refund.

Natural pattern:

```text
Client Business / Agent
  → Create Job
  → Select Provider / Evaluator
  → Fund USDC
  → Work
  → Submit Deliverable
  → Evaluate
  → Complete / Reject / Expire
  → Payout / Refund
  → Economic History
```

Alpha minimal harus membuktikan satu real Arc Testnet ERC-8183 job lifecycle.

Deliverable boleh berada offchain jika hash/reference yang benar digunakan dan relation-nya dapat direkonstruksi.

Correctness harus mencakup terminal-state replay protection, accounting yang benar, dan failure/refund handling.

---

## 13. Commerce Composition

Nilai Inomasa bukan pada x402, ERC-8004, dan ERC-8183 secara terpisah.

Alpha harus dapat menunjukkan composition seperti:

```text
ERC-8004 Agent identity
          ↓
Business Agent
          ↓
 ┌──────────────────────┐
 │ x402 instant service │
 │ ERC-8183 job         │
 └──────────────────────┘
          ↓
Arc / USDC execution
          ↓
Economic History
          ↓
Business context
```

Primitive menyimpan truth sesuai ruang lingkupnya:

- ERC-8004 → Agent registry/feedback/validation context;
- x402 → machine-payment interaction;
- ERC-8183 → job lifecycle;
- Arc → chain execution/finality;
- Circle → wallet/signing/payment capability where used;
- Inomasa → Business relationship dan economic interpretation.

Inomasa tidak mengklaim salinan application database sebagai sumber asli untuk state yang dimiliki protocol/chain/provider.

---

## 14. Treasury & Economic Activity

Business mempunyai Treasury/account capability tanpa menyamakan Business dengan wallet.

Business dan Agent adalah product objects. Wallet/account adalah execution capability.

Economic activity minimal dapat membedakan:

- Revenue;
- Service Cost;
- Capital;
- Refund;
- Transfer;
- Fee;
- other scoped classifications bila benar-benar dibutuhkan.

Accounting menggunakan exact integer USDC units sesuai economic token representation yang berlaku.

Native gas representation, provider-specific balances, dan token economic quantity tidak boleh dicampur sebagai satu angka tanpa semantics yang jelas.

---

## 15. Economic History

Economic History adalah salah satu output utama Inomasa.

Ia harus dapat menghubungkan secara cukup:

- Business;
- Agent;
- counterparty;
- product/service/job;
- action type;
- amount;
- asset;
- economic classification;
- protocol/standard used;
- status;
- source;
- external/onchain reference;
- timestamp/block context;
- outcome;
- common-control/synthetic provenance bila relevan.

Tujuannya bukan membangun analytics platform raksasa, tetapi memastikan aktivitas bisnis dapat dipahami dan direkonstruksi lebih jelas daripada sekadar daftar transaction hash.

### 15.1 Source-scoped truth

Contoh:

- Arc transaction/receipt → chain execution fact;
- x402 receipt → provider/protocol payment fact;
- ERC-8183 contract state/event → job state;
- ERC-8004 registry/event → Agent identity/feedback;
- Inomasa application state → Business context;
- external source → future MIGRATE-originated facts.

### 15.2 Interpretation boundary

Tidak boleh disamakan:

- payment success ≠ service quality;
- onchain activity ≠ organic demand;
- ERC-8004 feedback ≠ universal reputation;
- Capital allocation ≠ Business success;
- common-control transaction ≠ independent market transaction.

---

## 16. CAPITAL System

CAPITAL adalah reusable system capability untuk banyak Capital Provider.

Tidak ada asumsi:

- hanya satu provider;
- jumlah provider tertentu;
- satu universal decision model;
- satu universal score.

Capital Provider adalah pihak yang menyediakan modal dan menanggung risiko keputusan modalnya.

### 16.1 Generic flow

```text
Capital Provider
  → discover / inspect Business
  → review available Business & Economic History
  → apply provider-specific criteria
  → decide
  → define terms
  → allocate USDC Capital
  → Business uses Capital
  → later economic activity/outcome
```

### 16.2 Required semantics

- provider/risk bearer dapat diketahui;
- decision material dapat direkonstruksi secukupnya;
- provider berbeda boleh menghasilkan keputusan berbeda untuk Business yang sama;
- Capital inflow dicatat sebagai `CAPITAL`, bukan `REVENUE`;
- penggunaan Capital dapat ditautkan ke later Business activity;
- Inomasa tidak menjadi lender/guarantor/risk bearer secara default hanya karena menyediakan sistem.

Test population nanti dapat menggunakan beberapa Capital Provider untuk membuktikan provider-specific decisions. Jumlahnya tidak menjadi bagian arsitektur.

---

## 17. MIGRATE System

MIGRATE belum dibuka pada Alpha awal.

Status:

**SYSTEM-READY BOUNDARY / USER-FACING LOCKED**

Yang perlu benar sekarang:

- Business model dapat membedakan origin/entry route;
- core Business System tidak bergantung pada assumption `BUILD-only`;
- product navigation dapat menunjukkan MIGRATE sebagai capability yang belum tersedia;
- provenance model sudah dapat menampung future external source;
- membuka MIGRATE nanti tidak membutuhkan Business Operating Environment kedua.

Saat nanti MIGRATE dibuka:

```text
Existing Business
  → connect/migrate
  → preserve external provenance
  → enter the same Inomasa Business System
```

Tidak ada live migration proof yang diwajibkan untuk completion Alpha awal ini.

---

## 18. Tiga UI Surface

Dokumen ini hanya menetapkan fungsi UI. Layout, component system, visual hierarchy, charts, spacing, dan detail design sengaja tidak dikunci agar implementation/design agent tetap mempunyai ruang eksplorasi.

### 18.1 Inomasa Home / Economy View

Untuk observer yang diberi izin, termasuk calon reviewer atau tim Arc.

Harus dapat memperlihatkan secara understandable:

- Business yang telah dibuat;
- Agent activity;
- recent economic activity;
- payment/job activity;
- success/failure/pending/unknown status;
- Capital activity ketika ada;
- standards/primitives yang benar-benar digunakan;
- proof link bila tersedia.

Standard badge bersifat dinamis.

Contoh:

```text
x402
ERC-8004
ERC-8183
```

Hanya standard yang benar-benar terlibat pada activity atau Business context tersebut yang ditampilkan.

Jika suatu activity mempunyai real Arc transaction, UI dapat menyediakan `View on ArcScan`.

Jika tidak ada individual Arc transaction hash, UI tidak membuat link palsu. Sebagai gantinya tampilkan `View Proof` atau technical detail yang sesuai dengan sumber buktinya.

### 18.2 Business Workspace

Untuk user mengelola Business mereka.

Fungsi utama mencakup:

- Business overview;
- products/services;
- Agents;
- commerce/jobs;
- Treasury;
- activity/history;
- Capital;
- Business Site/settings.

### 18.3 Founder / System Dashboard

Untuk operator/founder Inomasa melihat sistem secara keseluruhan.

Fungsinya adalah observability dan evaluasi, bukan mengelola satu Business.

Data yang berguna dapat mencakup:

- jumlah Business/Agent/activity;
- protocol usage;
- USDC volume;
- success/failure/pending/unknown outcomes;
- job outcomes;
- Capital activity;
- revenue/cost classification;
- provider/runtime errors yang relevan;
- economic activity drill-down.

Tidak perlu full BI platform pada Alpha. Data dasar yang benar dan contextual lebih penting daripada banyak chart.

---

## 19. Activity Status & Proof

Normal activity status minimal harus mampu membedakan:

- `SUCCESS` / `COMPLETE`;
- `FAILED`;
- `PENDING`;
- `OUTCOME_UNKNOWN`.

`OUTCOME_UNKNOWN` tidak boleh otomatis diperlakukan sebagai failure karena external effect mungkin sudah terjadi.

Activity detail harus dapat menunjukkan konteks yang cukup untuk evaluasi, misalnya:

- Business;
- Agent;
- counterparty;
- service/job;
- amount;
- protocol;
- economic classification;
- provider/contract/chain reference;
- failure reason bila ada;
- proof/source.

UI tidak perlu menampilkan seluruh fields tersebut sekaligus di halaman utama.

---

## 20. Business Site, Home, dan Observability pada Hosting Alpha

Seluruh Business Site dan UI surface berada dalam **satu aplikasi Inomasa**.

Tidak ada satu deployment Vercel per Business.

Business baru menghasilkan data/route baru di aplikasi yang sama.

Ini menjaga Alpha ringan untuk current hosting profile dan menghindari per-Business infrastructure.

Production-scale hosting/business model bukan bagian dari scope dokumen ini dan dapat berubah setelah Alpha proof.

---

## 21. Test Fixture Strategy

Test fixtures dibuat **setelah generic system capability tersedia**.

Current fixtures seperti Signal Forge dan Ops Pilot dapat dipertahankan untuk regression dan dapat diadaptasi ke sistem generic.

Test population tidak dikunci menjadi jumlah user tertentu.

Jumlah fixture ditentukan oleh kebutuhan proof.

### 21.1 Reference Economy

Setelah generic system siap, Alpha membuat mini economy yang sengaja memaksa primitive diperlukan.

Contoh bentuk, bukan hardcoded product model:

```text
Business instance from API/Data template
      ↓ x402
Business instance from SaaS template
      ↓ ERC-8183
Business instance from Agent-as-a-Service template
      ↕ evaluation / feedback
Business instance from Web3-native template

ERC-8004 identities connect relevant Agents
```

Capital Providers kemudian dapat menggunakan Economic History yang dihasilkan untuk controlled Capital proof.

### 21.2 Honesty

Semua common-control fixtures tetap diberi provenance yang benar.

Test economy adalah proof of system behavior, bukan proof of organic demand.

---

## 22. Alpha Proof Contract

Alpha tidak dinyatakan selesai hanya karena halaman dan API tersedia.

### 22.1 Generic System Proof

Buat Business baru dari salah satu template yang tidak bergantung pada fixture lama.

Proof harus menunjukkan bahwa Business instance baru dapat memperoleh core Business Package tanpa perubahan kode khusus untuk Business tersebut.

### 22.2 BUILD Proof

User dapat:

```text
Create Business
  → receive Business Workspace / Site
  → add Product or Service
  → add Agent
  → enable relevant commerce
  → perform economic activity
  → view resulting history
```

### 22.3 Agent Proof

- Business dapat mempunyai multiple Agent secara generic;
- relevant Agent memakai ERC-8004;
- Business↔Agent relation jelas;
- Agent identity digunakan pada economic action nyata.

### 22.4 x402 Proof

At least one real Arc Testnet machine-service flow:

```text
request → 402/payment requirement → authorized payment → settlement → delivery
```

No duplicate payment/delivery pada replay.

### 22.5 ERC-8183 Proof

At least one real funded job:

```text
create → fund → work → submit → evaluate → complete/reject/expire → payout/refund
```

### 22.6 Onchain Proof

USDC benar-benar berpindah atau terkunci di Arc Testnet sesuai flow yang diuji.

### 22.7 Economic History Proof

System dapat merekonstruksi:

- who/which Business;
- which Agent;
- what service/job;
- counterparty;
- amount;
- protocol;
- outcome;
- economic interpretation;
- provenance.

Tanpa double-count.

### 22.8 CAPITAL Proof

Beberapa Capital Provider fixture dapat melihat Business yang sama dan boleh menghasilkan keputusan berbeda.

At least one controlled allocation:

```text
Capital → Business → subsequent economic use → later outcome
```

Capital tetap diklasifikasikan sebagai Capital.

### 22.9 MIGRATE Boundary Proof

Tidak ada live migration wajib.

Proof cukup menunjukkan bahwa:

- entry/origin model mendukung future MIGRATE;
- UI capability ada tetapi locked;
- core Business System tidak perlu digandakan saat MIGRATE dibuka.

### 22.10 Product Experience Proof

Seorang observer yang diberi akses dapat memahami aktivitas utama dari Inomasa Home tanpa harus membaca raw database atau ArcScan terlebih dahulu.

ArcScan/technical proof tetap tersedia untuk verifikasi ketika relevan.

---

## 23. Adversarial & Correctness Tests

Minimum correctness:

- duplicate x402 request;
- repeated reconciliation;
- duplicate job completion;
- duplicate service delivery;
- wrong actor;
- expired/revoked scope;
- insufficient balance/funding;
- provider `PENDING`;
- provider `FAILED`;
- ambiguous provider outcome;
- refund;
- duplicate economic posting;
- Capital inflow classification;
- chain/provider temporary failure;
- invalid common-control independence claim.

Economic-truth tests tidak perlu menjadi fraud engine penuh.

Tujuannya memastikan sistem tidak menyamarkan:

- self/common-control activity;
- reciprocal activity;
- common-control feedback;
- self-funded Capital;
- synthetic demand;
- imported/future external data provenance.

---

## 24. Data & Persistence Direction

Dokumen ini tidak mengunci DDL final.

Persistence harus cukup untuk mendukung:

### Business
- users/principals;
- Business templates;
- Business instances;
- Business origin/entry route;
- Business Site/content configuration;
- products/services.

### Agent
- Agent relation ke Business;
- capability/role;
- ERC-8004 references;
- relevant feedback/validation references.

### Commerce
- x402 payment references;
- service purchase/delivery;
- ERC-8183 job references;
- deliverable/outcome references;
- direct settlement references bila digunakan.

### Economics
- exact economic entries;
- classification;
- Capital allocation/use;
- provenance;
- reconciliation state.

### Observability
- activity status;
- protocol/standards used;
- source of truth;
- external reference;
- failure/unknown context.

Database tidak menjadi clone seluruh state external protocol. Persist hanya references, observed state yang dibutuhkan product/reconciliation, Business context, dan provenance.

---

## 25. Wallet & Execution Account Direction

Business ≠ wallet.<br>
Agent ≠ wallet.

Wallet/account adalah execution capability.

Practical Alpha direction:

- pertahankan verified Circle EOA path untuk flow yang sudah bekerja;
- reuse account profile bila compatible dengan primitive baru;
- gunakan SCA/other Circle account capability hanya bila official implementation atau product need memang memerlukannya;
- jangan expose account topology sebagai complexity normal user;
- jangan membuat custom custody/control machinery jika provider/standard sudah memenuhi kebutuhan Alpha.

Secrets tidak boleh masuk Git, docs, logs, UI, atau public output.

---

## 26. Implementation Sequence

Tidak membuat roadmap B6/B7/B8 baru. Seluruh pekerjaan ini adalah satu Alpha realization program dengan checkpoint kecil.

### Checkpoint A — Product authority & genericization entry

- Concept & Architecture menjadi product/architecture basis;
- Alpha Realization REV2 menjadi implementation guide;
- current working x402/settlement baseline tetap regression control;
- stale continuation yang mengasumsikan fixed fixture/Capital-next dibereskan;
- tidak ada authority vacuum.

### Checkpoint B — Generic Business System

- user/business multiplicity;
- four Business Templates;
- reusable Business instance creation;
- Business Package;
- Business Site;
- MIGRATE locked boundary.

### Checkpoint C — Generic Agent + ERC-8004

- Agent system tidak hardcoded;
- ERC-8004 registration/identity;
- Business↔Agent context;
- economic-action linkage.

### Checkpoint D — Commerce primitives

- current x402 remains PASS;
- generic x402 service capability;
- ERC-8183 job capability;
- accounting/reconciliation integration.

### Checkpoint E — Economic History + UI observability

- contextual activity model;
- Home / Economy View;
- Business Workspace;
- Founder/System Dashboard;
- dynamic standards badges;
- proof/ArcScan linkage;
- status including failure/pending/unknown.

UI design details tetap dibuka untuk design/engineering exploration.

### Checkpoint F — Generic CAPITAL

- multi-provider system capability;
- provider-specific decision paths;
- correct Capital accounting;
- Capital-to-later-activity linkage.

### Checkpoint G — Reference Economy & Proof Fixtures

- create enough fresh users/Business instances/Agents/providers to exercise system;
- prove composition ERC-8004 + x402 + ERC-8183;
- prove Capital loop;
- keep common-control labels.

### Checkpoint H — Integrated Verification

- adversarial/correctness tests;
- full regression;
- protected Preview;
- runtime observation;
- clean accepted code state;
- proof matrix PASS.

Urutan teknis di dalam checkpoint boleh dioptimalkan oleh engineering agent selama tidak mengubah target proof.

---

## 27. Deployment & Environment

Primary environment:

`PRIVATE_ARC_TESTNET`

Arc Testnet/USDC registry values, ERC-8004 deployment, ERC-8183 implementation, Circle SDK/provider behavior, dan x402 specifics harus diverifikasi kembali terhadap official source tepat sebelum implementation/execution yang relevan.

Protected Vercel Preview tetap menjadi default hosted surface selama Alpha.

Requirements:

- no accidental Production exposure;
- Preview protection tetap aktif;
- no secret exposed to browser;
- temporary provider bypass dibersihkan setelah proof;
- significant external integration diikuti runtime/log observation;
- satu aplikasi Inomasa melayani seluruh Business Site.

Environment-specific workaround tidak boleh diubah menjadi permanent architecture tanpa alasan.

---

## 28. Completion Gate

Target completion status:

**CONTROLLED ARC TESTNET PRODUCT ALPHA — VERIFIED**

Current status:

**IN PROGRESS — Checkpoints A-C complete; Checkpoints D-H are not verified.**

Target completion status hanya diberikan jika seluruh area berikut PASS.

### System
- generic N-user/N-Business model;
- four reusable Business Templates;
- fresh Business instance creation tanpa code customization;
- reusable Agent and commerce capability;
- MIGRATE boundary ready and locked.

### Agentic Economy
- ERC-8004 Agent identity digunakan pada real activity;
- x402 real machine payment PASS;
- ERC-8183 real job settlement PASS;
- primitives terhubung ke Business context.

### Product
- Business Workspace usable;
- Business Site generated dari system;
- Inomasa Home memperlihatkan ekonomi secara understandable;
- Founder/System Dashboard memberi data evaluasi;
- Business/activity standards badges accurate;
- success/failure/pending/unknown dapat diamati;
- proof link tersedia sesuai source.

### Economics
- exact USDC accounting;
- Revenue/Cost/Refund/Capital semantics correct;
- no duplicate posting;
- Economic History reconstructable;
- Capital loop terbukti;
- common-control/synthetic provenance tetap terlihat.

### Safety & Correctness
- replay/idempotency PASS;
- ambiguous outcome no-blind-retry PASS;
- invalid/expired/revoked actions fail correctly;
- secrets remain non-public;
- protected Preview remains protected.

### Engineering
- lint PASS;
- typecheck PASS;
- tests PASS;
- production build PASS;
- migrations/db verification PASS;
- dependency audit reviewed;
- accepted code state clean;
- hosted Preview observed.

---

## 29. Non-Goals Alpha

Alpha tidak perlu menjadi:

- public product;
- production/mainnet environment;
- full Wix/Shopify replacement;
- full website builder;
- full MIGRATE connector ecosystem;
- public marketplace besar;
- generalized workflow engine;
- custom identity protocol;
- custom universal reputation system;
- custom escrow protocol bila ERC-8183 cukup;
- universal fraud detector;
- production KYC/KYB stack;
- final legal/Capital product;
- autonomous company operating without human boundary;
- multi-chain platform;
- high-scale analytics/BI system;
- mobile native app;
- multi-region production infrastructure.

---

## 30. External Reference Registry

Bagian ini adalah implementation reference. Nilai yang cepat berubah tidak menjadi Concept invariant.

### Arc Agentic Economy

Official Arc documentation harus menjadi primary implementation reference untuk:

- ERC-8004 on Arc;
- ERC-8183 on Arc;
- x402 / Nanopayments;
- Circle wallet/account examples;
- Agentic Economy patterns.

### Arc / Circle network capability

Arc Testnet, USDC, deterministic settlement, Circle Wallets/Gateway, dan provider details diverifikasi pada saat implementation.

### Repository truth

Current implementation/evidence source tetap:

- accepted GitHub `main`;
- `PROJECT_STATE.md`;
- active engineering/Alpha execution records;
- migrations;
- tests;
- CI;
- provider/chain evidence.

Chat history tidak menggantikan accepted engineering evidence.

---

## 31. Ringkasan Realisasi

Alpha Inomasa dibangun sebagai sistem reusable, bukan demo ekonomi yang di-hardcode.

```text
User
  ↓
BUILD
  ↓
4 Business Templates
  ↓
N Business Instances
  ↓
Business Package
  ├─ Workspace
  ├─ Business Site
  ├─ Products / Services
  ├─ Agents
  ├─ Treasury
  ├─ Commerce / Jobs
  ├─ Economic History
  └─ Capital Profile

Agentic Commerce
  ├─ ERC-8004
  ├─ x402
  └─ ERC-8183

      ↓
Arc / USDC
      ↓
Economic History
      ↓
Capital Providers
      ↓
Later Business Activity
```

MIGRATE tetap terlihat sebagai jalur masa depan tetapi belum dibuka.

Setelah system capability selesai, test fixtures dibuat sebanyak yang dibutuhkan untuk memaksa primitive dan Business architecture berinteraksi. Dari sana Inomasa dapat diuji dengan model Business, aktor, dan serangan yang semakin luas tanpa harus mengubah fondasi setiap kali test population berubah.

Tujuan Alpha bukan membangun sistem paling besar. Tujuannya adalah membangun **Inomasa yang benar-benar generik secara produk, nyata secara onchain execution, mudah diamati, dan cukup terbuka untuk membuktikan tesisnya sebelum akses eksternal dibuka.**
