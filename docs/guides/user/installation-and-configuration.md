# Install and configure the combined MCP server

Use a private local checkout with Bun for installation and development. The compiled server requires Node 22 or later. From this repository, run `bun install`, then `bun run build`. The executable for an MCP host is `node` with the absolute path to `dist/mcp-server/index.js` as its argument. `bun run ki:server:mcp:start` builds and starts that same compiled server; `bun run ki:server:mcp:dev` runs the watched source during development.

Give your MCP host a stdio server entry equivalent to this host-neutral shape, replacing the checkout path and optional store path with real values:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/mcp-housekeeping-chatgpt/dist/mcp-server/index.js"],
  "env": {
    "MCP_HOUSEKEEPING_CHATGPT_PATH": "/absolute/path/to/a/physical-chatgpt-store"
  }
}
```

The ChatGPT path is optional. Omit the entire `env` entry when you only need Codex; its four tools register unconditionally. Supplying a ChatGPT path registers its four tools, but discovery still fails if the physical store is missing, unreadable, or a symlink. Codex calls require an installed `codex` executable whose `app-server` capability can start. The server itself does not read a Codex store path from configuration.

`MCP_HOUSEKEEPING_CHATGPT_PATH` accepts an absolute path, `~`, or a `~/` path; relative values resolve from the server process working directory. Use a physical directory containing `project-*` children and `conversations-v3-*` record directories. A configured path does not authorize source mutation.

The optional `MCP_HOUSEKEEPING_CHATGPT_ACCESS_LEVEL` accepts `read`, `write`, or `destructive` and defaults to `read`. Every currently registered MCP tool declares itself read-only, so the default exposes both adapters' tools. Raising the access level does not add a deletion tool. The separate `./codex` library export has its own guarded deletion helper and is outside these MCP registrations.

Audit settings are optional: `MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG` is `off`, `writes` (default), or `all`; `MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_PATH` selects the local JSONL destination; `MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_MAX_BYTES` defaults to 10 MiB; and `MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_KEEP` defaults to 5 rotated files. The default destination is `<ChatGPT store>/audit/audit.jsonl` when a store is configured, otherwise `~/.local/state/mcp-housekeeping-chatgpt/audit.jsonl`. `all` records read-tool calls, so it can write audit state even though those tools do not change source sessions. Choose an audit destination the server process can write if enabling it.

When started with the actual process environment, the config loader also attempts `.env.local`, `.env.<NODE_ENV>`, then `.env` under this package root. Missing files are ignored. A host-supplied environment is the clearest production configuration; do not put secrets or personal store paths into tracked files. Check successful registration by listing tools in the MCP host: Codex tools appear with no ChatGPT path, and ChatGPT tools appear only when the path is configured.
