---
id: MCP-HG-FND-005
area: FND
title: Restore engineering audit
theme: foundation-tooling
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: f44157600e5030f1b7c8e7a615b54e66ba8d48ef
created_at: 2026-10-01T20:12:00Z
updated_at: 2026-10-02T02:56:52Z
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

- [x] Add the public Codex entry to Knip and narrowly ignore the external `codex` executable; retain the existing export and registered MCP tools.
- [x] Recheck installed Zod and SDK type compatibility, then remove or revise only the stale dependency hold.
- [x] Run Knip, TypeScript, tests, coverage, and focused engineering and roadmap audits; record any unrelated residual finding separately.

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

## Review

### Delivered

Restored the engineering audit from baseline `f44157600e5030f1b7c8e7a615b54e66ba8d48ef` in `c544392b5b5943a8ae5ee698ab9bb9a7bfa45a21`. The public `./codex` export and read-only MCP registration remain unchanged. No live ChatGPT or Codex store was accessed.

### Change Summary

`knip.json` now includes the public Codex source entry and narrowly ignores the external `codex` binary. `.ki.toml` no longer carries a Zod hold contradicted by the installed `zod` 4.6.5 and SDK 1.30.1 compatibility proven by TypeScript and tests. No runtime source changed.

### Verification

`bunx knip --reporter compact`, `bunx tsc --noEmit`, `bun run test` (70 tests), `bun run test:coverage`, and focused `ki-engineering` and `ki-work-roadmap` audits pass. The engineering audit initially found only Biome formatting in `knip.json`; formatting was applied and the audit reran clean.

### Outstanding concerns

The lasting public deletion-export policy remains an owner decision outside this configuration repair. Current developer guidance describes observed guarded behavior; this packet makes no future removal decision.

### Post-change review

The two Knip failures and stale hold warning are resolved without broad ignore rules, package-export removal, or runtime behavior changes. The targeted binary exception matches the package's intentional CLI invocation. Ready for owner acceptance of this bounded repair.

### Mini recap

The engineering audit passes with the intended public entry modeled and the obsolete hold removed. The separate export-policy question remains with the owner; it is not accepted by this review.

## Done

Accepted 2026-10-02 by Kris Brown on the review packet above.

## Discussion

### First verification

Inspect `knip.json`, the `package.json` export map, and actual tracked consumers. Add the intended public entry point to Knip's reachability model, then rerun Knip and the focused engineering audit. Separately verify the dependency version and current SDK type compatibility before removing or revising the outdated hold. This item does not decide the lasting public export policy; the current guide records observed behavior.
