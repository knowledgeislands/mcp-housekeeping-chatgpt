---
id: MCP-HG-FND-004
title: Establish audience-centric guides
area: FND
theme: foundation-tooling
horizon: now
status: ready
blocks: []
blocked_by: []
transferred_from: ki-website
baseline_ref: null
created_at: 2026-09-21T17:20:00Z
updated_at: 2026-10-01T19:27:46Z
---

## Goal

A reader can configure and use the combined ChatGPT and Codex MCP adapters, understand their acquisition boundaries, and find the practical instructions for their role.

## Context

The surviving server now registers the Codex adapter unconditionally and ChatGPT tools when `MCP_HOUSEKEEPING_CHATGPT_PATH` is configured. The retiring `mcp-housekeeping-codex` README directs readers here. The old ChatGPT-only guide proposal therefore misses half the current product. There is still no `docs/guides/` or `ki-guides` declaration.

The README describes opaque ChatGPT acquisition and exact physical-repository Codex matching. `src/config/index.ts` additionally owns access, audit, optional package environment hydration, and audit destination defaults; these need accurate configuration guidance. The exported Codex library also contains guarded deletion, while MCP registrations are read-only. Guide claims must distinguish those surfaces.

KI Website may derive guidance and cite this repository at a pinned ref, but this repository owns the source instructions and their release timing.

## Boundary

Documentation and the `ki-guides` declaration only. Describe the installed behaviour, with fixture-based examples; do not change acquisition, exports, runtime bindings, external stores, or the guarded deletion contract. Do not claim the whole library is read-only merely because all registered MCP tools are. Do not add a second guide collection in the superseded Codex repository.

## Current state

The source of truth is `src/config/index.ts`, `src/mcp-server/register.ts`, `src/tools/chatgpt/index.ts`, `src/tools/codex/index.ts`, and both `src/main/` adapters. Package scripts provide local build, development, inspection, and compiled Node startup; distribution is a private local checkout. ChatGPT records are opaque `*.data` files, not a decoded export format. No guide collection currently explains setup, empty inventories, provenance, or safe downstream staging for either adapter.

## Steps

- [ ] Create `docs/guides/README.md`, `user/README.md`, and `developer/README.md`, routing installation and operation to users and source maintenance to developers.
- [ ] Write `user/installation-and-configuration.md` from the local checkout scripts, Node/Bun requirements, optional ChatGPT path, unconditional Codex registration, environment hydration, access level, and audit options. Include a host-neutral stdio configuration example without changing any real host binding or recommending registry publication.
- [ ] Write `user/acquiring-sessions.md` with ChatGPT discovery/list/read/checkpoint and Codex repository-scoped equivalents, opaque identities/bytes and provenance, physical-repository matching, and the handoff to `ki acquire import`. Keep the current tool inventory in the README as reference and link to it rather than duplicating schemas in prose.
- [ ] Write `user/troubleshooting.md` for an absent ChatGPT path/tool group, a missing or unreadable store, no matching records, a missing Codex executable/app-server capability, and an empty exact-repository inventory. Describe actual error/empty-result behaviour from fixtures without accessing live session stores.
- [ ] Write `developer/local-development.md` covering configuration injection, read-only tool annotations, isolated fixtures, build/test/typecheck, and the boundary between MCP acquisition and the separate exported review/deletion helper. Link existing source and the predecessor boundary record without endorsing or changing its unresolved public API policy.
- [ ] Keep the README as orientation, current tool reference, and guide entry point; declare `[skills.ki-guides]` in `.ki.toml`.
- [ ] Verify all commands, paths, environment names, and tool names against current source and package scripts, then run the focused audits and link checks.

## Files touched

`README.md`, `.ki.toml`, and the seven guide files named above. The work creates no source-code changes and does not edit the retired Codex repository.

## Verify

Run `ki repo audit --skill ki-guides --repo .`, `ki repo audit --skill ki-authoring --repo .`, and `ki repo audit --skill ki-work-roadmap --repo .` sequentially; each must pass. Run `bunx rumdl check README.md docs/guides` and resolve local Markdown links. Inspect both documented startup modes against `src/mcp-server/register.test.ts`; the Codex-only setup must not imply a required ChatGPT store. Review every claim of read-only behaviour against the registered MCP surface and the separate library export. No command should read or mutate the user's real session store during documentation verification.

## Dependencies / blocks

No build-order blocker. [The predecessor guide item](../../../mcp-housekeeping-codex/docs/roadmap/MCP-HC-FND-004-establish-audience-centric-guides.md) is superseded in practical scope by this combined collection, but this item does not close it. The predecessor's unresolved library-boundary record does not block documenting the present distinction accurately. KI Website derives and does not approve these guides.

## Documentation impact

### Decision Records

No new runtime or export policy is decided. Record a decision separately only if implementation proposes changing the observed public-library contract; that is outside this guide delivery.

### Specifications

No behaviour changes. Configuration and tool behaviour are described from existing source and fixtures.

### Guides

Establish the user and developer collection for both adapters, with configuration, acquisition, troubleshooting, and development instructions.

### Roadmap

Preserve the existing guide identity and website origin. Record successor coverage in the retired Codex guide item without accepting or pruning it. Any runtime mismatch found while writing becomes separately scoped work rather than an undocumented change.

## Discussion

### Audience and product boundary

User and developer directories are a repository-local navigation choice, not a universal requirement of `ki-guides`. The consolidated server needs one collection that explains each adapter's different evidence model: opaque ChatGPT records and Codex app-server sessions matched to a physical repository.

### Source ownership

The website can cite stable repository guidance; its publishing schedule does not gate this work. The public library deletion question remains separate from writing an accurate MCP acquisition guide.
