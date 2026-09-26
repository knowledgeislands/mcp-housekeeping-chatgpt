---
id: MCP-HG-FND-003
area: FND
title: Resolve Decision Record Adoption
theme: foundation-tooling
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-14T22:06:30Z
updated_at: 2026-09-26T17:59:05Z
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

- [ ] Create `docs/decisions/README.md` as the collection index.
- [ ] Create `GDR-MCP-HG-001: Adopting Decision Records` as the first and only indexed record.
- [ ] Keep the record self-contained, current, and limited to adopting the Decision Record instrument.
- [ ] Run the focused Decision Record, repository, authoring, and roadmap audits, followed by the full repository audit.

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

## Discussion

The estate direction requires every repository to carry the Decision Record fundamentals adoption pattern. This repository therefore adopts the capability and prioritises the missing collection as current work. Planning must define the initial index shape and focused verification before implementation begins.
