# AGENTS.md

## Architecture

Engineering follows `ki-engineering`, and the server's shape follows `ki-repo-mcp`: its layout, configuration injection, tool naming, annotation-driven access gate and security invariants. Production configuration comes from the MCP host environment.

Keep ChatGPT source records opaque. ChatGPT local-store reads live under `src/main/chatgpt/`, while Codex app-server inspection lives under `src/main/codex/`.

This dependency direction is enforced, not just described: [.dependency-cruiser.ts](./.dependency-cruiser.ts) states each boundary as a named rule and [src/boundaries.test.ts](./src/boundaries.test.ts) cruises the source graph and proves every rule still rejects a deliberate crossing. The checker runs from its own install root, `tooling/depcruise`, because dependency-cruiser needs a TypeScript below 7.

## Safety

The MCP surface is read-only. Constrain filesystem access to the configured ChatGPT store and Codex's exact physical-repository session boundary; preserve opaque identities and bytes, reject traversal and symlink escapes, and never decode, archive, delete, or mutate source records. Tests use isolated fixtures and never real ChatGPT or Codex session stores.

Use `ki-authoring` for Markdown and TOML conventions, `ki-engineering` for the TypeScript/Bun toolchain, and `ki-git` for commits and shared-tree safety.
