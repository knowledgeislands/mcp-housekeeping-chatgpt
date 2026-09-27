# mcp-housekeeping-chatgpt

Read-only MCP adapter for the ChatGPT product family: the installed ChatGPT store and repository-scoped Codex sessions.

It exposes `discover`, `list`, `read`, and `checkpoint` operations for the physical store set by `MCP_HOUSEKEEPING_CHATGPT_PATH`. Local `*.data` records are treated as opaque bytes: the adapter preserves their identities, paths, timestamps, sizes, hashes, and selected record bytes without decoding or mutating them.

The Codex adapter exposes `codex_sessions_discover`, `codex_sessions_list`, `codex_session_read`, and `codex_sessions_checkpoint` through Codex's app server with exact physical-repository matching. It works without `MCP_HOUSEKEEPING_CHATGPT_PATH`; ChatGPT tools are registered only when that store path is configured.

Knowledge Islands repository staging belongs to `ki acquire import --adapter chatgpt` or `ki acquire import --adapter codex`. This MCP never writes KI state, archives, or deletes source sessions. Durable learning goes through reviewed repository guidance or KB intake.
