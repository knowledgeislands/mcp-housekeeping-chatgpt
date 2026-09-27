import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { describe, expect, it, vi } from 'vitest'
import { registerProviderTools } from './register.js'

const names = (store?: string): string[] => {
  const server = new McpServer({ name: 'test', version: '1.0.0' })
  const register = vi.spyOn(server, 'registerTool')
  registerProviderTools(server, store)
  return (register.mock.calls as unknown as Array<[string]>).map(([name]) => name)
}

describe('provider registration', () => {
  it('keeps Codex available without a ChatGPT store', () => {
    expect(names()).toEqual([
      'codex_sessions_discover',
      'codex_sessions_list',
      'codex_session_read',
      'codex_sessions_checkpoint'
    ])
  })

  it('registers both adapters when the ChatGPT store is configured', () => {
    expect(names('/tmp/chatgpt-store')).toEqual([
      'chatgpt_sessions_discover',
      'chatgpt_sessions_list',
      'chatgpt_sessions_checkpoint',
      'chatgpt_session_read',
      'codex_sessions_discover',
      'codex_sessions_list',
      'codex_session_read',
      'codex_sessions_checkpoint'
    ])
  })
})
