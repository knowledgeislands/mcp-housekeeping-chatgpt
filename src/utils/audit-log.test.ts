import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type AuditConfig, type AuditEvent, appendAuditEvent, withAuditLog } from './audit-log.js'

describe('audit logging', () => {
  let directory: string
  let logPath: string

  const config = (overrides: Partial<AuditConfig> = {}): AuditConfig => ({
    mode: 'writes',
    path: logPath,
    maxBytes: 10 * 1024 * 1024,
    keep: 5,
    ...overrides
  })

  const event = (overrides: Partial<AuditEvent> = {}): AuditEvent => ({
    ts: '2026-09-17T00:00:00.000Z',
    server: 'mcp-housekeeping-chatgpt',
    tool: 'test_tool',
    level: 'write',
    ok: true,
    duration_ms: 1,
    args: {},
    ...overrides
  })

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'chatgpt-audit-'))
    logPath = path.join(directory, 'nested', 'audit.jsonl')
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await fs.rm(directory, { recursive: true, force: true })
  })

  it('creates a private append-only log and skips rotation below the cap', async () => {
    await appendAuditEvent(config(), event())
    await appendAuditEvent(config(), event({ tool: 'second_tool' }))

    const lines = (await fs.readFile(logPath, 'utf8')).trim().split('\n')
    expect(lines.map((line) => JSON.parse(line).tool)).toEqual(['test_tool', 'second_tool'])
    expect((await fs.stat(logPath)).mode & 0o777).toBe(0o600)
  })

  it('disables rotation when maxBytes is zero', async () => {
    await appendAuditEvent(config({ maxBytes: 0 }), event({ args: { body: 'x'.repeat(100) } }))
    expect(await fs.readFile(logPath, 'utf8')).toContain('test_tool')
    await expect(fs.access(`${logPath}.1`)).rejects.toThrow()
  })

  it('rotates history and tolerates missing intermediate slots', async () => {
    const rotating = config({ maxBytes: 1, keep: 2 })
    await appendAuditEvent(rotating, event({ tool: 'first' }))
    await appendAuditEvent(rotating, event({ tool: 'second' }))
    await appendAuditEvent(rotating, event({ tool: 'third' }))

    expect(await fs.readFile(`${logPath}.1`, 'utf8')).toContain('third')
    expect(await fs.readFile(`${logPath}.2`, 'utf8')).toContain('second')
    await expect(fs.access(`${logPath}.3`)).rejects.toThrow()
  })

  it('drops an oversized live log when keep is zero', async () => {
    await appendAuditEvent(config({ maxBytes: 1, keep: 0 }), event())
    await expect(fs.access(logPath)).rejects.toThrow()
  })

  it('returns callbacks unchanged when their level is outside the audit mode', () => {
    const callback = vi.fn()
    expect(withAuditLog(config({ mode: 'off' }), 'write_tool', 'write', callback)).toBe(callback)
    expect(withAuditLog(config({ mode: 'writes' }), 'read_tool', 'read', callback)).toBe(callback)
    expect(withAuditLog(config({ mode: 'all' }), 'read_tool', 'read', callback)).not.toBe(callback)
  })

  it('records successful, returned-error, and thrown invocations', async () => {
    const success = withAuditLog(config(), 'success', 'write', async () => ({ content: [] }))
    const returnedError = withAuditLog(config(), 'returned_error', 'destructive', async () => ({
      isError: true,
      content: [{ type: 'text', text: 'reported failure' }]
    }))
    const returnedErrorWithoutText = withAuditLog(config(), 'returned_error_without_text', 'write', async () => ({
      isError: true,
      content: [{ type: 'image', text: 'ignored' }]
    }))
    const returnedErrorWithoutContent = withAuditLog(config(), 'returned_error_without_content', 'write', async () => ({
      isError: true
    }))
    const thrownError = withAuditLog(config(), 'thrown_error', 'write', async () => {
      throw new Error('thrown failure')
    })
    const thrownValue = withAuditLog(config(), 'thrown_value', 'write', async () => {
      throw 'string failure'
    })

    await success({ key: 'value' })
    await returnedError({})
    await returnedErrorWithoutText({})
    await returnedErrorWithoutContent({})
    await expect(thrownError({})).rejects.toThrow('thrown failure')
    await expect(thrownValue({})).rejects.toBe('string failure')
    await appendAuditEvent(config(), event({ tool: 'flush' }))

    const records = (await fs.readFile(logPath, 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line))
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tool: 'success', ok: true }),
        expect.objectContaining({ tool: 'returned_error', ok: false, error: 'reported failure' }),
        expect.objectContaining({ tool: 'returned_error_without_text', ok: false }),
        expect.objectContaining({ tool: 'thrown_error', ok: false, error: 'thrown failure' }),
        expect.objectContaining({ tool: 'thrown_value', ok: false, error: 'string failure' })
      ])
    )
  })

  it('redacts bulky content and URL credentials and truncates oversized arguments', async () => {
    const logged = withAuditLog(config({ mode: 'all' }), 'read_tool', 'read', async () => ({ ok: true }))
    await logged({
      content: 'secret body',
      urls: ['https://user:password@example.test/path', 'git@example.test:path'],
      nested: { url: 'https://token@example.test/path' },
      count: 1
    })
    await logged('x'.repeat(5000))
    await appendAuditEvent(config(), event({ tool: 'flush' }))

    const records = (await fs.readFile(logPath, 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line))
    expect(records[0].args).toEqual({
      content: '[redacted 11B]',
      urls: ['https://<redacted>@example.test/path', 'git@example.test:path'],
      nested: { url: 'https://<redacted>@example.test/path' },
      count: 1
    })
    expect(records[1].args).toMatchObject({ _truncated: true })
    expect(records[1].args.preview).toHaveLength(4096)
  })
})
