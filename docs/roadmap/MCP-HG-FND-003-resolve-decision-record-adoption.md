---
id: MCP-HG-FND-003
area: FND
title: Resolve Decision Record Adoption
theme: foundation-tooling
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: b8a0af237814c4eb33a020a5c562963ac299fbcc
created_at: 2026-09-14T22:06:30Z
updated_at: 2026-09-26T18:10:52Z
---

## Goal

Adopt the declared Decision Record capability by establishing its canonical collection and adoption record.

## Context

The repository declares `ki-decision-records` in `.ki.toml`, but the estate audit found no canonical Decision Record collection root or index. The declaration therefore fails the capability's `ROOT-1` and `INDEX-1` checks.

## Boundary

The repository will keep its existing `ki-decision-records` declaration. This item may establish only the canonical collection root, its index, and the required adoption record; it does not invent retrospective decisions or change any other repository contract.

## Current state

The `ki-decision-records` capability is declared and its canonical `docs/decisions/` collection is absent. The repository therefore lacks both the required code-repository index and the root governance record that adopts Decision Records.

## Steps

- [x] Create `docs/decisions/README.md` as the collection index.
- [x] Create `GDR-MCP-HG-001: Adopting Decision Records` as the first and only indexed record.
- [x] Keep the record self-contained, current, and limited to adopting the Decision Record instrument.
- [x] Run the focused Decision Record, repository, authoring, and roadmap audits, followed by the full repository audit.

## Files touched

`docs/decisions/README.md`, `docs/decisions/GDR-MCP-HG-001-adopting-decision-records.md`, and this work item.

## Verify

Run `ki repo audit --skill ki-decision-records --repo .`, `ki repo audit --skill ki-repo --repo .`, `ki repo audit --skill ki-authoring --repo .`, `ki repo audit --skill ki-work-roadmap --repo .`, and `ki repo audit --repo .`. The Decision Record collection must have no failures or warnings; the full audit may retain only findings outside this item's boundary.

## Dependencies / blocks

Nothing blocks this work. The estate-level decision to carry the fundamentals adoption pattern supplies the adoption authority; no earlier local Decision Record exists.

## Documentation impact

### Decision Records

This item creates the repository's root adoption record and canonical index. It adds no other decision.

### Specifications

No behaviour-level contract changes.

### Guides

No procedural guidance changes.

### Roadmap

This item remains the canonical delivery and review record for the adoption work.

## Review

### Delivered

From immutable baseline `b8a0af237814c4eb33a020a5c562963ac299fbcc`, commit `5cbd218ba54ddd67cd63ad4d0b0f7df0dc1a620b` establishes the canonical Decision Record collection, index, and root adoption record. The implementation stays within the approved boundary and adds no retrospective decisions.

### Change Summary

- Added `docs/decisions/README.md` with one ordered collection entry.
- Added `GDR-MCP-HG-001: Adopting Decision Records` as the repository's living root governance decision.
- Retained the existing `ki-decision-records` declaration and changed no runtime, specification, or guide surface.

### Verification

- `ki repo audit --skill ki-decision-records --repo .` - passed.
- `ki repo audit --skill ki-repo --repo .` - passed all three selected foundation skills.
- `ki repo audit --skill ki-authoring --repo .` - passed.
- `ki repo audit --skill ki-work-roadmap --repo .` - passed.
- `ki repo audit --repo .` - no failures; 13 skills passed and one existing `CFG-1` warning remained.

### Outstanding concerns

The full audit still reports the existing `CFG-1` warning because `src/config/index.ts` does not call `process.loadEnvFile`. `MCP-HG-FND-002` owns that separate host-configuration decision; this item deliberately does not reverse it.

### Post-change review

The collection satisfies the repository's declared capability and the estate-level adoption direction. Its single record is self-contained, correctly typed, indexed, and limited to the durable governance decision. No regression or unapproved scope expansion was found, so the item is ready for human acceptance review.

### Mini recap

This delivery replaces a missing declared capability with its minimum canonical collection and adoption decision. All focused gates pass, and the only full-audit warning is separately owned. No additional learning route or follow-up arises from this item.

## Done

Accepted 2026-09-26 by Kris Brown on the review packet above.

## Discussion

The estate direction requires every repository to carry the Decision Record fundamentals adoption pattern. This repository therefore keeps the capability and establishes only its minimum canonical collection, leaving any future standalone decisions to their own evidence and authority.
