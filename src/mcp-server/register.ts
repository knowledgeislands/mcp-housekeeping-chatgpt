import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerChatGptTools } from '../tools/chatgpt/index.js'
import { registerCodexTools } from '../tools/codex/index.js'

export const registerProviderTools = (server: McpServer, chatgptStore?: string): void => {
  if (chatgptStore) registerChatGptTools(server, chatgptStore)
  registerCodexTools(server)
}
