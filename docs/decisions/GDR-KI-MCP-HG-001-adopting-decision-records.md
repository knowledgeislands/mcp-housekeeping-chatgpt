---
id: GDR-KI-MCP-HG-001
title: 'Adopting Decision Records'
date: 2026-09-26
status: current
decision_type: governance
decision_type_url: https://knowledgeislands.info/specifications/decision-records/gdr
---

# GDR-KI-MCP-HG-001: Adopting Decision Records

## Context

This repository makes durable choices about governance, architecture, security, operations, and the boundaries of its read-only ChatGPT acquisition surface. Those choices need a concise home that remains distinct from implementation details, procedural guidance, accepted behaviour, and future delivery work.

Without a consistent decision instrument, rationale can become scattered across pull requests, roadmap records, or general documentation. Readers then have to reconstruct which choices still govern the repository and which text merely describes an implementation or a planned change. A typed, indexed collection gives each significant standalone decision a stable identity and an intentional reading order.

## Decision

This repository adopts the Knowledge Islands Decision Records standard. Significant standalone decisions are recorded under `docs/decisions/`, use the type-specific identifier appropriate to the decision, and appear in this collection's ordered index. Each record remains a living present-state account that is revised in place when its decision changes.

## Consequences

Durable decisions have a discoverable, reviewable home and can be cited by stable identifier. The collection remains self-contained and readable without relying on delivery history.

Authors must distinguish a lasting decision from explanatory documentation, procedural guidance, accepted behaviour, and roadmap work. Maintaining the collection adds a small authoring cost, but avoids retrospective decision archaeology and keeps current authority explicit.
