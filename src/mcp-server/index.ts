#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import pkg from '../../package.json' with { type: 'json' }
import { loadConfig } from '../config/index.js'
import { makeAccessGatedRegister } from '../utils/access-level.js'
import { registerProviderTools } from './register.js'

const config = loadConfig()
const server = new McpServer({ name: 'mcp-housekeeping-chatgpt', version: pkg.version })
server.registerTool = makeAccessGatedRegister(server, config.accessLevel, {
  mode: config.auditLogMode,
  path: config.auditLogPath,
  maxBytes: config.auditLogMaxBytes,
  keep: config.auditLogKeep
})
registerProviderTools(server, config.housekeepingPath)

server.connect(new StdioServerTransport()).catch((error) => {
  console.error(`mcp-housekeeping-chatgpt fatal: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
