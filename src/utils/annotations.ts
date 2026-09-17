/**
 * MCP tool annotations shared across tool groups.
 *
 * This adapter is intentionally read-only, so it publishes only the
 * closed-world read preset used by its four local-store tools.
 */
export const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
} as const
