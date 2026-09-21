---
id: MCP-HG-FND-004
title: Establish audience-centric guides
area: FND
theme: foundation-tooling
horizon: now
status: draft
blocks: []
blocked_by: []
transferred_from: ki-website
baseline_ref: null
created_at: 2026-09-21T17:20:00Z
updated_at: 2026-09-21T17:20:00Z
---

## Goal

A reader can find practical instructions for this server grouped by the audience that needs them, and the repository declares `ki-guides` so that grouping is gated rather than conventional.

## Context

`mcp-housekeeping-chatgpt` has no `docs/guides/` and does not declare `ki-guides`. Its README is seven lines: what the server reads, the environment variable that points at it, and the file pattern. There is no installation guide, no client configuration, no account of what the server exposes, and no troubleshooting.

Seven lines is not a small documentation debt because the server is small — it is the whole of the user-facing explanation for a tool someone has to configure against their own ChatGPT export.

KI Website now declares, for every page it publishes under `apps/site/src/guidance/`, the exact upstream document and pinned ref that page was written from, and a `verify:guidance --network` sweep reports the pages whose source has moved. The site intends to derive public guidance for this project from this repository's own guides and cite them at a pinned ref, so the quality and stability of `docs/guides/` here directly determines the quality of what the site can publish.

That is a pull, not an obligation: KI Website derives, it does not own. This repository decides what its guides say and when they change.

Separately, `ki-guides` is being asked to require audience directories under `docs/guides/` rather than permitting a flat collection (`ki-agentic-harness` `KI-HARNESS-GOV-083`). If that lands, this repository's collection has to satisfy it.

## Boundary

Adopted into `Now` by explicit approval, so this is prioritised work rather than intake. It remains `status: draft`: `ki-plan` shapes it to `Ready` before any implementation, and this repository still owns its plan and sequencing.

KI Website derives and cites; it does not own this collection and must not be given approval rights over it. Nothing here requires a guide to be written for the website's benefit — if a guide would not serve this repository's own readers, it should not exist.

## Shaping

- Decide the audience directories this server needs. `user/` covers someone pointing it at their own export; `developer/` covers someone changing its code.
- Write what does not exist rather than moving what does: there is almost nothing in the README to relocate.
- Cover the path discovery rules explicitly, since `MCP_HOUSEKEEPING_CHATGPT_PATH` and the `*.data` pattern are the whole configuration surface and the failure mode when they are wrong is silence.
- Declare `[skills.ki-guides]` in `.ki.toml` and run the guides audit to gate the result.

## Current state

No `docs/guides/` directory, no `[skills.ki-guides]` in `.ki.toml`, and a seven-line README. Nothing gates whether a collection exists or what shape it takes, and there is almost no existing prose to consolidate.

## Steps

- [ ] Name the audiences this server actually has.
- [ ] Create `docs/guides/README.md` as the collection index, routing by audience and nothing else.
- [ ] Create one directory per named audience, each with its own index.
- [ ] Write the guides: installation, MCP client configuration, the export path and file pattern it expects, what the tools return, and what a misconfigured path looks like.
- [ ] Leave the README as orientation, linking to the collection.
- [ ] Declare `[skills.ki-guides]` in `.ki.toml`.
- [ ] Run the guides audit and repair what it reports.

## Files touched

`docs/guides/` (new), `.ki.toml`, `README.md`.

## Verify

`ki repo audit --skill ki-guides --repo .` passes, and `ki repo audit --skill ki-authoring --repo .` passes over the collection.

## Dependencies / blocks

Nothing blocks this. `KI-HARNESS-GOV-083` in `ki-agentic-harness` proposes making audience directories a `ki-guides` requirement: if it lands first this collection satisfies it by construction, and if it lands later this collection already conforms. KI Website intends to derive public guidance from these guides and cite them at a pinned ref, but it derives rather than owns and its schedule does not gate this work.

## Documentation impact

### Decision Records

No decision record is needed. Audience-centric grouping is the house arrangement `ki-guides` already encodes, so adopting it here is conformance rather than a new decision. One becomes owed only if this repository concludes it needs an exception.

### Specifications

No behaviour-level contract changes. This item changes only where instructions live and who they are written for.

### Guides

This item is entirely guide impact: it establishes or completes the collection, its audience directories, and their indexes.

### Roadmap

No further roadmap change is expected. If writing the guides exposes behaviour that cannot honestly be explained, that is a separate item raised at the time.

## Discussion

Shaping settles how far this goes, not whether it happens. The prompting question is whether a reader who has never opened this repository can do what it is for without reading source.
