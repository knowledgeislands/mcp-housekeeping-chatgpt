---
id: MCP-HG-FND-005
area: FND
title: Restore engineering audit
theme: foundation-tooling
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-10-01T20:12:00Z
updated_at: 2026-10-01T20:12:00Z
---

## Goal

The repository's engineering audit passes while retaining the intended public Codex library export and an accurate dependency policy.

## Context

The 2026-10-01 `ki repo audit --skill ki-engineering --repo .` reports two failures: `KNIP-2` (Knip fails) and `KNIP-3` (the exported `./codex` module at `src/main/codex/app-server.ts` is not reachable from a configured Knip entry point). It also warns under `DEPS-1` that the Zod dependency hold names an unavailable update, while `package.json` already declares `zod` 4.6.5. The [historical audit review](MCP-HG-FND-002-review-authoring-audit.md) found these current, distinct findings and does not own their repair.

## Boundary

Reconcile Knip's public entry points and the stale dependency hold against current package exports and tested compatibility. Do not remove the reviewed `./codex` export merely to satisfy Knip, alter the guarded deletion contract, publish a package, or change any live ChatGPT or Codex session state.

## Discussion

### First verification

Inspect `knip.json`, the `package.json` export map, and actual tracked consumers. Add the intended public entry point to Knip's reachability model, then rerun Knip and the focused engineering audit. Separately verify the dependency version and current SDK type compatibility before removing or revising the outdated hold. Keep the export-policy decision in the [Codex boundary review](../../../mcp-housekeeping-codex/docs/roadmap/MCP-HC-FND-003-clarify-destructive-library-boundary.md); this intake does not decide it.
