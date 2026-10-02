---
id: MCP-HG-FND-005
area: FND
title: Restore engineering audit
theme: foundation-tooling
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-10-01T20:12:00Z
updated_at: 2026-10-02T02:23:36Z
---

## Goal

The repository's engineering audit passes while retaining the intended public Codex library export and an accurate dependency policy.

## Context

The 2026-10-01 `ki repo audit --skill ki-engineering --repo .` reports two failures: `KNIP-2` (Knip fails) and `KNIP-3` (the exported `./codex` module at `src/main/codex/app-server.ts` is not reachable from a configured Knip entry point). It also warns under `DEPS-1` that the Zod dependency hold names an unavailable update, while `package.json` already declares `zod` 4.6.5. The historical authoring audit found these current, distinct findings and does not own their repair.

## Boundary

Reconcile Knip's public entry points and the stale dependency hold against current package exports and tested compatibility. Do not remove the reviewed `./codex` export merely to satisfy Knip, alter the guarded deletion contract, publish a package, or change any live ChatGPT or Codex session state.

## Current state

`package.json` exports `./codex`, but `knip.json` omits its source entry. Knip also treats the intentionally invoked external `codex` executable as an unlisted dependency. A temporary configuration with the public entry and an `ignoreBinaries` exception passed Knip without changing the export. The Zod hold in `.ki.toml` names an older compatibility limit than the installed Zod and SDK versions.

## Steps

- [ ] Add the public Codex entry to Knip and narrowly ignore the external `codex` executable; retain the existing export and registered MCP tools.
- [ ] Recheck installed Zod and SDK type compatibility, then remove or revise only the stale dependency hold.
- [ ] Run Knip, TypeScript, tests, coverage, and focused engineering and roadmap audits; record any unrelated residual finding separately.

## Files touched

`knip.json`, `.ki.toml`, and this roadmap item.

## Verify

Run `bunx knip --reporter compact`, `bunx tsc --noEmit`, `bun run test`, `bun run test:coverage`, and focused `ki-engineering` and `ki-work-roadmap` audits. Verification uses fixtures and static checks only; no live session or deletion operation is permitted.

## Dependencies / blocks

No delivery dependency. The public deletion-export policy remains a separate owner decision and is not changed here.

## Documentation impact

### Decision Records

No new export or API decision is made.

### Specifications

The package export and existing tests remain the accepted behavior.

### Guides

No user workflow changes; existing guidance continues to describe the public library boundary.

### Roadmap

Retain this item for the review packet and explicit acceptance.

## Discussion

### First verification

Inspect `knip.json`, the `package.json` export map, and actual tracked consumers. Add the intended public entry point to Knip's reachability model, then rerun Knip and the focused engineering audit. Separately verify the dependency version and current SDK type compatibility before removing or revising the outdated hold. This item does not decide the lasting public export policy; the current guide records observed behavior.
