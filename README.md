# mcp-housekeeping-chatgpt

Read-only MCP adapter for the ChatGPT product family: the installed ChatGPT store and repository-scoped Codex sessions.

It exposes `discover`, `list`, `read`, and `checkpoint` operations for the physical store set by `MCP_HOUSEKEEPING_CHATGPT_PATH`. Local `*.data` records are treated as opaque bytes: the adapter preserves their identities, paths, timestamps, sizes, hashes, and selected record bytes without decoding or mutating them.

The Codex adapter exposes `codex_sessions_discover`, `codex_sessions_list`, `codex_session_read`, and `codex_sessions_checkpoint` through Codex's app server with exact physical-repository matching. It works without `MCP_HOUSEKEEPING_CHATGPT_PATH`; ChatGPT tools are registered only when that store path is configured.

Knowledge Islands repository staging belongs to `ki acquire import --adapter chatgpt` or `ki acquire import --adapter codex`. This MCP never writes KI state, archives, or deletes source sessions. Durable learning goes through reviewed repository guidance or KB intake.

For setup and use, start with the [user guides](docs/guides/user/README.md). For source maintenance and fixture testing, use the [developer guides](docs/guides/developer/README.md). The [guide index](docs/guides/README.md) routes both audiences.

The MCP registrations are read-only. The separately exported `./codex` library includes a guarded deletion helper; see the developer guide before using that export.

The registered ChatGPT tools are `chatgpt_sessions_discover`, `chatgpt_sessions_list`, `chatgpt_session_read`, and `chatgpt_sessions_checkpoint`. The registered Codex tools are `codex_sessions_discover`, `codex_sessions_list`, `codex_session_read`, and `codex_sessions_checkpoint`.
