# mcp-housekeeping-chatgpt

Read-only MCP provider adapter for ChatGPT's installed local session store.

It exposes `discover`, `list`, `read`, and `checkpoint` operations for the physical store set by `MCP_HOUSEKEEPING_CHATGPT_PATH`. Local `*.data` records are treated as opaque bytes: the adapter preserves their identities, paths, timestamps, sizes, hashes, and selected record bytes without decoding or mutating them.

Knowledge Islands repository staging belongs to `ki acquire import --adapter chatgpt`; this MCP never writes KI state, archives, or deletes source sessions.
