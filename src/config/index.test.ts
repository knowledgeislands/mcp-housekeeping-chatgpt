import { homedir } from 'node:os'
import * as path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadConfig } from './index.ts'

const STORE = '/tmp/chatgpt-store'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('loadConfig', () => {
  it('loads package env files in precedence order with an isolated process environment', () => {
    vi.stubEnv('MCP_HOUSEKEEPING_CHATGPT_PATH', STORE)
    vi.stubEnv('NODE_ENV', 'development')
    const loadEnvFile = vi.spyOn(process, 'loadEnvFile').mockImplementation((file) => {
      if (String(file).endsWith('.env.local')) throw new Error('file missing')
    })

    expect(loadConfig().housekeepingPath).toBe(STORE)
    expect(loadEnvFile.mock.calls.map(([file]) => path.basename(String(file)))).toEqual([
      '.env.local',
      '.env.development',
      '.env'
    ])
    expect(
      loadEnvFile.mock.calls.every(
        ([file]) => path.dirname(String(file)) === path.resolve(import.meta.dirname, '../..')
      )
    ).toBe(true)
  })

  it('skips the environment-specific file when NODE_ENV is unset', () => {
    vi.stubEnv('MCP_HOUSEKEEPING_CHATGPT_PATH', STORE)
    vi.stubEnv('NODE_ENV', undefined)
    const loadEnvFile = vi.spyOn(process, 'loadEnvFile').mockImplementation(() => {})

    expect(loadConfig().housekeepingPath).toBe(STORE)
    expect(loadEnvFile.mock.calls.map(([file]) => path.basename(String(file)))).toEqual(['.env.local', '.env'])
  })

  it('expands a managed home-relative ChatGPT store path', () => {
    const config = loadConfig({
      MCP_HOUSEKEEPING_CHATGPT_PATH: '~/Library/Application Support/com.openai.chat'
    })

    expect(config.housekeepingPath).toBe(path.join(homedir(), 'Library/Application Support/com.openai.chat'))
  })

  it('expands a bare home marker', () => {
    expect(loadConfig({ MCP_HOUSEKEEPING_CHATGPT_PATH: '~' }).housekeepingPath).toBe(homedir())
  })

  it('applies conservative defaults', () => {
    expect(loadConfig({ MCP_HOUSEKEEPING_CHATGPT_PATH: STORE })).toEqual({
      housekeepingPath: STORE,
      accessLevel: 'read',
      auditLogMode: 'writes',
      auditLogPath: path.join(STORE, 'audit', 'audit.jsonl'),
      auditLogMaxBytes: 10 * 1024 * 1024,
      auditLogKeep: 5
    })
  })

  it('accepts every supported access and audit mode', () => {
    for (const accessLevel of ['read', 'write', 'destructive']) {
      for (const auditLogMode of ['off', 'writes', 'all']) {
        const config = loadConfig({
          MCP_HOUSEKEEPING_CHATGPT_PATH: STORE,
          MCP_HOUSEKEEPING_CHATGPT_ACCESS_LEVEL: accessLevel,
          MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG: auditLogMode,
          MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_PATH: './audit.jsonl',
          MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_MAX_BYTES: '0',
          MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_KEEP: '2'
        })

        expect(config).toMatchObject({ accessLevel, auditLogMode, auditLogMaxBytes: 0, auditLogKeep: 2 })
        expect(config.auditLogPath).toBe(path.resolve('./audit.jsonl'))
      }
    }
  })

  it('allows Codex-only operation without a ChatGPT store path', () => {
    expect(loadConfig({})).toMatchObject({
      accessLevel: 'read',
      auditLogPath: path.join(homedir(), '.local', 'state', 'mcp-housekeeping-chatgpt', 'audit.jsonl')
    })
    expect(loadConfig({}).housekeepingPath).toBeUndefined()
  })

  it('rejects unsupported access and audit modes', () => {
    expect(() =>
      loadConfig({ MCP_HOUSEKEEPING_CHATGPT_PATH: STORE, MCP_HOUSEKEEPING_CHATGPT_ACCESS_LEVEL: 'admin' })
    ).toThrow('Invalid MCP_HOUSEKEEPING_CHATGPT_ACCESS_LEVEL')
    expect(() =>
      loadConfig({ MCP_HOUSEKEEPING_CHATGPT_PATH: STORE, MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG: 'verbose' })
    ).toThrow('Invalid MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG')
  })

  it('rejects negative and non-numeric rotation settings', () => {
    expect(() =>
      loadConfig({ MCP_HOUSEKEEPING_CHATGPT_PATH: STORE, MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_MAX_BYTES: '-1' })
    ).toThrow('MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_MAX_BYTES')
    expect(() =>
      loadConfig({ MCP_HOUSEKEEPING_CHATGPT_PATH: STORE, MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_KEEP: 'not-a-number' })
    ).toThrow('MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_KEEP')
  })
})
