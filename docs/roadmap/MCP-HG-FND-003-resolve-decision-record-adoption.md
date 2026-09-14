---
id: MCP-HG-FND-003
area: FND
title: Resolve Decision Record Adoption
theme: foundation-tooling
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-14T22:06:30Z
updated_at: 2026-09-14T22:06:30Z
---

## Goal

Decide whether this repository adopts the declared Decision Record capability or
removes its declaration.

## Context

The repository declares `ki-decision-records` in `.ki.toml`, but the estate audit
found no canonical Decision Record collection root or index. The declaration
therefore fails the capability's `ROOT-1` and `INDEX-1` checks.

## Boundary

This is a discussion proposal only. It does not author a Decision Record, create
the collection, or remove the declaration. Any adopted implementation must
preserve existing repository history and scope.

## Discussion

Choose one coherent contract: create the canonical collection root and index
because this repository will own decisions, or remove `ki-decision-records` from
`.ki.toml` because the capability is not adopted here. If adoption is chosen,
planning should define the initial index shape and verification without inventing
retrospective decisions.
