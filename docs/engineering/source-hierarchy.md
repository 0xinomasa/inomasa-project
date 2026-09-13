# Engineering source hierarchy

## Purpose

This hierarchy separates working instructions, accepted product direction,
roadmap, implementation guidance, mutable engineering truth, and dated evidence.
An explicit owner correction replaces only the affected decision; a newer file,
fixture, vendor example, or code on main does not silently replace product meaning.

## Active authority and truth

1. **Working instructions and current authorization** govern how to act. Read
   `AGENTS.md`, `PROJECT_STATE.md`, and the owner-designated
   `Inomasa_Project_Instructions_Full.md` identified below. A roadmap or technical
   capability is not permission to execute an action.
2. **`Inomasa_Product_Realignment_Map.md`** is the canonical active roadmap:
   stage, status, dependencies, gates, and explicit latest owner corrections.
   P0 is COMPLETE; P1 is ACCEPTED; P2 is COMPLETE / OWNER ACCEPTED;
   P3–P9 are NOT STARTED.
   The owner's 2026-09-13 local-access, durable-Account and P2-scope corrections
   are incorporated directly in its affected sections under explicit permission.
   The owner accepted and closed P2 on 2026-09-13. P3 remains unauthorized.
3. **Accepted P1 and the Final Visual Design Package** govern product and
   experience realignment. Read Final Consolidation with Corrective Owner Review,
   the system model, final visual notes/package, and the roadmap's latest
   corrections. P1 acceptance is not implementation, runtime, usability, or Alpha
   completion evidence. P1's six systems and F1–F8 are system contracts, not a
   required menu, service decomposition, or manual setup checklist.
4. **[Concept & Architecture v1.0](../architecture/inomasa-concept-and-architecture-v1.0.md)**
   remains the architecture/product contract where not explicitly corrected by
   accepted P1 and the roadmap. **[Alpha Realization — REV2](inomasa-alpha-implementation-and-testnet-realization-v1.0.md)**
   retains the controlled economic/system kernel contract.
   **[Post-H Product Realization](post-h-product-realization.md)** retains
   applicable implementation semantics and dated acceptance evidence; its former
   next-work sequence and superseded experience choices are not the active roadmap.
5. **Accepted GitHub `main`**—code, migrations, tests, lockfile, Git history,
   CI, and recorded provider/chain proof—is accepted mutable engineering truth.
   Branch code and local changes describe available implementation, not accepted
   main. [PROJECT_STATE.md](../../PROJECT_STATE.md) is the takeover index.
   Provider/device observations are dated and environment-scoped.
6. **Main Audit and historical snapshots/checkpoints** preserve findings and
   decisions at their observation date. Reconcile affected findings with actual
   code; design acceptance does not close engineering findings.
7. **External primary sources** establish provider/standard capabilities within
   their scope. They do not establish that Inomasa implements or has verified them.

## Source identity and device-local locations

The owner designated these sources for P2 and continued use through later stages.
On this device, the project reference directory is
`/mnt/second-brain/Project/inomasa-project/`; the durable product baseline
directory is `/mnt/second-brain/Project/inomasa-project/Product Baseline/`.
These are device-local locations, not portable filesystem requirements.

The active working-instructions copy is
`/mnt/second-brain/Project/inomasa-project/Inomasa_Project_Instructions_Full.md`.
The package's `project_sources/11-Inomasa_Project_Instructions_Full.md` is a
reference snapshot, not a second active instructions file.

All following identities are relative to the Product Baseline directory:

| Source identity | Role / relevant sections |
| --- | --- |
| `Inomasa_Product_Realignment_Map.md` | Canonical roadmap; §§2–5 owner decisions, stages and P3 notes; §9 P2 analysis, R01–R11, gates and handoff |
| `Inomasa_P1_Final_Consolidation_2026-09-11.md` | P1 acceptance; §2 CR1–CR4 and runtime/usability boundary |
| `Inomasa_P1_Corrective_Owner_Review_2026-09-10.md` | Accepted model/contracts through consolidation; §12 corrections to initial P1 |
| `Inomasa_Final_Visual_Design_Notes_2026-09-11.md` | Explanation of final visual direction, read with owner acceptance |
| `output/pdf/Inomasa_Final_Visual_Design_Package_2026-09-11.pdf` | Accepted final visual package; not evidence of a running application |
| `output/pdf/Inomasa_P1_Platform_System_Model_2026-09-10.pdf` | Six-system relationships and shared Business foundation |
| `Inomasa_Audit_Menyeluruh_2026-09-09.md` | Main Audit; dated implementation findings, not a live state inventory |
| `Inomasa_P1_Product_Experience_Realignment_2026-09-10.md` | Initial P1 details only where not corrected by later accepted decisions |
| `BASELINE_MANIFEST.json` | Delivery inventory, original extraction paths, byte lengths and SHA-256 integrity; not a live folder index, product acceptance or execution authority |

### Relocated historical references observed on 2026-09-12

The package manifest remains the immutable record of the extracted package layout.
Moving a historical file does not invalidate its recorded content. Resolve these
historical identities at their current device-local locations:

| Manifest identity | Current observed location | Identity check / role |
| --- | --- | --- |
| `Inomasa_Product_Realignment_Map_2026-09-09.md` | `/mnt/second-brain/Project/inomasa-project/History/Inomasa_Product_Realignment_Map_2026-09-09.md` | SHA-256 matches the manifest; superseded historical roadmap. The undated roadmap in Product Baseline remains active. |
| `project_sources/04-Inomasa_Canonical_Architecture_v1.0-1-.docx` | `/mnt/second-brain/Project/inomasa-project/History/Inomasa_Canonical_Architecture_v1.0.docx` | SHA-256 matches the manifest; `SUPERSEDED / HISTORICAL`. |
| `project_sources/03-Arc-Litepaper-2025.pdf` | **Not located under `/mnt/second-brain/Project/inomasa-project/` in the 2026-09-12 path reconciliation** | The manifest identity/checksum remains valid as an extraction record. `History/Nexia_Litepaper_v1.1.pdf` has a different name and SHA-256 and is not treated as the Arc Litepaper. Historical location observation only. The owner ended the search on 2026-09-13; local availability is not a requirement or gate. Do not substitute or infer content. |

The package manifest is a delivery snapshot; paths and checksums inside it
describe the original extracted package and are not rewritten when files are
curated into `History/`, the roadmap is validly revised, or the remaining package
is relocated. On 2026-09-13, all 17 files still present in the former nested
`P2 Baseline/Inomasa_P2_Baseline_Package/` directory were moved without content
change into the single durable `Product Baseline/` directory; relative paths,
sizes and SHA-256 checksums matched before and after, and the empty former parent
was removed. The owner-designated roadmap document
identity is the active reference, not a parallel roadmap to edit independently.
Do not copy the package into this repository. The owner-authorized Second Brain
changes in this finalization are the verified relocation and the canonical
roadmap revision identified above; no source content other than that roadmap is
changed. Its authorized 2026-09-13 revision now differs from the extraction
checksum by design; do not rewrite the manifest to conceal either the revision
or the later folder layout.
Historical `sandbox:` links are review links;
resolve the named local documents instead. If a source is unavailable in another
environment, report its exact identity and missing location and stop the affected
semantic work until an owner-designated source is available. Do not infer its
contents from this summary or assume the Android mount exists elsewhere.

## Explicit corrections and retained scope

- Roadmap §§2–4 and §9.3 supersede Post-H §13's work → economics →
  History/Capital → reuse execution order. The active sequence is P3 access,
  Account and Personal Wallet; P4 BUILD to operational readiness; P5 operations
  and a complete economic cycle; P6 reuse, cross-controller proof and core product
  acceptance; P7 CAPITAL returning to operations and Economic History; P8
  integrated Alpha acceptance/closure; P9 CONNECT as a conditional expansion.
  This is a navigation summary of the canonical roadmap, not another roadmap.
- Post-H §§4–6's manual/four-template entry and old workspace/visual choices are
  historical implementation scope. §12 already relaxed the AI exclusion for
  bounded drafting; accepted P1 now requires AI-assisted BUILD, Brain,
  Orchestrator, meaningful readiness and the accepted final design. Preserve
  genesis, tenancy, authority, recovery and economics, not obsolete UI structure.
- **Owner decision, 2026-09-13: localhost Alpha application entry uses typed
  email only, without invitations, an email allowlist or entry OTP.** This
  supersedes invited-entry requirements in roadmap R01/§9.5–9.6 and derived
  active guidance for this local profile. The code still implements invitations;
  implementation has not changed. Typed email is an unverified label, not proof
  of email, Business or wallet control. Never grant a legacy principal's rights
  by matching typed email. Keep Personal Wallet authentication separate; the
  selected product remains Circle User-Controlled Wallet. Its email route uses
  OTP for protected Account/wallet authentication, not application entry.
  The owner's subsequent refinement requires durable Account/wallet/Business
  continuity across logout, cookie loss and devices, without repeated email entry
  while context is available. Before replacing legacy access, prove the owner's
  existing-account return or binding path; bulk migration may be deferred, that
  cutover protection may not. See PROJECT_STATE for the concrete closure plan.
  Roadmap synchronization now updates directly affected §§2/3/5 and §9 text,
  including R01 and §9.5–9.6. Legacy return remains unproven; retaining old access
  is not an assertion of safety. A future P3 worktree must carry the latest reviewed
  documentation delta because its selected base commit does not contain it.
  This profile neither
  authorizes public deployment nor proves independent controllers at P6.
- Local Arc Litepaper availability is not a requirement or gate. The owner ended
  its search on 2026-09-13. Use [Arc's official site](https://www.arc.io/)
  and its linked documentation for a concrete Arc question, when needed.
  Do not repeat historical lookup, rendering, checks or confirmations without
  a relevant change or unresolved acceptance requirement.
- Roadmap's latest CAPITAL decision corrects permanent readings of “without a
  universal score” in Final Consolidation §3, Concept §§4.3/9.5/11–12 and derived
  summaries. Mechanism evaluation waits for P7; no score or expanded authority is
  accepted now. Preserve Capital/Revenue separation and provider/risk attribution.
- P0 records the old allowance action as **NOT SUBMITTED**, with no pending
  transaction for that action. Old purchase/funding plans remain history and
  do not become the next task or renewed permission.
- Initial P1 and exploratory PDFs remain historical where corrected. Final
  Consolidation §2 replaces pending CR1–CR3 labels and defers final comprehension
  acceptance to actual application use. The accepted final visual package is not
  another design choice to reopen. Unaffected Concept/REV2/Post-H contracts and
  exact A–H/Work 1–5 evidence remain valid within their original scope.

## Repository and mirror provenance

Accepted product direction and accepted implementation are separate records.
The owner explicitly accepted P1 and the roadmap before their realization on
main. This designation is not an arbitrary mirror edit and does not require old
PRs to merge before product acceptance can be recognized. Conversely, product
acceptance does not accept branch code or prove runtime behavior.

Repository/main-only provenance language in the unchanged Concept/REV2/Post-H
documents continues to govern accepted engineering copies and evidence, but must
not be used to deny the explicitly accepted P1 direction. Those source documents
remain intact; the corrections above govern the affected active instructions.
Second Brain otherwise remains curated context, not a competing engineering
ledger. Record new material owner corrections explicitly; never silently promote
an unaccepted draft or overwrite historical facts.

## Superseded and historical sources

**Inomasa Canonical Architecture v1.0 is `SUPERSEDED / HISTORICAL`.** It and the
Foundation/Domain set, maps, B0-B5 gates, old B6/B7/B8 or R1-R5 roadmaps, reviews,
adjudications, and prior execution plans remain lineage/audit evidence only. They
govern current work only where an active authority deliberately restates their
meaning.

The verified controlled Alpha execution record remains engineering evidence. Its
Signal Forge, Ops Pilot, and buyer-Agent objects are regression fixtures, not a
fixed product-capacity or roadmap authority. Common-control economic proof does
not establish independent demand.

## Conflict handling

First apply explicit accepted corrections only to the affected scope. If a
material conflict remains unresolved between applicable sources:

1. stop the affected change while continuing unaffected inspection;
2. identify both sources, the exact unresolved decision and its impact;
3. record current engineering facts without inventing product meaning;
4. request material direction from the owner;
5. resume the affected work only after the decision and execution scope are clear.

Do not ask the owner to reselect P1 or silently change authority, economic
classification, provenance, settlement behavior, or Capital risk ownership.

## Decision status vocabulary

- `REQUIRED` — imposed by an active authority or hard constraint; not yet selected or built.
- `SELECTED` — a documented implementation choice has been accepted.
- `PROTOTYPED` — exercised in a bounded spike; not production implementation.
- `IMPLEMENTED` — present in the repository; not automatically proven correct.
- `VERIFIED` — required evidence and checks have passed.

Always name the scope of `ACCEPTED` or `VERIFIED`: product/design acceptance,
code acceptance, automated checks, runtime/provider proof and owner usability
acceptance are distinct. Passing old tests does not accept P1 UX.
