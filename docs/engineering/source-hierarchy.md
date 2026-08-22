# Engineering source hierarchy

## Purpose

This hierarchy prevents chat context, repository convenience, historical artifacts, and vendor documentation from silently becoming architecture authority.

## Authority order

1. **Inomasa Canonical Architecture v1.0** — sole active architecture authority.
2. **Formally accepted System Realization decisions and specifications** — implementation authority only when they conform to the Canonical Architecture. No complete System Realization specification is committed as of B2.
3. **Accepted repository engineering documentation and decision records** — operational guidance within their stated scope.
4. **Task instructions and working plans** — execution direction that may not silently override higher authority.
5. **Historical Architecture Record Set** — Foundation/Domain files, maps, checkpoints, candidates, external reviews, and prior adjudication artifacts retained only for lineage, audit, or an explicitly reopened question.
6. **Vendor documentation, examples, generated output, and external commentary** — evidence and implementation input, never Inomasa architecture authority.

The Canonical Architecture itself is intentionally not duplicated into this repository during B1. Copying partial architecture text would create drift and competing sources of truth.

## Conflict handling

When an implementation request or repository document conflicts with the Canonical Architecture, or when the Canonical answer is unavailable:

1. stop the affected change;
2. identify the exact unresolved decision or conflict;
3. record what is known without inventing an answer;
4. request material direction from the user;
5. resume only after the decision is accepted through the proper architecture/engineering process.

Never resolve a conflict by silently changing module boundaries, authority, economic semantics, trust interpretation, evidence meaning, settlement behavior, or risk/capital controls.

## Decision status vocabulary

- `REQUIRED` — imposed by an active authority or hard constraint; not yet selected or built.
- `SELECTED` — a documented implementation choice has been accepted.
- `PROTOTYPED` — exercised in a bounded spike; not production implementation.
- `IMPLEMENTED` — present in the repository; not automatically proven correct.
- `VERIFIED` — required evidence and checks have passed.

These statuses are not interchangeable. B0 compatibility results are evidence about the development environment, not product implementation.
