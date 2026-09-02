---
id: MCP-HG-FND-001
title: Conform engineering baseline
area: FND
theme: foundation-tooling
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Conform the ChatGPT housekeeping MCP to the shared Knowledge Islands engineering baseline without changing its read-only opaque-session contract.

## Context

The provider adapter's three focused tests and TypeScript pass. A 2026-09-02 `ki-engineering` audit reports missing `mise.toml`, missing Knip configuration and gate, incomplete Vitest coverage thresholds/exclusions/report path, and a missing environment example despite environment loading.

## Boundary

Do not broaden ChatGPT store interpretation, add source mutation, expose credentials, or redesign the acquisition API. Preserve the opaque byte-for-byte adapter and its existing public tools.

## Current state

The implementation is viable and tested but cannot pass the repository's declared engineering audit until the shared toolchain, dead-code, coverage, and environment-template surfaces are present.

## Steps

- [ ] Add canonical Bun and Node toolchain pins.
- [ ] Add Knip configuration and a passing package gate, removing genuine dead code rather suppressing it.
- [ ] Set Vitest lines, functions, branches, and statements thresholds to 100%, exclude test sources, and write reports beneath `reports/coverage`.
- [ ] Add CLI-driven coverage for reachable gaps and justify only genuinely unreachable guards.
- [ ] Add a non-secret environment example or remove unnecessary environment loading.
- [ ] Re-run focused provider tests, coverage, TypeScript, Knip, and the engineering audit.

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

## Discussion

Coverage work should test the public MCP or provider seam and avoid unit tests that freeze internal helpers.
