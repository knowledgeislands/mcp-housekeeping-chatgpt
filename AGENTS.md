# AGENTS.md

## Architecture

Engineering follows `ki-engineering`, and the server's shape follows `ki-repo-mcp`: its layout, configuration injection, tool naming, annotation-driven access gate and security invariants. The `@modelcontextprotocol/sdk` major 1 dependency selects the legacy protocol profile.

`MCP_HOUSEKEEPING_CHATGPT_PATH` names the ChatGPT store: the `chatgpt_*` tools register only when it is set, and the audit log then defaults beneath it. The `codex_*` tools always register.

Keep ChatGPT source records opaque. ChatGPT local-store reads live under `src/main/chatgpt/`, while Codex app-server inspection lives under `src/main/codex/`, which spawns `codex app-server` and speaks to it over stdio. Each request is bounded by `APP_SERVER_REQUEST_TIMEOUT_MS` (20 seconds) and each message by `APP_SERVER_MAX_MESSAGE_BYTES` (32 MiB): past either, the subprocess is killed and the call fails with an error naming the cause. `codex --version` runs under the same 20-second bound.

This dependency direction is enforced, not just described: [.dependency-cruiser.ts](./.dependency-cruiser.ts) states each boundary as a named rule and [src/boundaries.test.ts](./src/boundaries.test.ts) cruises the source graph and proves every rule still rejects a deliberate crossing. The checker runs from its own install root, `tooling/depcruise`, because dependency-cruiser needs a TypeScript below 7.

## Safety

The MCP surface is read-only. Constrain filesystem access to the configured ChatGPT store and Codex's exact physical-repository session boundary; preserve opaque identities and bytes, reject traversal and symlink escapes, and never decode, archive, delete, or mutate source records through the MCP. The one deletion is the `delete` mode of the Codex module's own command line (`src/main/codex/app-server.ts`), outside the MCP: it removes only root threads named in a reviewed inventory artifact, after re-checking the repository, Codex version, protocol fingerprint and each thread, and only with the explicit confirmation. Tests use isolated fixtures and never real ChatGPT or Codex session stores.

Use `ki-authoring` for Markdown and TOML conventions, `ki-engineering` for the TypeScript/Bun toolchain, and `ki-git` for commits and shared-tree safety.
