---
id: MCP-HG-FND-002
title: Review authoring audit
area: FND
theme: foundation-tooling
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-04T08:54:05Z
updated_at: 2026-10-01T19:30:29Z
---

## Goal

Reconcile the historical authoring/configuration and repository-setting findings with current evidence, yielding an exact remaining-action list or a supported no-remediation recommendation.

## Context

The previous checkpoint records package environment hydration, description alignment, and Decision Records adoption as delivered locally. It also reported a then-current Knip entry-point failure. The old Context asserted a host-only configuration contract and broad clean gates; those statements must not be treated as current findings. Reported remote GitHub settings require a fresh read-only comparison.

## Boundary

A bounded evidence reconciliation and recommendation only. Do not modify application code, configuration, GitHub settings, runtime bindings, dependencies, or source stores. Do not accept or prune historical records. Fresh findings are classified and scoped for later selection, not repaired during this review.

## Current state

The retained checkpoint below supplies the historical references. Current inputs are `src/config/index.ts`, `src/config/index.test.ts`, `package.json`, `knip.json`, `.ki.toml`, `LICENSE`, `docs/decisions/`, Git history for the cited baseline, and read-only GitHub repository metadata. The checkpoint is evidence to test, not a guarantee that its findings or clean gates remain current.

## Steps

- [ ] Pin local HEAD and recover the historical acceptance criteria from retained records, cited commits, and their governed standard; label any unavailable original evidence explicitly.
- [ ] Run fresh focused `ki-repo`, `ki-repo-mcp`, `ki-engineering`, and `ki-decision-records` audits sequentially, preserving exact finding identities and exit codes. Check the Codex export's current Knip entry-point reachability instead of assuming the checkpoint failure persists.
- [ ] Inspect environment hydration and its tests and trace the cited host-only rationale. Report whether code and accepted policy agree, with a specific documentation/decision follow-on if they differ; do not implement or reverse configuration policy here.
- [ ] Read current GitHub metadata through the authenticated read-only API/CLI and compare only the originally reported licence, description, merge, branch-delete, Projects, dependency-security, and update-branch settings against current declared policy. Distinguish local/default-branch divergence and permission-denied fields from actual misconfiguration. If access is unavailable, report exact unverified fields; do not invent their values.
- [ ] Add an evidence matrix in this record's Discussion: historical finding, current observation, source/ref/command, resolved or still applicable, acceptance-criteria confidence, and narrowly scoped recommended next action. Classify remote changes as proposed exact diffs requiring their own reviewed authority.
- [ ] Prepare the review packet and run the roadmap/authoring checks; recommend disposition without marking this or historical delivery accepted.

## Files touched

This roadmap record only. All listed source, history, standard, and remote evidence inputs are read-only. Put the durable evidence summary and recommendation in the record; temporary raw command logs do not become a new repository documentation surface.

## Verify

Every historical finding must be accounted for as evidenced resolved, presently applicable, or explicitly unverified; include audit command exit codes and pinned local/default-branch evidence where accessible. No live settings, source configuration, or dependency changes occur. A passing fresh audit alone is not acceptance of historical work. Run `ki repo audit --skill ki-work-roadmap --repo .`, `ki repo audit --skill ki-authoring --repo .`, and `bunx rumdl check docs/roadmap/MCP-HG-FND-002-review-authoring-audit.md` sequentially. Audit failures in the reviewed contract are review results to classify, not authority to repair unrelated files.

## Dependencies / blocks

No build-order blocker to the review. Missing historical material or unavailable remote fields are explicit findings and constrain the recommendation; they do not justify claiming a verified repair or starting implementation. Reconcile any live delivery claims before a later implementation assignment; this read-only evidence review does not release other owners.

## Documentation impact

### Decision Records

Trace any existing rationale in the evidence matrix. Recommend a separately reviewed decision only where the current policy needs clarification; do not fabricate an accepted decision during an audit review.

### Specifications

No behaviour contract changes. Cite criteria and distinguish current observation from the desired rule.

### Guides

No guide changes in this review. Identify a precise guide mismatch as a follow-on only if the evidence establishes one.

### Roadmap

Enrich this retained item with a review deliverable and exact remaining-action recommendations. Do not self-accept, duplicate delivered repairs, or close historical work through a status edit.

## Discussion

### Bounded review outcome

Readiness applies to the evidence reconciliation and recommendation. A supported no-remediation conclusion is useful delivery; implementation of speculative fixes is not part of this plan. The existing pickup checkpoint remains below as historical input.

The earlier review treated the host-only configuration warning as warranted. Environment hydration has since landed, so this investigation must reconcile the accepted rationale with current code before recommending any policy or implementation change. Any proposed live GitHub setting changes still require an exact reviewed decision.

### Pickup checkpoint — 2026-09-28

At local `main` `c96355e53badb7a07d0cafa3508a0966d795d08d`, `82cd193bded5c6274f930919da7a1259fed5234a` added package `.env` loading to `src/config/index.ts:13` with tests in `src/config/index.test.ts:17`; the Context's claim that `process.loadEnvFile` is deliberately absent is now historical. `a29715dce574ad10e358b6702e9c4a95828121d2` aligned `package.json:3`'s description with `.ki.toml:18`, and `5cbd218ba54ddd67cd63ad4d0b0f7df0dc1a620b` adopted Decision Records in `docs/decisions/GDR-MCP-HG-001-adopting-decision-records.md` and `docs/decisions/README.md`. These local changes do not verify the reported live GitHub settings.

A fresh `ki repo audit --repo .` passed 16 of 17 selected skills and failed `ki-engineering`: Knip fails, and `knip.json` does not make the newer `./codex` export at `src/main/codex/app-server.ts` reachable from an entry point. That export was added in `67f6b5436a8f69142ee53a0df085f083cd3aed4d` (`package.json`). This is a current, distinct failure; the Context's blanket claim that engineering and Knip pass is stale. No executable suite or live GitHub check was run for this documentation-only audit.

Remaining: reconcile the now-implemented environment loading with the accepted FND-001 rationale, obtain exact current GitHub setting evidence and original finding criteria, and decide the disposition of this record; route the new Knip failure to its proper owner without treating it as resolved here. Before implementation, reconcile destination `main`, linked tasks, and retained worktrees; only the primary worktree was visible locally, and remote task ownership was unavailable. Missing evidence does not release a claim or lift a hold. This checkpoint is pickup guidance, not execution block or resumption authority. Draft/Future state remains unchanged; eventual closure requires review and explicit owner acceptance, with any Done record retained until separately selected for pruning.
