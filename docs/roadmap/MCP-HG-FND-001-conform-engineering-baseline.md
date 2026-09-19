---
id: MCP-HG-FND-001
title: Conform engineering baseline
area: FND
theme: foundation-tooling
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 5c13237b98e916322e1f21fc46d25b6884ed939c
created_at: 2026-09-02T21:56:13Z
updated_at: 2026-09-19T17:44:00Z
---

## Goal

Conform the ChatGPT housekeeping MCP to the shared Knowledge Islands engineering baseline without changing its read-only opaque-session contract.

## Context

The provider adapter's three focused tests and TypeScript pass. A 2026-09-02 `ki-engineering` audit reports missing `mise.toml`, missing Knip configuration and gate, incomplete Vitest coverage thresholds/exclusions/report path, and a missing environment example despite environment loading.

## Boundary

Do not broaden ChatGPT store interpretation, add source mutation, expose credentials, or redesign the acquisition API. Preserve the opaque byte-for-byte adapter and its existing public tools.

## Current state

The repository now passes its declared engineering and roadmap audits with canonical toolchain pins, Knip coverage, a non-secret environment template, and enforced 100% Vitest thresholds.

## Steps

- [x] Add canonical Bun and Node toolchain pins.
- [x] Add Knip configuration and a passing package gate, removing genuine dead code rather suppressing it.
- [x] Set Vitest lines, functions, branches, and statements thresholds to 100%, exclude test sources, and write reports beneath `reports/coverage`.
- [x] Add CLI-driven coverage for reachable gaps and justify only genuinely unreachable guards.
- [x] Add a non-secret environment example or remove unnecessary environment loading.
- [x] Re-run focused provider tests, coverage, TypeScript, Knip, and the engineering audit.

## Files touched

- `mise.toml`
- `knip.json`
- `package.json`
- `vitest.config.ts`
- Provider tests and environment example as required by measured gaps
- This work item

## Verify

- `bun run test`
- `bun run test:coverage`
- `bunx tsc --noEmit`
- Knip package gate
- `ki repo audit --skill ki-engineering --repo .`
- `ki repo audit --skill ki-work-roadmap --repo .`

## Dependencies / blocks

No external dependency blocks delivery. Preserve the provider contract while applying the current shared engineering standard.

## Documentation impact

### Decision Records

None expected; this applies an existing engineering contract.

### Specifications

No behaviour change is intended.

### Guides

No guide change is expected unless environment setup is genuinely required.

### Roadmap

This directly owns the remedial engineering finding surfaced while revalidating `KI-HARNESS-OPS-005`.

## Review

### Delivered

Conformed the repository to the shared KI engineering baseline without changing its read-only opaque-session contract.

### Summary of changes

- Pinned Bun and Node with `mise.toml`, added the complete package-export entry set to Knip, and removed the unused `mcporter` dependency and destructive annotation presets.
- Added a non-secret environment example and removed package-local environment-file hydration; MCP clients remain the explicit configuration source.
- Enforced 100% statement, branch, function, and line coverage under `reports/coverage`, with focused tests for configuration, access gating, local-store behavior, audit logging, and result helpers.
- Removed an unreachable record-name guard by passing the already-validated identifier into session construction. The remaining synchronous record-race guard carries a narrow V8 exclusion and evidence comment.
- Conformed managed discovery exclusions and removed the obsolete `candidate` field from `MCP-HG-FND-002` so the repository roadmap audit passes.

### Verification

- `bun run test` — pass, 26 tests.
- `bun run test:coverage` — pass, 100% statements, branches, functions, and lines.
- `bun run build` and `bunx tsc --noEmit` — pass.
- `bunx knip` — pass; only the required managed-surface exclusion hints remain.
- `ki repo audit --skill ki-engineering --repo .` — pass.
- `ki repo audit --skill ki-work-roadmap --repo .` — pass.

### Outstanding concerns

The active Codex MCP process still needs a restart before the already-correct home-relative path expansion can be rechecked end to end. That runtime refresh belongs to `KI-HARNESS-OPS-005`, not this repository baseline.

### Post-change review

The provider remains read-only and opaque: no decoder, deletion, source mutation, credential surface, or public acquisition operation was added.

### Mini recap

The engineering baseline is complete and stable enough for human acceptance; the next acquisition action is a runtime restart and live discovery recheck from the Harness item.

## Done

Accepted 2026-09-19 by the repository owner on the review packet above.

## Discussion

Coverage work should test the public MCP or provider seam and avoid unit tests that freeze internal helpers.
