import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AuditConfig, AuditEvent } from './audit-log.js'

const event: AuditEvent = {
  ts: '2026-09-17T00:00:00.000Z',
  server: 'mcp-housekeeping-chatgpt',
  tool: 'failure_test',
  level: 'write',
  ok: true,
  duration_ms: 1,
  args: {}
}

const location = async (): Promise<{ directory: string; audit: AuditConfig }> => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'chatgpt-audit-failure-'))
  return {
    directory,
    audit: { mode: 'writes', path: path.join(directory, 'audit.jsonl'), maxBytes: 1024, keep: 1 }
  }
}

describe('audit logging failure isolation', () => {
  const directories: string[] = []

  afterEach(async () => {
    vi.doUnmock('node:fs/promises')
    vi.resetModules()
    vi.restoreAllMocks()
    await Promise.all(directories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })))
  })

  it('tolerates a missing log during the post-append size check', async () => {
    const { directory, audit } = await location()
    directories.push(directory)
    vi.doMock('node:fs/promises', async () => {
      const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
      return { ...actual, stat: vi.fn().mockRejectedValue(new Error('disappeared')) }
    })
    const { appendAuditEvent } = await import('./audit-log.js')

    await expect(appendAuditEvent(audit, event)).resolves.toBeUndefined()
  })

  it('reports Error and non-Error rotation failures without rejecting the append', async () => {
    const { directory, audit } = await location()
    directories.push(directory)
    const errors: unknown[] = [new Error('first rotation failed'), 'second rotation failed']
    vi.doMock('node:fs/promises', async () => {
      const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
      return {
        ...actual,
        rename: vi.fn(async () => {
          throw errors.shift()
        })
      }
    })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { appendAuditEvent } = await import('./audit-log.js')
    audit.maxBytes = 1

    await appendAuditEvent(audit, event)
    await appendAuditEvent(audit, event)

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('first rotation failed'))
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('second rotation failed'))
  })

  it('swallows Error and non-Error write failures', async () => {
    const { directory, audit } = await location()
    directories.push(directory)
    const errors: unknown[] = [new Error('first write failed'), 'second write failed']
    vi.doMock('node:fs/promises', async () => {
      const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
      return {
        ...actual,
        mkdir: vi.fn(async () => {
          throw errors.shift()
        })
      }
    })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { appendAuditEvent } = await import('./audit-log.js')

    await appendAuditEvent(audit, event)
    await appendAuditEvent(audit, event)

    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('first write failed'))
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('second write failed'))
  })

  it('continues when hardening log permissions fails', async () => {
    const { directory, audit } = await location()
    directories.push(directory)
    vi.doMock('node:fs/promises', async () => {
      const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
      return { ...actual, chmod: vi.fn().mockRejectedValue(new Error('chmod failed')) }
    })
    const { appendAuditEvent } = await import('./audit-log.js')

    await expect(appendAuditEvent(audit, event)).resolves.toBeUndefined()
    expect(await fs.readFile(audit.path, 'utf8')).toContain('failure_test')
  })
})
