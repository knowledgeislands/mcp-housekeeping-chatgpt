# AGENTS.md

## Runtime

Use Bun for installation, development, and tests; use `bun run test`, never `bun test`. Published `dist/` output runs under Node 22 or later. Production configuration comes from the MCP host environment.

## Architecture

Keep ChatGPT source records opaque. Tool modules validate and adapt MCP envelopes; ChatGPT local-store reads live under `src/main/chatgpt/`, while Codex app-server inspection lives under `src/main/codex/`. Load configuration once in the server entry point and pass the smallest values needed into implementation functions. Reusable access, audit, result, and path helpers belong under `src/utils/`.

This dependency direction is enforced, not just described: [.dependency-cruiser.ts](./.dependency-cruiser.ts) states each boundary as a named rule and [src/boundaries.test.ts](./src/boundaries.test.ts) cruises the source graph and proves every rule still rejects a deliberate crossing. The checker runs from its own install root, `tooling/boundaries`, because dependency-cruiser needs a TypeScript below 7.

## Safety

The MCP surface is read-only. Constrain filesystem access to the configured ChatGPT store and Codex's exact physical-repository session boundary; preserve opaque identities and bytes, reject traversal and symlink escapes, and never decode, archive, delete, or mutate source records. Tests use isolated fixtures and never real ChatGPT or Codex session stores.

Use `ki-authoring` for Markdown and TOML conventions, `ki-engineering` for the TypeScript/Bun toolchain, and `ki-git` for commits and shared-tree safety.
