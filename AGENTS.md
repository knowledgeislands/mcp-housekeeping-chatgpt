# AGENTS.md

## Runtime

Use Bun for installation, development, and tests; use `bun run test`, never `bun test`. Published `dist/` output runs under Node 22 or later. Production configuration comes from the MCP host environment.

## Architecture

Keep ChatGPT source records opaque. Tool modules validate and adapt MCP envelopes; local-store discovery and reads live under `src/main/chatgpt/`. Load configuration once in the server entry point and pass the smallest values needed into implementation functions. Reusable access, audit, result, and path helpers belong under `src/utils/`.

## Safety

The MCP surface is read-only. Constrain filesystem access to the configured ChatGPT store, preserve opaque identities and bytes, reject traversal and symlink escapes, and never decode, archive, delete, or mutate source records. Tests use isolated fixtures and never real ChatGPT session stores.

Use `ki-authoring` for Markdown and TOML conventions, `ki-engineering` for the TypeScript/Bun toolchain, and `ki-git` for commits and shared-tree safety.
