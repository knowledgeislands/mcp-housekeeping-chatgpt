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
updated_at: 2026-09-27T23:17:36Z
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

### Pickup checkpoint — 2026-09-28

At local `main` `c96355e53badb7a07d0cafa3508a0966d795d08d`, `82cd193bded5c6274f930919da7a1259fed5234a` added package `.env` loading to `src/config/index.ts:13` with tests in `src/config/index.test.ts:17`; the Context's claim that `process.loadEnvFile` is deliberately absent is now historical. `a29715dce574ad10e358b6702e9c4a95828121d2` aligned `package.json:3`'s description with `.ki.toml:18`, and `5cbd218ba54ddd67cd63ad4d0b0f7df0dc1a620b` adopted Decision Records in `docs/decisions/GDR-MCP-HG-001-adopting-decision-records.md` and `docs/decisions/README.md`. These local changes do not verify the reported live GitHub settings.

A fresh `ki repo audit --repo .` passed 16 of 17 selected skills and failed `ki-engineering`: Knip fails, and `knip.json` does not make the newer `./codex` export at `src/main/codex/app-server.ts` reachable from an entry point. That export was added in `67f6b5436a8f69142ee53a0df085f083cd3aed4d` (`package.json`). This is a current, distinct failure; the Context's blanket claim that engineering and Knip pass is stale. No executable suite or live GitHub check was run for this documentation-only audit.

Remaining: reconcile the now-implemented environment loading with the accepted FND-001 rationale, obtain exact current GitHub setting evidence and original finding criteria, and decide the disposition of this record; route the new Knip failure to its proper owner without treating it as resolved here. Before implementation, reconcile destination `main`, linked tasks, and retained worktrees; only the primary worktree was visible locally, and remote task ownership was unavailable. Missing evidence does not release a claim or lift a hold. This checkpoint is pickup guidance, not execution block or resumption authority. Draft/Future state remains unchanged; eventual closure requires review and explicit owner acceptance, with any Done record retained until separately selected for pruning.
