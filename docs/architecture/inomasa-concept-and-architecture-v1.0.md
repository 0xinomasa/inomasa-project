# Inomasa Concept & Architecture v1.0

**Bahasa:** Indonesia<br>
**Status:** `ACCEPTED / ACTIVE` — product and system-architecture authority<br>
**Engineering provenance:** Copy pada accepted GitHub `main` adalah normative engineering copy. Copy Second Brain adalah curated mirror / working source; perubahan baru memperoleh engineering authority setelah diterima ke GitHub `main`.<br>
**Ruang lingkup:** Konsep, filosofi, model produk, prinsip sistem, dan arsitektur tingkat sistem Inomasa. Detail implementasi, spesifikasi fase, skema data, kontrak, API, deployment, acceptance criteria, dan bukti pengujian berada pada dokumen Implementation & Realization yang terpisah.

---

## 1. Executive Concept

Inomasa adalah platform **Agentic Commerce** di atas Arc dan ekosistem Circle yang membantu orang membangun bisnis baru, mengembangkan bisnis yang sudah berjalan dengan bantuan AI agent, dan menghubungkan aktivitas bisnis tersebut dengan ekonomi onchain serta partisipasi modal.

Gagasan dasarnya sederhana: semakin banyak fungsi bisnis dapat dibantu atau dijalankan oleh AI agent, tetapi agent saja tidak membentuk sebuah bisnis. Sebuah bisnis tetap membutuhkan produk atau layanan, pelanggan, operasi, pemasok, pembayaran, keputusan, treasury, riwayat ekonomi, dan pihak yang bertanggung jawab. Inomasa menyediakan lingkungan tempat unsur-unsur tersebut dapat bekerja sebagai satu sistem.

Inomasa memiliki tiga kemampuan utama yang berada dalam satu rumah produk:

- **BUILD**, untuk membangun dan mengoperasikan bisnis baru dengan kemampuan agentic sejak awal.
- **MIGRATE**, untuk menghubungkan bisnis yang sudah ada ke lingkungan agentic dan onchain tanpa mewajibkan penggantian seluruh sistem yang masih berguna.
- **CAPITAL**, untuk membuka hubungan antara bisnis dan penyedia modal melalui informasi operasional dan ekonomi yang dapat ditelusuri serta mekanisme onchain yang dapat diprogram.

Arc menjadi fondasi ekonomi dan eksekusi onchain. USDC menjadi unit moneter utama. Infrastruktur Circle digunakan untuk kemampuan wallet, payment, signing, dan fungsi finansial lain yang relevan. Di atas fondasi tersebut, Inomasa menggunakan primitive Agentic Economy seperti **ERC-8004**, **x402**, dan **ERC-8183** sesuai fungsi masing-masing: identitas dan interoperabilitas agent, pembayaran machine-to-machine, serta pekerjaan terprogram dengan escrow dan evaluator.

Nilai Inomasa bukan pada membangun ulang blockchain, wallet infrastructure, payment protocol, atau agent standard yang sudah tersedia. Nilainya berada pada lapisan bisnis: bagaimana seseorang dapat menciptakan atau menghubungkan bisnis, bagaimana agent bekerja di dalam konteks bisnis, bagaimana bisnis menjual dan membeli layanan, bagaimana aktivitas ekonomi membentuk riwayat yang dapat diperiksa, dan bagaimana modal dapat berinteraksi dengan bisnis tanpa memisahkan dunia operasi dari dunia finansial.

Secara posisi, Arc dapat dipahami sebagai economic execution foundation, sedangkan Inomasa adalah application layer yang mengubah fondasi tersebut menjadi **business operating environment untuk Agentic Commerce**.

---

## 2. Problem & Opportunity

AI agent berkembang dari sekadar antarmuka percakapan menjadi software actor yang dapat melakukan pekerjaan: mencari informasi, menulis dan mengirim komunikasi, membuat konten, menggunakan tool, membeli resource, menjalankan analisis, mengatur workflow, mengeksekusi tugas berulang, dan berkoordinasi dengan software lain. Perubahan ini membuka kemungkinan bahwa sebuah bisnis dapat dijalankan oleh kombinasi manusia dan agent dengan tingkat otomatisasi yang jauh lebih tinggi dibanding software bisnis tradisional.

Namun kemampuan tersebut masih tersebar di banyak lapisan yang tidak selalu terhubung. Platform pembuat bisnis berbasis AI dapat membantu founder memulai operasi, tetapi aktivitas ekonominya umumnya tetap berada di payment stack yang terpisah dari agent. Marketplace agent dapat membantu discovery, tetapi tidak mengelola bisnis sebagai objek ekonomi yang utuh. Blockchain dapat menyediakan settlement dan programmable assets, tetapi pengalaman produknya sering masih terlalu dekat dengan mental model developer atau crypto user. Sistem pembiayaan dapat menyediakan modal, tetapi sering bergantung pada data yang berasal dari proses operasional lain dan sulit diverifikasi secara langsung.

Masalah utamanya bukan kekurangan satu fitur. Masalahnya adalah **fragmentasi antara bisnis, agent, commerce, onchain execution, dan capital**.

### 2.1 Membangun bisnis masih terpisah dari kemampuan agentic

Membuat bisnis baru tetap memerlukan banyak pekerjaan yang tersebar: menentukan produk, membuat kanal penjualan, menjalankan marketing, mengelola pelanggan, melakukan procurement, membayar layanan, dan memonitor kondisi keuangan. AI dapat membantu masing-masing aktivitas, tetapi tanpa lingkungan bisnis yang menyatukannya, founder tetap harus merangkai banyak tool secara manual.

Inomasa melihat peluang untuk membuat agent bukan sekadar fitur tambahan, tetapi bagian dari tenaga operasional bisnis. Seorang pengguna seharusnya dapat memulai dari sebuah Business dan kemudian menambahkan kemampuan agentic sesuai kebutuhan, tanpa harus memahami seluruh arsitektur di bawahnya.

### 2.2 Bisnis yang sudah berjalan tidak seharusnya dipaksa memulai ulang

Banyak bisnis existing sudah mempunyai website, aplikasi, database, CRM, accounting, GitHub, cloud infrastructure, smart contract, payment processor, pelanggan, dan riwayat operasional. Nilai dari sistem agentic baru akan berkurang jika adopsinya mengharuskan semua aset tersebut diganti.

Karena itu, peluang besar tidak hanya berada pada penciptaan bisnis baru. Ada ruang untuk **menghubungkan bisnis yang sudah berjalan**, memberi mereka agent, machine commerce, onchain settlement, dan kemampuan finansial baru secara bertahap.

### 2.3 Agentic Commerce membutuhkan lebih dari sekadar pembayaran

Tidak semua commerce mempunyai bentuk yang sama. Sebagian aktivitas hanya membutuhkan pembayaran instan untuk resource seperti API, data, compute, atau inference. Aktivitas lain berbentuk pekerjaan dengan scope, budget, deliverable, evaluasi, dan kemungkinan refund. Agent juga membutuhkan cara untuk dikenali dan berinteraksi lintas aplikasi.

Karena itu, Inomasa tidak mencoba memaksakan satu model transaksi untuk seluruh ekonomi agentic. Arsitekturnya menggabungkan beberapa primitive yang saling melengkapi dan membawanya ke dalam konteks Business.

### 2.4 Onchain membuka hubungan baru antara operasi bisnis dan modal

Aktivitas bisnis tradisional sering menghasilkan data yang tersebar di sistem tertutup. Ketika sebagian aktivitas ekonomi penting berjalan melalui settlement onchain, programmable commitments, dan primitive yang dapat diperiksa, bisnis memperoleh **economic footprint** yang lebih mudah ditelusuri lintas pihak.

Hal ini tidak berarti bahwa “onchain = benar”. Settlement onchain hanya membuktikan hal yang memang dibuktikan oleh settlement. Tetapi kombinasi antara onchain execution, provenance, business context, dan operating history menciptakan dasar yang lebih baik untuk hubungan ekonomi berikutnya, termasuk Capital.

Modal dapat berinteraksi dengan bisnis melalui terms, allocation, settlement, dan monitoring yang lebih programmable, tanpa seluruh hubungan harus bergantung pada laporan manual yang terpisah dari operasi. Inilah salah satu alasan onchain merupakan bagian struktural Inomasa, bukan sekadar pilihan teknologi.

### 2.5 Peluang Inomasa

Peluang Inomasa adalah menyatukan pola-pola yang sudah terbukti berguna di beberapa dunia berbeda: kemudahan software bisnis Web2, kemampuan AI agent untuk menjalankan pekerjaan, keterbukaan dan settlement dari Web3, serta infrastructure Arc/Circle untuk programmable economic activity.

Tujuannya bukan membuat “versi blockchain” dari satu produk existing. Tujuannya adalah membangun business environment yang sejak awal menganggap manusia, agent, layanan digital, settlement onchain, dan modal sebagai bagian dari ekonomi yang sama.

---

## 3. Inomasa Philosophy

Filosofi Inomasa berangkat dari pertanyaan yang lebih besar daripada pilihan framework atau protocol: **bagaimana teknologi dapat membuat lebih banyak orang mampu membangun, menjalankan, dan menumbuhkan bisnis dengan bantuan AI, sementara aktivitas ekonominya dapat memperoleh manfaat dari sistem onchain yang terbuka dan programmable?**

Arsitektur Inomasa diturunkan dari jawaban terhadap pertanyaan tersebut.

### 3.1 Membuat kemampuan membangun bisnis semakin terbuka

Membangun bisnis biasanya membutuhkan kombinasi modal, keahlian, waktu, tenaga operasional, dan akses ke berbagai fungsi yang tidak dimiliki semua orang sejak awal. AI agent dapat mengurangi sebagian hambatan tersebut dengan menyediakan tenaga digital yang dapat membantu research, marketing, sales, operations, development, finance, support, dan fungsi lainnya.

Inomasa ingin membuat seseorang dapat memulai dari ide atau kebutuhan pasar, membentuk sebuah Business, lalu secara bertahap menambahkan agent, layanan, dan infrastruktur sampai bisnis tersebut benar-benar dapat beroperasi.

Fokusnya bukan membuat founder menghilang dari bisnis. Fokusnya adalah **memperbesar leverage manusia**. Satu orang atau tim kecil dapat mengoperasikan sistem yang sebelumnya membutuhkan lebih banyak koordinasi manual, sementara keputusan strategis dan batas-batas penting tetap dapat berada pada manusia.

### 3.2 AI adalah tenaga operasional, Business tetap menjadi pusat

Agent bukan tujuan akhir Inomasa. Nilai ekonomi lahir ketika agent membantu Business menghasilkan produk, layanan, penjualan, pekerjaan, efisiensi, atau aktivitas lain yang mempunyai dampak nyata.

Karena itu, Inomasa berpusat pada Business, bukan pada agent sebagai aset spekulatif atau identitas utama platform. Business menyediakan konteks: siapa yang mengendalikan, apa yang dijual, siapa counterparty-nya, agent bekerja untuk tujuan apa, uang masuk sebagai apa, dan bagaimana aktivitas hari ini memengaruhi kondisi bisnis besok.

Agent dapat datang dan pergi, framework dapat berubah, model AI dapat diganti, dan satu Business dapat menggunakan banyak agent dari berbagai sumber. Selama konteks Business tetap utuh, perubahan teknologi tersebut tidak harus mengubah identitas ekonomi bisnis.

### 3.3 Onchain adalah lapisan ekonomi, bukan dekorasi produk

Inomasa menggunakan onchain bukan untuk membuat setiap data bisnis publik dan bukan untuk memberi label “Web3” pada aplikasi. Onchain digunakan ketika memberikan nilai struktural: settlement yang dapat diperiksa, programmable commitments, escrow, interoperabilitas, ownership atau control yang relevan, dan hubungan ekonomi yang dapat berinteraksi dengan pihak lain tanpa bergantung pada satu database tertutup.

Bagi Inomasa, nilai utama onchain adalah kemampuannya menjadi **shared economic substrate**. Ketika pembayaran, job escrow, capital allocation, dan komitmen ekonomi penting dapat berjalan pada fondasi yang sama, Business, Agent, customer, provider, evaluator, dan Capital Provider dapat berinteraksi melalui state yang lebih mudah diverifikasi dan dikomposisikan.

Ini juga menciptakan jembatan alami menuju Capital. Modal tidak perlu diperlakukan sebagai modul yang terpisah sepenuhnya dari aktivitas bisnis. Capital dapat masuk ke sistem yang sama, berinteraksi melalui USDC dan programmable terms, lalu dampak penggunaannya dapat kembali terlihat dalam economic history Business.

### 3.4 Bisnis baru dan bisnis existing harus dapat hidup dalam sistem yang sama

Agentic economy tidak akan berkembang hanya dari bisnis yang lahir setelah teknologi agent tersedia. Sebagian besar nilai ekonomi masih berada pada bisnis yang sudah mempunyai pengguna, sistem, data, produk, dan proses sendiri.

Karena itu Inomasa memandang BUILD dan MIGRATE sebagai dua jalan menuju rumah yang sama. BUILD memulai dari nol. MIGRATE memulai dari sesuatu yang sudah ada. Keduanya harus dapat berakhir pada lingkungan operasi yang sama tanpa memaksa existing business kehilangan identitas atau sistem yang masih berguna.

Filosofi ini membuat Inomasa tidak terbatas pada satu generasi bisnis. Bisnis Web2, bisnis Web3, bisnis digital tradisional, dan bisnis machine-native dapat berpartisipasi selama hubungan dan aktivitas ekonominya dapat dimodelkan secara jelas.

### 3.5 Riwayat ekonomi lebih penting daripada klaim

Bisnis selalu menghasilkan cerita tentang dirinya: revenue, pertumbuhan, kualitas, demand, kemampuan agent, atau performa. Tetapi keputusan bernilai tinggi seharusnya tidak hanya bergantung pada cerita.

Inomasa ingin membuat aktivitas ekonomi semakin sulit dipalsukan, semakin mudah diperiksa, dan semakin aman diinterpretasi. Ini tidak berarti Inomasa menciptakan “kebenaran universal”. Sebaliknya, sistem menjaga konteks dan provenance sehingga pihak lain dapat menilai informasi dengan memahami apa yang sebenarnya terbukti dan apa yang masih merupakan interpretasi.

Prinsip ini menjadi penghubung antara operasi dan Capital. Modal dapat menggunakan riwayat bisnis sebagai decision material, tetapi tidak ada satu score yang otomatis mengubah aktivitas masa lalu menjadi hak memperoleh pendanaan.

### 3.6 Kompleksitas berada di bawah permukaan

Inomasa dapat menggunakan blockchain, smart contract, wallet infrastructure, agent identity, payment protocol, escrow, policy, dan berbagai sistem eksternal. Pengguna tidak seharusnya dipaksa mempelajari semua itu untuk menjalankan bisnis.

Product experience harus tetap berbicara dalam bahasa bisnis: buat bisnis, tambahkan agent, jual layanan, beli resource, buat pekerjaan, terima pembayaran, lihat aktivitas, hubungkan sistem, dan alokasikan modal.

Arsitektur yang baik bukan arsitektur yang paling terlihat oleh pengguna. Arsitektur yang baik adalah yang membuat kemampuan kompleks terasa sederhana tanpa menyembunyikan risiko atau makna ekonomi yang material.

### 3.7 Inomasa adalah bagian dari ekosistem terbuka

Inomasa tidak dimaksudkan menjadi silo yang memiliki versi internal dari setiap agent, wallet, payment rail, marketplace, atau protocol. Sistem harus mampu menggunakan primitive terbaik dari Arc/Circle dan standar Agentic Economy, serta terhubung ke layanan Web2 dan Web3 lain ketika mereka lebih tepat untuk suatu fungsi.

Diferensiasi Inomasa berada pada kemampuan mengubah komponen-komponen tersebut menjadi pengalaman bisnis yang koheren. Dengan pendekatan ini, perkembangan ekosistem menjadi leverage bagi Inomasa, bukan ancaman terhadap arsitektur yang terlalu tertutup.

---

## 4. Product Model: BUILD, MIGRATE, CAPITAL

BUILD, MIGRATE, dan CAPITAL adalah tiga kemampuan utama Inomasa. Mereka bukan tiga aplikasi yang berdiri sendiri, tetapi tiga cara Business masuk, berkembang, dan memperoleh kemampuan baru di dalam satu business operating environment.

```text
                    INOMASA
        Business Operating Environment

       ┌──────────┬───────────┬───────────┐
       │  BUILD   │  MIGRATE  │  CAPITAL  │
       └──────────┴───────────┴───────────┘
             │          │           │
             └────── Business ──────┘
                        │
       Human · Agent · Product · Service · Job
          Commerce · Treasury · Economic History
                        │
              Arc / USDC / Circle
```

### 4.1 BUILD

BUILD membantu pengguna menciptakan bisnis baru dan membuatnya semakin operasional dengan bantuan AI agent. Pengguna dapat memulai dari struktur minimum, lalu menambahkan produk atau layanan, agent, workflow, integrations, treasury, dan commerce sesuai kebutuhan.

BUILD tidak mengharuskan sebuah bisnis menjadi autonomous sejak hari pertama. Sebuah Business dapat dimulai secara manual, berkembang menjadi semi-autonomous, dan kemudian memberi agent ruang yang lebih besar ketika bisnis, operator, dan sistem sudah mempunyai cukup kepercayaan operasional.

Tujuan BUILD adalah memperpendek jarak antara “saya ingin membuat bisnis” dan “bisnis ini sudah dapat menghasilkan dan menjalankan aktivitas ekonomi”.

### 4.2 MIGRATE

MIGRATE membawa bisnis existing ke lingkungan Inomasa melalui pendekatan non-invasif. Inomasa menghubungkan sistem yang sudah ada, memahami peran dan sumber datanya, lalu menambahkan kemampuan agentic dan onchain secara bertahap.

Website, database, CRM, accounting, GitHub, cloud infrastructure, smart contract, payment processor, atau sistem lain dapat tetap digunakan. Inomasa tidak mengklaim kepemilikan atas data atau state yang tetap berasal dari external system tersebut.

MIGRATE memungkinkan bisnis memperoleh nilai dari agent orchestration, machine commerce, onchain settlement, economic history, dan Capital tanpa harus “lahir kembali” sebagai bisnis baru.

### 4.3 CAPITAL

CAPITAL membuka hubungan antara Business dan pihak yang menyediakan modal. Bentuk modal dapat berkembang sesuai kebutuhan produk, struktur provider, dan konteks legal, tetapi prinsipnya konsisten: keputusan modal harus mempunyai pihak yang jelas sebagai risk bearer dan harus dapat menggunakan informasi bisnis yang relevan tanpa menjadikan satu score sebagai otoritas universal.

Karena Inomasa memiliki lapisan ekonomi onchain, Capital dapat terhubung langsung dengan Business melalui programmable terms, USDC flows, allocation, monitoring, dan outcome yang berada dalam konteks ekonomi yang sama. Onchain tidak menghilangkan kebutuhan underwriting atau legal structure, tetapi mengurangi jarak antara keputusan modal dan aktivitas ekonomi yang didanainya.

### 4.4 Satu Business, banyak kemampuan

Business yang dibuat lewat BUILD dapat kemudian menerima Capital. Business yang masuk lewat MIGRATE dapat menggunakan agent dan commerce yang sama dengan Business baru. Sebuah Business dapat pula beroperasi tanpa Capital sama sekali.

Dengan demikian BUILD, MIGRATE, dan CAPITAL tidak membentuk tiga silo data atau tiga definisi Business. Mereka berbagi satu business context dan satu economic history, sementara tetap mempertahankan aturan dan tanggung jawab yang berbeda untuk setiap jenis aktivitas.

---

## 5. Economic & Agentic Model

Inomasa memodelkan Agentic Commerce sebagai hubungan antara manusia, Business, Agent, layanan, pekerjaan, transaksi, dan modal. Model ini sengaja berpusat pada aktivitas ekonomi, bukan hanya objek teknis.

### 5.1 Human

Manusia dapat berperan sebagai founder, operator, customer, evaluator, provider, atau Capital Provider. Satu orang dapat mempunyai lebih dari satu peran, tetapi tindakan bernilai tinggi harus tetap dapat dikaitkan dengan konteks dan kewenangan yang sesuai.

Human control tidak berarti semua aksi harus menunggu approval manual. Artinya sistem dapat membedakan antara keputusan yang didelegasikan kepada agent dan keputusan yang tetap berada pada manusia.

### 5.2 Business

Business adalah unit koordinasi utama Inomasa. Sebuah Business menghubungkan identitas aplikasi, manusia, agent, produk atau service, workflow, treasury, transaksi, jobs, integrations, economic history, dan Capital context.

Business tidak harus sama dengan satu wallet, satu smart contract, satu legal entity, atau satu agent. Pemisahan ini memungkinkan Business berkembang tanpa identitasnya terikat pada satu implementasi teknis.

### 5.3 Agent

Agent adalah software actor yang dapat melakukan reasoning, mengambil tugas, memakai tool, berinteraksi dengan layanan, berkomunikasi dengan agent lain, atau mengeksekusi tindakan dalam ruang yang diberikan.

Untuk agent yang berpartisipasi dalam onchain Agentic Commerce, **ERC-8004 menjadi default identity dan interoperability anchor ketika sesuai**. Inomasa dapat menyimpan identifier internal untuk kebutuhan aplikasi, tetapi tidak perlu menciptakan sistem identitas onchain pesaing hanya untuk mengulang fungsi yang sudah tersedia.

Inomasa tetap menambahkan business context yang tidak dimiliki registry: agent bekerja untuk Business mana, mempunyai role apa, service apa yang disediakan, dan kemampuan ekonomi apa yang diberikan kepadanya.

### 5.4 Product & Service

Business dapat menjual produk atau layanan digital, API, data, software capability, content, analysis, compute, automation, atau output lain. Service dapat diberikan langsung oleh Business, oleh Agent, atau melalui provider eksternal.

Model commerce ditentukan oleh sifat aktivitasnya. Pembelian instan mempunyai kebutuhan berbeda dari pekerjaan yang membutuhkan evaluasi setelah deliverable diserahkan.

### 5.5 Job

Job adalah pekerjaan dengan scope, budget, dan deliverable yang cukup jelas untuk diperlakukan sebagai komitmen terpisah. Untuk pola ini, ERC-8183 memberikan primitive yang sesuai untuk funding, escrow, submission, evaluation, payment, atau refund.

### 5.6 Treasury and Economic Activity

Business mempunyai hubungan dengan wallet atau treasury yang digunakan untuk menerima dan mengeluarkan value. Treasury adalah bagian dari operasi Business, bukan identitas Business itu sendiri.

Economic activity mencakup revenue, cost, payment, refund, job settlement, capital inflow, capital deployment, dan perubahan ekonomi material lainnya. Aktivitas tersebut membentuk history yang dapat digunakan kembali untuk operasi, analisis, dan Capital context.

---

## 6. Arc & Circle Foundation

Inomasa dibangun dengan Arc dan Circle sebagai fondasi ekonomi yang disengaja. Product model tidak dirancang secara netral lalu ditempelkan ke chain pada tahap akhir.

### 6.1 Arc sebagai economic execution environment

Arc menjadi lingkungan utama untuk settlement dan onchain economic execution Inomasa. Ketika sebuah pembayaran, escrow, commitment, atau economic state memperoleh manfaat dari shared execution dan verifiability, Arc menyediakan fondasi tempat aktivitas tersebut dijalankan.

Peran Arc berbeda dari peran Inomasa. Arc menyediakan execution environment dan financial rails. Inomasa menyediakan Business context, product experience, agentic operation, migration, economic history, dan Capital coordination di atasnya.

### 6.2 USDC sebagai monetary foundation

USDC menjadi unit moneter utama untuk harga, pembayaran, settlement, escrow, revenue, cost, dan Capital flows yang berada di dalam ekonomi Inomasa.

Menggunakan monetary foundation yang konsisten mengurangi kompleksitas bagi manusia maupun agent. Business dapat membandingkan aktivitas ekonomi tanpa harus menjadikan token management sebagai pekerjaan utama produk.

### 6.3 Circle infrastructure sebagai financial capability layer

Circle menyediakan keluarga capability yang relevan untuk wallet, signing, programmable controls, payments, Gateway, dan fungsi USDC lainnya. Inomasa menggunakan capability tersebut ketika requirement-fit dan ketika penggunaannya lebih baik daripada membangun infrastructure serupa sendiri.

Exact wallet model, account type, SDK, atau provider interface merupakan keputusan implementation. Pada tingkat Concept & Architecture, prinsipnya adalah memanfaatkan Circle sebagai leverage finansial dan execution tooling yang sejalan dengan Arc.

### 6.4 Onchain dan offchain sebagai satu sistem hybrid

Tidak semua data atau operasi harus berada onchain. Data pelanggan, prompt, operational logs, private business data, model outputs, atau internal workflow dapat lebih tepat berada offchain.

Onchain diprioritaskan untuk aktivitas yang mendapat manfaat dari shared settlement, programmable commitments, interoperabilitas, atau verifiability. Offchain digunakan untuk data dan computation yang membutuhkan privasi, throughput, fleksibilitas, atau biaya yang lebih sesuai.

Yang penting bukan berapa persen sistem berada onchain, tetapi apakah placement setiap capability mendukung tujuan bisnis dan menjaga economic truth.

---

## 7. Agentic Commerce Primitives

Inomasa menggunakan beberapa primitive dengan fungsi berbeda. Arsitektur tidak memperlakukan mereka sebagai pesaing, tetapi sebagai komponen yang dapat dikomposisikan di dalam Business.

```text
ERC-8004  -> identity, discovery, trust signals
x402      -> instant machine payment
ERC-8183  -> funded work, escrow, deliverable, evaluation

                 ↓
          INOMASA BUSINESS
                 ↓
      Economic History & Capital Context
```

### 7.1 ERC-8004: Agent Identity & Interoperability

ERC-8004 menjadi default onchain identity dan interoperability anchor bagi agent yang relevan. Registry identity memungkinkan agent mempunyai referensi yang dapat dikenali lintas aplikasi, sementara reputation feedback dan validation signals dapat menjadi input tambahan untuk memahami perilaku atau kemampuan agent.

Inomasa tidak menjadikan satu registry signal sebagai universal truth. Registry menjawab sebagian pertanyaan tentang agent; Business context menjawab pertanyaan lain seperti hubungan agent dengan Business, role, authority, counterparty, dan dampak ekonominya.

Dengan demikian Inomasa tidak membangun identity silo, tetapi juga tidak mengurangi Business menjadi sekadar kumpulan token identity.

### 7.2 x402: Instant Machine Commerce

x402 digunakan ketika resource atau service cocok dengan pola pembayaran instan: sebuah request membutuhkan payment, payment dipenuhi, lalu resource atau service diberikan.

Pola ini relevan untuk API, data, inference, analysis, compute, digital content, atau layanan machine-readable lain. x402 memungkinkan agent membayar capability sebagai bagian dari interaction flow, tanpa memaksa agent melewati checkout yang dirancang untuk manusia.

Dalam Inomasa, x402 adalah jalur commerce, bukan accounting system lengkap. Payment outcome tetap perlu dipahami dalam Business context: siapa pembeli, apa yang dibeli, berapa cost atau revenue, dan bagaimana aktivitas tersebut memengaruhi Business.

### 7.3 ERC-8183: Contracted Agentic Work

ERC-8183 digunakan ketika aktivitas lebih tepat dipahami sebagai pekerjaan dengan funding dan deliverable. Client mendanai job, provider mengerjakan dan menyerahkan hasil, evaluator menilai outcome, lalu value dapat dibayarkan atau dikembalikan sesuai hasil.

Primitive ini memberi Inomasa cara interoperable untuk job escrow tanpa menjadikan custom escrow protocol sebagai pusat produk. Outcome job dapat menjadi bagian dari Economic History dan, ketika relevan, memberi context bagi trust signals atau feedback agent.

### 7.4 Composition

Satu Business dapat menggunakan ketiganya secara bersamaan. Agent dengan ERC-8004 identity dapat menjual API melalui x402, mengambil pekerjaan melalui ERC-8183, lalu aktivitas tersebut membentuk history yang terlihat oleh Business dan dapat digunakan dalam konteks Capital.

Arsitektur Inomasa dirancang untuk komposisi seperti ini. Nilai tambahnya bukan memiliki ketiga protocol, tetapi membuat pengguna merasakan semuanya sebagai satu pengalaman bisnis.

---

## 8. Inomasa Architecture

Arsitektur Inomasa diturunkan dari filosofi dan model produk di atas. Ia tidak dimulai dari daftar domain teknis, melainkan dari pertanyaan: capability apa yang harus ada agar seseorang dapat membangun atau menghubungkan Business, mengoperasikannya dengan agent, melakukan commerce onchain, memahami economic history, dan mengakses Capital?

### 8.1 Arsitektur tingkat sistem

```text
┌───────────────────────────────────────────────────────┐
│                 PRODUCT EXPERIENCE                    │
│  Business Workspace · BUILD · MIGRATE · CAPITAL      │
├───────────────────────────────────────────────────────┤
│              INOMASA BUSINESS LAYER                   │
│  Business · People · Agent Relations · Products       │
│  Operations · Treasury · Economic History · Capital   │
├───────────────────────────────────────────────────────┤
│          AGENTIC COMMERCE & INTEROPERABILITY          │
│      ERC-8004 · x402 · ERC-8183 · Integrations        │
├───────────────────────────────────────────────────────┤
│            CIRCLE FINANCIAL CAPABILITIES              │
│      Wallets · Signing · Payments · USDC Tooling      │
├───────────────────────────────────────────────────────┤
│                 ARC / USDC FOUNDATION                 │
│        Settlement · Contracts · Onchain State         │
└───────────────────────────────────────────────────────┘

External Web2/Web3 systems dapat terhubung melalui MIGRATE dan integrations.
```

### 8.2 Product Experience

Lapisan paling atas menyederhanakan seluruh sistem menjadi pekerjaan yang dipahami pengguna bisnis. BUILD, MIGRATE, dan CAPITAL terlihat sebagai capability produk, bukan sebagai kumpulan contract calls.

Business Workspace menjadi pusat pengalaman. Dari sana pengguna dapat mengelola Business, agent, product/service, jobs, transactions, treasury, integrations, activity, dan Capital context sesuai hak aksesnya.

### 8.3 Business Layer

Business Layer adalah tempat diferensiasi utama Inomasa. Lapisan ini menyatukan hal-hal yang primitive eksternal tidak ketahui secara lengkap: Business mana yang terlibat, siapa manusia atau agent yang berhubungan dengannya, produk atau layanan apa yang ditawarkan, transaksi apa yang bermakna revenue atau cost, dan bagaimana aktivitas ekonomi berkembang dari waktu ke waktu.

Business Layer tidak harus berarti satu monolithic service atau database. Ini adalah pembagian tanggung jawab arsitektural, bukan keputusan deployment.

### 8.4 Agentic Commerce & Interoperability

Lapisan ini menggunakan ERC-8004, x402, ERC-8183, dan integration adapters untuk membuat Business dapat berinteraksi dengan agent dan layanan di luar batas aplikasi sendiri.

Prinsipnya adalah **use before rebuild**: ketika sebuah primitive eksternal sudah menyelesaikan fungsi dengan cukup baik, Inomasa menggunakannya dan hanya menambahkan business context yang hilang.

### 8.5 Circle Financial Capabilities

Wallet, signing, payment, programmable controls, dan USDC tooling berada pada lapisan capability finansial. Inomasa menggunakannya untuk mengeksekusi keputusan Business, bukan untuk menentukan makna Business.

### 8.6 Arc / USDC Foundation

Arc dan USDC menyediakan shared economic substrate. Settlement, escrow, dan programmable commitments dapat hidup pada fondasi yang dapat berinteraksi dengan berbagai Business dan Agent tanpa setiap hubungan membutuhkan ledger tertutup baru.

### 8.7 Prinsip arsitektur

Arsitektur Inomasa mengikuti beberapa prinsip umum:

- **Business-first:** teknologi, agent, wallet, dan protocol melayani aktivitas Business.
- **Use before rebuild:** primitive Arc/Circle dan standar relevan diuji lebih dahulu sebelum custom infrastructure dibuat.
- **Composable:** capability dapat dirangkai tanpa harus berada dalam satu monolith.
- **Hybrid:** onchain dan offchain dipilih berdasarkan fungsi, bukan ideologi.
- **Progressive:** Business dapat memperoleh capability secara bertahap.
- **Provenance-aware:** external data tetap membawa sumber dan batas observasinya.
- **Capital-aware but not capital-dominated:** aktivitas bisnis dapat mengalir ke Capital context tanpa seluruh produk berubah menjadi underwriting engine.
- **Replaceable implementation:** provider, SDK, model, atau adapter dapat berubah tanpa merombak product concept.

---

## 9. BUILD Architecture

BUILD adalah arsitektur untuk membawa pengguna dari ide atau kebutuhan pasar menuju Business yang dapat beroperasi dan melakukan aktivitas ekonomi.

### 9.1 Membentuk Business

Pengguna memulai dengan membuat Business dan mendefinisikan konteks minimum seperti tujuan, kategori, produk atau layanan awal, serta hubungan pengendali yang relevan. Sistem tidak perlu meminta seluruh keputusan jangka panjang pada hari pertama.

Business kemudian menjadi workspace tempat capability lain ditambahkan.

### 9.2 Membentuk tenaga agentic

Business dapat memakai agent bawaan Inomasa, agent pihak ketiga, atau agent custom. Pemilihan agent mengikuti kebutuhan fungsi seperti marketing, sales, customer service, operations, finance, development, research, atau procurement.

Agent yang membutuhkan interoperabilitas onchain dapat menggunakan ERC-8004 identity. Inomasa menghubungkannya dengan Business dan role yang sesuai tanpa menjadikan identity registry sebagai pengganti business relationship.

### 9.3 Membuat penawaran dan operasi

Business dapat membuat product atau service yang dijual kepada manusia, Business lain, atau Agent. Operasi dapat dilakukan manual, semi-autonomous, atau semakin autonomous sesuai risk profile dan maturity Business.

### 9.4 Commerce dan settlement

Pembayaran machine-readable dapat menggunakan x402 ketika cocok. Pekerjaan dengan deliverable dan evaluator dapat menggunakan ERC-8183. Direct USDC atau primitive lain dapat digunakan ketika lebih sesuai.

Hasil aktivitas tersebut masuk kembali ke Business sebagai revenue, cost, job outcome, atau economic event lain yang relevan.

### 9.5 Tumbuh melalui history

Seiring Business beroperasi, ia membangun history tentang counterparty, service, revenue, cost, agent performance, job outcomes, dan penggunaan resource. History ini membantu operator memahami bisnis dan dapat menjadi bahan untuk capability berikutnya, termasuk Capital, tanpa mengubahnya menjadi satu score universal.

---

## 10. MIGRATE Architecture

MIGRATE dirancang untuk bisnis yang sudah mempunyai operasi sendiri. Tujuannya bukan memindahkan semua state ke Inomasa, tetapi menambahkan capability yang berguna sambil mempertahankan sistem yang masih bekerja.

### 10.1 Connect before replace

MIGRATE dimulai dari koneksi. Inomasa memetakan sistem existing, peran masing-masing sumber data, dan capability apa yang ingin ditambahkan.

Sebuah website dapat tetap menjadi storefront. Accounting system dapat tetap menjadi sumber invoice atau bookkeeping. Smart contract existing dapat tetap memiliki state onchain-nya. Inomasa menghubungkan sumber-sumber tersebut ke Business context tanpa mengambil alih ownership yang sebenarnya tidak dimiliki.

### 10.2 Preserve provenance

Imported history tidak otomatis menjadi Inomasa-native history. Sistem menjaga sumber, waktu, coverage, dan keterbatasan data sehingga pengguna atau Capital Provider dapat memahami perbedaan antara aktivitas yang diamati langsung dan aktivitas yang berasal dari sistem external.

### 10.3 Add agentic capability incrementally

Setelah koneksi terbentuk, Business dapat menambahkan agent untuk fungsi yang sebelumnya manual atau belum dimiliki. Agent dapat memakai tools existing dan, ketika dibutuhkan, memperoleh interoperabilitas melalui ERC-8004.

### 10.4 Extend commerce onchain

Business existing dapat mulai menjual atau membeli layanan melalui x402, menggunakan ERC-8183 untuk contracted work, atau memindahkan settlement tertentu ke Arc/USDC tanpa mengganti seluruh payment stack sekaligus.

Dengan cara ini, “migrate” berarti memperluas kemampuan Business menuju agentic dan onchain economy secara bertahap.

### 10.5 Partial migration is valid

Tidak ada syarat bahwa Business harus menjadi 100% Inomasa-native. Sebagian Business mungkin hanya menggunakan agentic procurement dan machine payments. Sebagian lain mungkin menghubungkan treasury, jobs, economic history, dan Capital.

MIGRATE berhasil ketika Business memperoleh capability baru tanpa kehilangan sistem yang memberikan nilai nyata.

---

## 11. CAPITAL Architecture

CAPITAL menghubungkan Business dengan modal menggunakan context yang berasal dari aktivitas bisnis dan infrastructure onchain. Ia bukan sekadar halaman investasi yang ditempelkan setelah commerce selesai.

### 11.1 Menghubungkan modal dengan operating reality

Business dapat mempunyai economic history yang mencakup revenue, cost, counterparties, job outcomes, settlements, refunds, dan penggunaan agent. Sebagian history tersebut berasal dari Arc dan primitive onchain, sebagian dapat berasal dari external systems yang terhubung melalui MIGRATE.

Inomasa menyajikan informasi tersebut sebagai decision material. Capital Provider tetap menentukan apa yang dianggap relevan dan bagaimana risiko dinilai.

### 11.2 Provider-driven decision

Capital Provider adalah pihak yang menanggung risiko ekonomi. Karena itu keputusan modal tidak boleh otomatis muncul dari reputation score, transaction count, atau satu model penilaian platform.

Inomasa dapat membantu discovery, analysis, comparison, atau monitoring, tetapi tidak mengubah informasi menjadi hak memperoleh modal.

### 11.3 Programmable capital relationship

Onchain foundation memungkinkan relationship Capital memakai programmable terms, USDC allocation, transparent settlement, dan state yang dapat diperiksa sesuai desain produk yang nantinya dipilih.

Hal ini membuka kemungkinan berbagai mekanisme, tetapi Concept & Architecture tidak mengunci satu instrumen seperti loan, revenue-based financing, profit share, pool, atau model lain sebagai bentuk final.

### 11.4 Capital is not revenue

Dana yang masuk melalui Capital harus tetap dapat dibedakan dari customer revenue atau operating income. Perbedaan ini penting agar economic history tidak memberikan gambaran palsu mengenai performa Business.

### 11.5 Capital outcome kembali ke Business history

Setelah modal digunakan, aktivitas berikutnya dapat membentuk history baru. Bagaimana dana dipakai, perubahan operasi, revenue berikutnya, cost, repayment, atau outcome lain dapat memberikan context tambahan.

History baru menambah informasi; ia tidak menulis ulang fakta yang sudah terjadi sebelumnya.

### 11.6 Peran Inomasa

Inomasa secara default adalah coordination dan infrastructure layer, bukan otomatis lender, guarantor, custodian, atau balance-sheet risk bearer. Exact legal structure dan provider model ditentukan sesuai produk dan yurisdiksi pada tahap implementation.

---

## 12. Economic History, Evidence & Trust

Inomasa membutuhkan cara untuk memahami aktivitas Business tanpa jatuh ke dua ekstrem: mempercayai semua klaim begitu saja, atau mencoba mengubah seluruh aktivitas menjadi skor universal.

### 12.1 Economic History sebagai fondasi

Economic History adalah riwayat aktivitas ekonomi Business yang dapat direkonstruksi. Ia dapat mencakup settlement, revenue, cost, job outcomes, refunds, capital flows, counterparties, dan sumber external yang relevan.

History bukan hanya arsip. Ia memberi Business kemampuan melihat apa yang benar-benar terjadi dan menyediakan context bagi agent, operator, customer, evaluator, atau Capital Provider.

### 12.2 Evidence mempunyai scope

Evidence selalu menjawab klaim tertentu. Onchain payment membuktikan value movement tertentu. ERC-8183 completion membuktikan lifecycle action tertentu. ERC-8004 feedback membuktikan bahwa signal tertentu diterbitkan oleh pihak tertentu.

Tidak satu pun secara otomatis membuktikan seluruh kualitas Business atau Agent.

### 12.3 Reputation bersifat kontekstual

Reputation dapat dibentuk dari history, external signals, evaluator results, atau pengalaman counterparty, tetapi harus dibaca sesuai konteks. Agent yang bagus untuk satu fungsi tidak otomatis bagus untuk fungsi lain. Business yang kuat pada satu jenis market tidak otomatis memiliki risk profile yang sama di market lain.

Inomasa karena itu lebih cocok menyajikan contextual views daripada satu angka yang mendefinisikan reputasi secara permanen.

### 12.4 Onchain improves inspectability, not truth by itself

Onchain membuat beberapa aktivitas lebih mudah diverifikasi, tetapi tidak menghapus kebutuhan interpretasi. Common-control transactions, circular activity, self-funded volume, atau evaluator yang tidak independen tetap dapat terjadi onchain.

Karena itu, provenance dan relationship context tetap penting. Inomasa harus dapat membedakan aktivitas independen dari aktivitas related-party ketika perbedaan tersebut material.

### 12.5 Trust yang dapat ditelusuri

Ketika Inomasa menampilkan signal atau assessment, pihak yang membutuhkan detail seharusnya dapat menelusuri sumber dan keterbatasannya. Tujuan trust layer bukan memberi jawaban absolut, tetapi membuat reasoning atas informasi menjadi lebih transparan dan bertanggung jawab.

---

## 13. Autonomy, Control & Safety

Agentic Commerce hanya berguna jika agent dapat bertindak. Tetapi tindakan yang menyentuh uang, data, pelanggan, atau commitment membutuhkan batas yang sebanding dengan konsekuensinya.

### 13.1 Controlled autonomy

Inomasa mendukung spektrum operasi dari manual hingga full autonomous. Perbedaannya bukan pada apakah manusia “percaya AI”, tetapi pada ruang tindakan yang diberikan kepada Agent.

Agent dapat menangani tugas rutin dengan otonomi tinggi, sementara keputusan bernilai besar atau irreversible dapat membutuhkan policy tambahan atau human approval.

### 13.2 Authority harus dapat dibatasi

Agent yang dapat membeli service, membuat job, atau mengeluarkan dana harus bekerja dalam batas yang dapat dipahami. Batas dapat mencakup jumlah, periode, jenis tindakan, service, counterparty, atau rule lain sesuai kebutuhan.

Ketika wallet atau provider telah mempunyai programmable control yang cukup, Inomasa sebaiknya memanfaatkannya daripada membangun control machinery paralel tanpa manfaat tambahan.

### 13.3 Economic correctness

Sistem harus menjaga agar payment, refund, capital inflow, revenue, cost, dan settlement tidak saling tertukar. Aktivitas ekonomi yang sama tidak boleh dihitung berulang hanya karena melewati beberapa adapter atau provider.

Detail teknis seperti idempotency strategy, reconciliation state, dan exact accounting representation berada pada Implementation & Realization, tetapi requirement arsitekturalnya tetap: **economic state harus merepresentasikan apa yang benar-benar terjadi, bukan apa yang aplikasi harapkan terjadi.**

### 13.4 Privacy and disclosure

Business data tidak selalu cocok menjadi public state. Inomasa menggunakan disclosure secara proporsional: informasi onchain ketika shared verification memberi manfaat, dan private/offchain handling ketika sensitivitas atau fungsi bisnis menuntutnya.

### 13.5 Safety yang proporsional

Risk control sebaiknya meningkat bersama konsekuensi. Tidak setiap API purchase kecil membutuhkan ceremony yang sama dengan Capital allocation atau treasury movement bernilai besar.

Prinsip ini menjaga Inomasa aman tanpa menjadikan setiap aktivitas bisnis tenggelam dalam friction.

---

## 14. Product Experience

Inomasa ditujukan untuk pengguna bisnis, bukan hanya developer Web3. Product experience harus membuat pengguna merasakan manfaat agentic dan onchain tanpa menjadikan protocol sebagai pekerjaan tambahan.

### 14.1 Business workspace sebagai pusat

Pengguna masuk ke Business, bukan ke kumpulan protocol. Workspace menyatukan agents, products/services, operations, jobs, transactions, treasury, integrations, economic history, dan Capital context sesuai kebutuhan.

### 14.2 Bahasa produk yang familiar

Action utama sebaiknya menggunakan mental model bisnis seperti:

- Create Business
- Add Agent
- Add Product / Service
- Sell
- Buy
- Create Job
- Connect Existing Business
- View Transactions
- View Business Activity
- Allocate Capital

Istilah protocol tetap tersedia pada detail teknis, tetapi tidak menjadi bahasa utama untuk user journey.

### 14.3 Progressive disclosure

Pengguna biasa membutuhkan hasil dan status yang jelas. Advanced user, auditor, agent developer, atau Capital Provider dapat membuka detail seperti transaction reference, registry identity, job state, proof, source, atau policy.

Dengan progressive disclosure, Inomasa dapat tetap sederhana di permukaan tanpa menjadi black box.

### 14.4 Web2-level usability, onchain capability underneath

Arah UX harus mengambil standar kemudahan dari software bisnis mainstream: onboarding jelas, jumlah langkah pendek, visual netral, dan interaksi yang familiar.

Kekuatan onchain berada di bawah pengalaman tersebut. Pengguna tidak harus berpikir “saya sedang memanggil smart contract” ketika yang sebenarnya ingin dilakukan adalah “bayar service” atau “buat pekerjaan”.

### 14.5 Fast path untuk pekerjaan rutin

Tindakan yang sering digunakan harus mempunyai jalur cepat. Control tambahan muncul ketika value, risk, atau consequence memang meningkat.

Tujuannya bukan menghapus semua konfirmasi, tetapi memastikan friction selalu mempunyai alasan.

---

## 15. Interoperability & Extensibility

Inomasa harus mampu tumbuh bersama ekosistem AI, Arc/Circle, Web2, dan Web3. Arsitektur yang terlalu tertutup akan cepat menjadi beban ketika standard atau tooling berkembang.

### 15.1 External agents

Business dapat menggunakan agent dari luar Inomasa selama capability dan hubungan yang dibutuhkan dapat dipahami. ERC-8004 membantu menyediakan interoperability anchor tanpa mengunci Business pada satu marketplace atau framework.

### 15.2 External business systems

MIGRATE membutuhkan koneksi dengan website, CRM, accounting, databases, GitHub, cloud services, commerce systems, payment systems, dan Web3 protocols. Integrasi harus mempertahankan provenance dan tidak mengklaim ownership atas state external.

### 15.3 External standards and ecosystem leverage

Ketika Arc, Circle, atau standar Agentic Economy menyediakan capability yang cukup baik, Inomasa sebaiknya menggunakannya. Custom infrastructure dibangun untuk gap yang benar-benar khas atau ketika external primitive tidak memenuhi kebutuhan produk.

Prinsip ini membuat roadmap ecosystem dapat mempercepat Inomasa. Jika primitive eksternal berkembang lebih baik, Inomasa dapat menyederhanakan sistemnya daripada mempertahankan machinery lama hanya karena sudah pernah dibuat.

### 15.4 Web2 dan Web3 adalah sumber capability, bukan kelas bisnis yang terpisah

Business tidak menjadi kategori berbeda hanya karena stack-nya Web2 atau Web3. Yang lebih penting adalah apa yang bisnis lakukan, sumber data apa yang dimiliki, agent apa yang digunakan, dan hubungan ekonomi apa yang dijalankan.

### 15.5 Inomasa menambahkan business context

External systems biasanya mengetahui sebagian kecil aktivitas. ERC-8004 mengetahui agent identity dan signals. x402 mengetahui payment interaction. ERC-8183 mengetahui job lifecycle. Circle mengetahui wallet/payment operations. Arc mengetahui onchain execution.

Inomasa menghubungkan potongan-potongan tersebut ke pertanyaan bisnis: **Business mana yang terlibat, aktivitas apa yang dilakukan, apa dampak ekonominya, dan bagaimana hal itu berhubungan dengan history serta capability berikutnya?**

---

## 16. Risks & Design Considerations

Inomasa berada pada pertemuan beberapa sistem yang masing-masing membawa risiko sendiri. Arsitektur harus mengakui risiko tersebut tanpa mencoba menyelesaikan semuanya melalui satu mekanisme universal.

### 16.1 Agent reliability

Agent dapat salah memahami tugas, menerima input berbahaya, memilih tool yang salah, atau menghasilkan output yang tidak sesuai. Karena itu otonomi harus proporsional terhadap risiko dan kemampuan observasi.

### 16.2 Identity, reputation, dan coordination gaming

Open agent ecosystem dapat mengalami Sybil behavior, collusion, fake feedback, circular transactions, atau coordinated activity. Onchain tidak menghilangkan masalah ini. Provenance, relationship context, dan contextual interpretation tetap diperlukan.

### 16.3 Evaluator risk

ERC-8183 menyediakan evaluator role tetapi tidak otomatis menjamin evaluator independen, kompeten, atau bebas konflik. High-value jobs dapat membutuhkan mekanisme evaluator yang lebih kuat dibanding pekerjaan sederhana.

### 16.4 Smart contract, wallet, dan provider risk

Inomasa bergantung pada beberapa external capability. Smart contract dapat mempunyai bug, wallet infrastructure dapat gagal, provider dapat berubah, dan SDK dapat berevolusi. Karena itu implementation harus mempunyai dependency boundaries dan recovery strategy yang memadai.

### 16.5 Privacy

Business information dapat terlalu sensitif untuk menjadi public onchain state. Architecture harus mendukung selective disclosure, private processing, dan data minimization ketika sesuai.

### 16.6 Capital and legal risk

Capital memperkenalkan pertanyaan tentang custody, investor protection, underwriting responsibility, disclosure, licensing, jurisdiction, dan legal form. Inomasa tidak boleh menganggap programmability menghapus kebutuhan struktur legal yang benar.

### 16.7 Ecosystem dependency

Inomasa sengaja memanfaatkan Arc/Circle secara mendalam. Perubahan pada ecosystem dapat memengaruhi implementation. Risiko ini diterima karena integration tersebut juga merupakan sumber leverage utama. Arsitektur mengurangi dampaknya dengan menjaga Business Layer dan product concept tidak bergantung pada satu SDK atau provider version tertentu.

### 16.8 Over-architecture

Risiko internal terbesar adalah membangun lebih banyak machinery daripada nilai produk yang dihasilkan. Setiap subsystem baru harus dapat dijelaskan melalui kebutuhan Business, user experience, interoperability, economic correctness, atau risk yang nyata.

Jika solusi existing sudah cukup baik, menambah layer baru bukan tanda architecture lebih matang. Sering kali justru sebaliknya.

---

## 17. Long-Term Direction & Conclusion

Inomasa bertujuan menjadi rumah bagi bisnis yang semakin agentic dan semakin terhubung dengan ekonomi onchain.

Seseorang dapat memulai Business baru melalui BUILD dan memperoleh leverage dari AI agent sejak awal. Bisnis existing dapat masuk melalui MIGRATE tanpa kehilangan sistem yang telah memberi nilai. Keduanya dapat menggunakan Agent untuk operasi, ERC-8004 untuk interoperabilitas identitas, x402 untuk machine commerce, ERC-8183 untuk contracted work, Circle untuk financial capability, dan Arc/USDC untuk shared economic execution.

Seiring aktivitas berlangsung, Business membangun Economic History. History tersebut tidak hanya berguna untuk dashboard internal. Ia dapat membantu Business memahami operasi, memberi context kepada customer atau counterparty, mendukung trust yang lebih dapat diperiksa, dan menjadi bahan bagi Capital Provider untuk membuat keputusan yang lebih terinformasi.

CAPITAL kemudian menjadi kelanjutan alami dari business operating environment, bukan dunia terpisah. Modal dapat masuk melalui relationship yang programmable dan onchain, sementara penggunaannya kembali menjadi bagian dari history Business. Keputusan modal tetap provider-driven dan tidak dihasilkan secara otomatis dari reputasi.

Dalam jangka panjang, Inomasa dapat mendukung lebih banyak jenis Business, lebih banyak agent eksternal, lebih banyak machine-to-machine commerce, dan lebih banyak hubungan Business-to-Business. MIGRATE dapat memperluas jangkauan ke bisnis yang sebelumnya tidak dibangun secara onchain. BUILD dapat membuat bisnis baru semakin mudah dilahirkan oleh individu atau tim kecil. CAPITAL dapat membuka bentuk partisipasi modal yang lebih dekat dengan operating reality.

Teknologi di bawahnya akan berubah. Model AI, agent framework, wallet infrastructure, protocol, dan provider akan berkembang. Karena itu identitas Inomasa tidak boleh bergantung pada satu implementation tertentu.

Identitas Inomasa berada pada kombinasi prinsip berikut:

> **membantu orang membangun dan menumbuhkan Business dengan AI; menghubungkan Business existing tanpa memaksa mereka memulai ulang; membawa aktivitas ekonomi penting ke fondasi onchain ketika memberi nilai; menggunakan primitive Arc/Circle dan Agentic Economy sebagai leverage; serta menghubungkan operating history dengan Capital tanpa mengubahnya menjadi klaim atau score yang berlebihan.**

Dengan fondasi tersebut, Inomasa tidak hanya menjadi aplikasi yang “menggunakan blockchain” atau aplikasi yang “mempunyai AI agent”. Ia menjadi **Agentic Commerce business environment yang menggabungkan creation, operation, onchain economic activity, interoperability, dan Capital dalam satu sistem yang koheren.**

---

## Terminologi Utama

**Agentic Commerce**<br>
Aktivitas ekonomi ketika AI agent atau software agent dapat menemukan, membeli, menjual, mengerjakan, mengevaluasi, atau membantu mengelola layanan dan pekerjaan dalam konteks Business.

**Business**<br>
Unit koordinasi utama Inomasa yang menghubungkan manusia, Agent, product/service, operations, treasury, integrations, economic activity, history, dan Capital context.

**BUILD**<br>
Jalur untuk menciptakan dan mengoperasikan Business baru dengan kemampuan agentic dan onchain yang dapat berkembang secara bertahap.

**MIGRATE**<br>
Jalur untuk menghubungkan Business existing ke Inomasa tanpa mewajibkan replacement penuh atas sistem yang masih berguna.

**CAPITAL**<br>
Jalur partisipasi modal yang menggunakan Business context dan Economic History sebagai decision material, dengan keputusan tetap berada pada pihak yang menanggung risiko.

**Economic History**<br>
Riwayat aktivitas ekonomi yang dapat direkonstruksi, termasuk settlement, revenue, cost, job outcome, refund, capital flow, counterparty, dan source context yang relevan.

**Evidence**<br>
Informasi atau klaim yang mempunyai sumber, scope, dan konteks tertentu. Evidence tidak otomatis menjadi Reputation atau Capital approval.

**ERC-8004**<br>
Standar agent identity, discovery, reputation feedback, dan validation interfaces yang digunakan sebagai default interoperability anchor bagi agent onchain yang relevan.

**x402**<br>
Machine-payment protocol yang cocok untuk pembayaran instan atas resource atau service.

**ERC-8183**<br>
Agentic Commerce job primitive untuk pekerjaan dengan funding, escrow, deliverable, evaluator, completion/rejection, dan refund semantics.

**Controlled Autonomy**<br>
Model di mana Agent dapat bertindak otomatis di dalam batas yang diberikan tanpa memperoleh authority tanpa batas.

**Onchain Economic Layer**<br>
Bagian aktivitas ekonomi Inomasa yang menggunakan Arc/USDC dan programmable primitives untuk settlement, commitments, escrow, interoperability, atau verifiability ketika hal tersebut memberi manfaat nyata.

---

## Ruang Lingkup Dokumen

Dokumen ini tidak menentukan database schema, API, framework frontend/backend, exact wallet product, smart-contract implementation tertentu, deployment topology, exact Capital instrument, exact legal structure, testing scenario, atau acceptance criteria.

Hal-hal tersebut berada pada dokumen **Implementation & Realization** karena mereka dapat berubah antar fase tanpa mengubah konsep dasar Inomasa.

Sebaliknya, dokumen ini harus cukup untuk membuat pembaca memahami apa Inomasa, problem apa yang dituju, filosofi yang membentuknya, mengapa onchain merupakan bagian struktural, bagaimana BUILD/MIGRATE/CAPITAL berhubungan, bagaimana Arc/Circle dan Agentic Commerce primitives digunakan, dan bagaimana arsitektur sistem diturunkan dari semua konsep tersebut.

---

## Referensi Utama

- Arc documentation, khususnya positioning Arc sebagai economic execution environment dan capability Agentic Economy.
- Circle documentation untuk USDC, wallet infrastructure, payments, programmable controls, Gateway, dan agent-oriented financial tooling.
- ERC-8004 untuk agent identity, discovery, reputation feedback, dan validation interfaces.
- x402 untuk machine-to-machine payment interactions.
- ERC-8183 untuk funded agentic work dengan escrow, deliverable, evaluator, payment, dan refund semantics.

Detail deployment, contract address, version, SDK, API, status standard, dan security posture bersifat implementation-time facts dan harus diverifikasi kembali ketika digunakan.
