---
id: MCP-HG-FND-002
title: Review authoring audit
area: FND
theme: foundation-tooling
horizon: future
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-04T08:54:05Z
updated_at: 2026-09-19T17:48:00Z
---

## Goal

Resolve the remaining live repository-settings findings and decide whether explicit host-only environment loading remains the intended MCP configuration contract.

## Context

The local estate baseline now passes authoring, engineering, MCP, trade, roadmap, TypeScript, build, test, 100% coverage, Biome, Knip, Syncpack, and dependency gates.

GitHub still reports no detected licence, a description that differs from `.ki.toml`, merge methods beyond squash, branch auto-delete off, Projects on, Dependabot alerts and security updates off, and update-branch suggestions off. The MCP audit also warns that `src/config/index.ts` deliberately does not call `process.loadEnvFile`; the accepted engineering review records explicit MCP-host configuration as the intended source.

## Boundary

This is a discussion proposal only. It is not accepted, prioritised, or implementation authority. It does not mutate live GitHub settings or reverse the accepted configuration decision without review.

## Shaping

Review the exact GitHub settings diff and licence-detection consequence after the local `LICENSE` commit reaches the default branch. Reconcile the host-only configuration decision with the current MCP standard warning and document an exception or restore file hydration with tests.

## Discussion

The live GitHub changes require an exact reviewed confirmation. The configuration warning is currently warranted by the accepted FND-001 review, but the standard and repository should converge rather than retain unexplained drift.
