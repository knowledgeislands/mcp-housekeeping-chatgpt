import { chmodSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  type AppServerClient,
  acquisitionCheckpoint,
  acquisitionSessionRead,
  buildInventory,
  type CliDependencies,
  deleteReviewed,
  installedCodexVersion,
  protocolFingerprint,
  readArtifactFile,
  readSession,
  runCli,
  runCliIfMain,
  StdioClient
} from './app-server.ts'

type Call = { method: string; params: Record<string, unknown> }

const repository = realpathSync(mkdtempSync(join(tmpdir(), 'ki-housekeeping-codex-')))
const version = 'codex-cli 1.2.3'
const originalPath = process.env.PATH

afterEach(() => {
  process.env.PATH = originalPath
  process.exitCode = undefined
  vi.restoreAllMocks()
})

const thread = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  cwd: repository,
  createdAt: 1,
  updatedAt: 2,
  status: { type: 'notLoaded' },
  preview: 'must never enter the artifact',
  ...overrides
})

const client = (responses: unknown[]): { client: AppServerClient; calls: Call[] } => {
  const calls: Call[] = []
  return {
    calls,
    client: {
      request: async (method, params) => {
        calls.push({ method, params })
        if (responses.length === 0) throw new Error(`unexpected ${method}`)
        return responses.shift()
      },
      close: async () => undefined
    }
  }
}

const installCodexExecutable = (source: string): string => {
  const directory = mkdtempSync(join(tmpdir(), 'ki-fake-codex-'))
  const executable = join(directory, 'codex')
  writeFileSync(executable, source)
  chmodSync(executable, 0o700)
  process.env.PATH = `${directory}:${originalPath ?? ''}`
  return directory
}

describe('Codex app-server housekeeping adapter', () => {
  test('pages active and archived roots and discloses descendants without content', async () => {
    const fixture = client([
      { data: [thread('active')], nextCursor: 'next' },
      { data: [thread('child')], nextCursor: null },
      { data: [thread('archived')], nextCursor: null },
      { data: [thread('child')], nextCursor: null },
      { data: [], nextCursor: null },
      { data: [], nextCursor: null }
    ])
    const artifact = await buildInventory(fixture.client, repository, version, '2026-08-18T00:00:00.000Z')
    expect(artifact).toEqual({
      schema: 1,
      repository,
      codexVersion: version,
      generatedAt: '2026-08-18T00:00:00.000Z',
      protocolFingerprint,
      roots: [
        {
          id: 'active',
          cwd: repository,
          archived: false,
          createdAt: 1,
          updatedAt: 2,
          status: 'notLoaded',
          descendantIds: ['child']
        },
        {
          id: 'archived',
          cwd: repository,
          archived: true,
          createdAt: 1,
          updatedAt: 2,
          status: 'notLoaded',
          descendantIds: []
        }
      ]
    })
    expect(JSON.stringify(artifact)).not.toContain('preview')
    expect(fixture.calls.filter(({ method }) => method === 'thread/list')).toHaveLength(6)
  })

  test('rejects cross-repository results', async () => {
    const fixture = client([
      { data: [thread('foreign', { cwd: `${repository}-other` })], nextCursor: null },
      { data: [], nextCursor: null }
    ])
    await expect(buildInventory(fixture.client, repository, version)).rejects.toThrow('cross-repository')
  })

  test('maps inventory into the shared content-minimised acquisition checkpoint', async () => {
    const fixture = client([
      { data: [thread('root')], nextCursor: null },
      { data: [], nextCursor: null },
      { data: [], nextCursor: null }
    ])

    const checkpoint = await acquisitionCheckpoint(fixture.client, repository, version, '2026-08-18T00:00:00.000Z')

    expect(checkpoint).toMatchObject({
      schema: 1,
      provider: 'codex',
      repository,
      generatedAt: '2026-08-18T00:00:00.000Z',
      adapter: { version, protocolFingerprint },
      sessions: [{ id: 'root', archived: false, descendantIds: [] }]
    })
    expect(JSON.stringify(checkpoint)).not.toContain('preview')
  })

  test('reads complete source content only for the selected repository', async () => {
    const fixture = client([
      { ...thread('source'), turns: [{ id: 'turn-1', items: [{ type: 'userMessage', text: 'retain me' }] }] }
    ])
    await expect(readSession(fixture.client, repository, 'source', true)).resolves.toMatchObject({
      id: 'source',
      cwd: repository,
      turns: [{ id: 'turn-1' }]
    })
    expect(fixture.calls).toEqual([{ method: 'thread/read', params: { threadId: 'source', includeTurns: true } }])
  })

  test('wraps a complete source read in the shared acquisition result', async () => {
    const fixture = client([{ ...thread('source'), turns: [{ id: 'turn-1', items: [{ type: 'userMessage' }] }] }])

    const result = await acquisitionSessionRead(fixture.client, repository, 'source', true)

    expect(result).toMatchObject({
      schema: 1,
      provider: 'codex',
      repository,
      session: { id: 'source', contentType: 'application/json', content: { turns: [{ id: 'turn-1' }] } }
    })
  })

  test('validates the complete reviewed selection before deleting', async () => {
    const auditFixture = client([
      { data: [thread('root')], nextCursor: null },
      { data: [], nextCursor: null },
      { data: [thread('child')], nextCursor: null }
    ])
    const artifact = await buildInventory(auditFixture.client, repository, version)
    const conformFixture = client([
      { data: [thread('root')], nextCursor: null },
      { data: [], nextCursor: null },
      { data: [thread('child')], nextCursor: null },
      {}
    ])
    expect(
      await deleteReviewed(
        conformFixture.client,
        artifact,
        repository,
        version,
        ['root'],
        'PERMANENTLY_DELETE_SELECTED_CODEX_THREADS'
      )
    ).toEqual(['root'])
    expect(conformFixture.calls.at(-1)).toEqual({ method: 'thread/delete', params: { threadId: 'root' } })
  })

  test('refuses stale descendants without issuing delete', async () => {
    const artifact = {
      schema: 1,
      repository,
      codexVersion: version,
      generatedAt: '2026-08-18T00:00:00.000Z',
      protocolFingerprint,
      roots: [
        {
          id: 'root',
          cwd: repository,
          archived: false,
          createdAt: 1,
          updatedAt: 2,
          status: 'notLoaded',
          descendantIds: ['old-child']
        }
      ]
    }
    const fixture = client([
      { data: [thread('root')], nextCursor: null },
      { data: [], nextCursor: null },
      { data: [thread('new-child')], nextCursor: null }
    ])
    await expect(
      deleteReviewed(
        fixture.client,
        artifact,
        repository,
        version,
        ['root'],
        'PERMANENTLY_DELETE_SELECTED_CODEX_THREADS'
      )
    ).rejects.toThrow('changed after review')
    expect(fixture.calls.some(({ method }) => method === 'thread/delete')).toBe(false)
  })

  test('refuses missing confirmation, duplicates, version drift, and protocol drift', async () => {
    const artifact = {
      schema: 1,
      repository,
      codexVersion: version,
      generatedAt: '2026-08-18T00:00:00.000Z',
      protocolFingerprint,
      roots: []
    }
    const fixture = client([])
    await expect(deleteReviewed(fixture.client, artifact, repository, version, ['root'], 'wrong')).rejects.toThrow(
      'confirmation'
    )
    await expect(
      deleteReviewed(
        fixture.client,
        artifact,
        repository,
        version,
        ['root', 'root'],
        'PERMANENTLY_DELETE_SELECTED_CODEX_THREADS'
      )
    ).rejects.toThrow('duplicate-free')
    await expect(
      deleteReviewed(
        fixture.client,
        artifact,
        repository,
        'codex-cli 2.0.0',
        ['root'],
        'PERMANENTLY_DELETE_SELECTED_CODEX_THREADS'
      )
    ).rejects.toThrow('version changed')
    await expect(
      deleteReviewed(
        fixture.client,
        { ...artifact, protocolFingerprint: 'old' },
        repository,
        version,
        ['root'],
        'PERMANENTLY_DELETE_SELECTED_CODEX_THREADS'
      )
    ).rejects.toThrow('protocol changed')
  })

  test('rejects threads reported as both active and archived', async () => {
    const fixture = client([
      { data: [thread('duplicate')], nextCursor: null },
      { data: [thread('duplicate')], nextCursor: null }
    ])
    await expect(buildInventory(fixture.client, repository, version)).rejects.toThrow('active and archived')
  })

  test.each([
    [null, 'thread/list result must be an object'],
    [{ data: 'not-an-array', nextCursor: null }, 'data must be an array'],
    [{ data: [], nextCursor: false }, 'nextCursor must be a string or null'],
    [{ data: [null], nextCursor: null }, 'entry must be an object'],
    [{ data: [[]], nextCursor: null }, 'entry must be an object'],
    [{ data: [thread('bad', { status: null })], nextCursor: null }, 'status must be an object'],
    [{ data: [thread('bad', { id: '' })], nextCursor: null }, 'thread id must be a non-empty string'],
    [{ data: [thread('bad', { cwd: 4 })], nextCursor: null }, 'thread cwd must be a non-empty string'],
    [
      { data: [thread('bad', { createdAt: Number.NaN })], nextCursor: null },
      'thread createdAt must be a finite number'
    ],
    [{ data: [thread('bad', { updatedAt: 'later' })], nextCursor: null }, 'thread updatedAt must be a finite number'],
    [{ data: [thread('bad', { status: { type: '' } })], nextCursor: null }, 'status type must be a non-empty string']
  ])('rejects malformed list responses', async (response, message) => {
    await expect(buildInventory(client([response]).client, repository, version)).rejects.toThrow(message)
  })

  test('rejects malformed and cross-repository reads', async () => {
    await expect(readSession(client([null]).client, repository, 'source', true)).rejects.toThrow(
      'thread/read result must be an object'
    )
    await expect(readSession(client([thread('different')]).client, repository, 'source', true)).rejects.toThrow(
      'different thread'
    )
    await expect(
      readSession(client([thread('source', { cwd: `${repository}-other` })]).client, repository, 'source', true)
    ).rejects.toThrow('cross-repository')
  })

  test('rejects invalid acquisition timestamps', async () => {
    const invalidCheckpoint = client([
      { data: [thread('root', { createdAt: Number.MAX_VALUE })], nextCursor: null },
      { data: [], nextCursor: null },
      { data: [], nextCursor: null }
    ])
    await expect(acquisitionCheckpoint(invalidCheckpoint.client, repository, version)).rejects.toThrow(
      'thread createdAt must be a valid timestamp'
    )
    await expect(
      acquisitionSessionRead(
        client([thread('source', { updatedAt: Number.MAX_VALUE })]).client,
        repository,
        'source',
        false
      )
    ).rejects.toThrow('thread updatedAt must be a valid timestamp')
  })

  test('validates every inventory artifact field before deletion', async () => {
    const validRoot = {
      id: 'root',
      cwd: repository,
      archived: false,
      createdAt: 1,
      updatedAt: 2,
      status: 'notLoaded',
      descendantIds: ['child', 'child']
    }
    const validArtifact = {
      schema: 1,
      repository,
      codexVersion: version,
      generatedAt: '2026-08-18T00:00:00.000Z',
      protocolFingerprint,
      roots: [validRoot]
    }
    const remove = (artifact: unknown) =>
      deleteReviewed(
        client([]).client,
        artifact,
        repository,
        version,
        ['root'],
        'PERMANENTLY_DELETE_SELECTED_CODEX_THREADS'
      )
    const invalidCases: [unknown, string][] = [
      [null, 'inventory artifact must be an object'],
      [[], 'inventory artifact must be an object'],
      [{ ...validArtifact, schema: 2 }, 'schema must be 1'],
      [{ ...validArtifact, roots: null }, 'roots must be an array'],
      [{ ...validArtifact, repository: '' }, 'artifact repository must be a non-empty string'],
      [{ ...validArtifact, codexVersion: 1 }, 'artifact codexVersion must be a non-empty string'],
      [{ ...validArtifact, generatedAt: null }, 'artifact generatedAt must be a non-empty string'],
      [{ ...validArtifact, protocolFingerprint: '' }, 'artifact protocolFingerprint must be a non-empty string'],
      [{ ...validArtifact, roots: [null] }, 'artifact root must be an object'],
      [{ ...validArtifact, roots: [{ ...validRoot, archived: 'no' }] }, 'archived must be boolean'],
      [{ ...validArtifact, roots: [{ ...validRoot, descendantIds: null }] }, 'descendantIds must be an array'],
      [{ ...validArtifact, roots: [{ ...validRoot, id: '' }] }, 'artifact root id must be a non-empty string'],
      [{ ...validArtifact, roots: [{ ...validRoot, cwd: null }] }, 'artifact root cwd must be a non-empty string'],
      [
        { ...validArtifact, roots: [{ ...validRoot, createdAt: 'then' }] },
        'artifact root createdAt must be a finite number'
      ],
      [
        { ...validArtifact, roots: [{ ...validRoot, updatedAt: Number.NaN }] },
        'artifact root updatedAt must be a finite number'
      ],
      [{ ...validArtifact, roots: [{ ...validRoot, status: 3 }] }, 'artifact root status must be a non-empty string'],
      [
        { ...validArtifact, roots: [{ ...validRoot, descendantIds: [null] }] },
        'artifact descendant id must be a non-empty string'
      ]
    ]

    for (const [artifact, message] of invalidCases) await expect(remove(artifact)).rejects.toThrow(message)
  })

  test('rejects repository drift, absent roots, vanished roots, and unexpected deletion results', async () => {
    const artifact = {
      schema: 1,
      repository,
      codexVersion: version,
      generatedAt: '2026-08-18T00:00:00.000Z',
      protocolFingerprint,
      roots: [
        {
          id: 'root',
          cwd: repository,
          archived: false,
          createdAt: 1,
          updatedAt: 2,
          status: 'notLoaded',
          descendantIds: []
        }
      ]
    }
    const confirmation = 'PERMANENTLY_DELETE_SELECTED_CODEX_THREADS'

    const otherRepository = realpathSync(mkdtempSync(join(tmpdir(), 'ki-housekeeping-codex-other-')))
    await expect(
      deleteReviewed(client([]).client, artifact, otherRepository, version, ['root'], confirmation)
    ).rejects.toThrow('artifact repository does not match')
    await expect(
      deleteReviewed(client([]).client, artifact, repository, version, ['missing'], confirmation)
    ).rejects.toThrow('absent from the artifact')
    await expect(
      deleteReviewed(
        client([
          { data: [], nextCursor: null },
          { data: [], nextCursor: null }
        ]).client,
        artifact,
        repository,
        version,
        ['root'],
        confirmation
      )
    ).rejects.toThrow('changed after review')
    await expect(
      deleteReviewed(
        client([
          { data: [thread('root')], nextCursor: null },
          { data: [], nextCursor: null },
          { data: [], nextCursor: null },
          { changed: true }
        ]).client,
        artifact,
        repository,
        version,
        ['root'],
        confirmation
      )
    ).rejects.toThrow('unexpected result')
    await expect(
      deleteReviewed(
        client([
          { data: [thread('root')], nextCursor: null },
          { data: [], nextCursor: null },
          { data: [], nextCursor: null },
          null
        ]).client,
        artifact,
        repository,
        version,
        ['root'],
        confirmation
      )
    ).rejects.toThrow('thread/delete result must be an object')
  })
})

describe('Codex process adapter', () => {
  test('discovers the installed Codex version and reports command failures', () => {
    installCodexExecutable('#!/bin/sh\nprintf "codex-cli 9.8.7\\n"\n')
    expect(installedCodexVersion()).toBe('codex-cli 9.8.7')

    installCodexExecutable('#!/bin/sh\nprintf "not installed\\n" >&2\nexit 2\n')
    expect(() => installedCodexVersion()).toThrow('not installed')

    installCodexExecutable('#!/bin/sh\nexit 2\n')
    expect(() => installedCodexVersion()).toThrow('codex --version failed')
  })

  test('exchanges JSON lines, ignores notifications, and closes the subprocess', async () => {
    installCodexExecutable(`#!/usr/bin/env node
const readline = require('node:readline')
const lines = readline.createInterface({ input: process.stdin })
lines.on('line', (line) => {
  const message = JSON.parse(line)
  if (message.method === 'initialize') {
    process.stderr.write('fake diagnostic')
    console.log(JSON.stringify({ id: message.id, result: { ready: true } }))
    return
  }
  if (message.method === 'initialized') return
  if (message.method === 'result') {
    console.log(JSON.stringify({ method: 'notice' }))
    console.log(JSON.stringify({ id: 999, result: null }))
    console.log(JSON.stringify({ id: message.id, result: { echoed: message.params } }))
    return
  }
  if (message.method === 'error') {
    console.log(JSON.stringify({ id: message.id, error: { code: 1, message: 'refused' } }))
  }
})
`)
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    const transport = await StdioClient.start()

    await expect(transport.request('result', { value: 4 })).resolves.toEqual({ echoed: { value: 4 } })
    await expect(transport.request('error', {})).rejects.toThrow('refused')
    await transport.close()
    expect(stderr).toHaveBeenCalled()
  })

  test.each([
    ['malformed JSON', 'process.stdout.write("not-json\\n")'],
    ['a non-object message', 'process.stdout.write("[]\\n")']
  ])('rejects pending requests after %s', async (_label, response) => {
    installCodexExecutable(`#!/usr/bin/env node
const readline = require('node:readline')
const lines = readline.createInterface({ input: process.stdin })
lines.on('line', (line) => {
  const message = JSON.parse(line)
  if (message.method === 'initialize') {
    console.log(JSON.stringify({ id: message.id, result: {} }))
    return
  }
  if (message.method === 'initialized') return
  ${response}
})
`)
    const transport = await StdioClient.start()
    await expect(transport.request('break', {})).rejects.toThrow()
    await transport.close()
  })

  test('rejects pending requests when the subprocess errors or exits non-zero', async () => {
    const emptyPath = mkdtempSync(join(tmpdir(), 'ki-empty-path-'))
    process.env.PATH = emptyPath
    await expect(StdioClient.start()).rejects.toThrow()

    installCodexExecutable(`#!/usr/bin/env node
const readline = require('node:readline')
const lines = readline.createInterface({ input: process.stdin })
lines.on('line', (line) => {
  const message = JSON.parse(line)
  if (message.method === 'initialize') {
    console.log(JSON.stringify({ id: message.id, result: {} }))
    return
  }
  if (message.method === 'initialized') return
  process.exit(7)
})
`)
    const transport = await StdioClient.start()
    await expect(transport.request('exit', {})).rejects.toThrow('exited with 7')
  })

  test('accepts a clean subprocess exit', async () => {
    installCodexExecutable(`#!/usr/bin/env node
const readline = require('node:readline')
const lines = readline.createInterface({ input: process.stdin })
lines.on('line', (line) => {
  const message = JSON.parse(line)
  if (message.method === 'initialize') {
    console.log(JSON.stringify({ id: message.id, result: {} }))
    return
  }
  if (message.method === 'initialized') process.exit(0)
})
`)
    await StdioClient.start()
    await new Promise((resolve) => setTimeout(resolve, 50))
  })
})

describe('Codex CLI dispatch', () => {
  const cli = (responses: unknown[], overrides: Partial<CliDependencies> = {}) => {
    const fixture = client(responses)
    const close = vi.fn(async () => undefined)
    fixture.client.close = close
    const output: string[] = []
    const dependencies: CliDependencies = {
      startClient: async () => fixture.client,
      codexVersion: () => version,
      readArtifact: () => {
        throw new Error('unexpected artifact read')
      },
      writeOutput: (value) => output.push(value),
      ...overrides
    }
    return { ...fixture, close, dependencies, output }
  }

  test('prints help for empty and explicit help arguments', async () => {
    for (const args of [[], ['--help'], ['-h']]) {
      const fixture = cli([])
      await runCli(args, fixture.dependencies)
      expect(fixture.output[0]).toContain('inventory --repo')
      expect(fixture.close).not.toHaveBeenCalled()
    }
  })

  test('uses default CLI dependencies for help', async () => {
    const output = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await runCli([], undefined)
    expect(output).toHaveBeenCalledWith(expect.stringContaining('delete revalidates'))
  })

  test('reads JSON review artifacts from disk', () => {
    const artifactPath = join(mkdtempSync(join(tmpdir(), 'ki-artifact-')), 'review.json')
    writeFileSync(artifactPath, '{"schema":1}')
    expect(readArtifactFile(artifactPath)).toEqual({ schema: 1 })
  })

  test('requires a repository before creating a client', async () => {
    const fixture = cli([])
    await expect(runCli(['inventory'], fixture.dependencies)).rejects.toThrow('--repo is required')
    expect(fixture.close).not.toHaveBeenCalled()
  })

  test('prints an inventory and closes its client', async () => {
    const fixture = cli([
      { data: [], nextCursor: null },
      { data: [], nextCursor: null }
    ])
    await runCli(['inventory', '--repo', repository], fixture.dependencies)
    expect(JSON.parse(fixture.output[0] as string)).toMatchObject({ schema: 1, repository, roots: [] })
    expect(fixture.close).toHaveBeenCalledOnce()
  })

  test('loads a reviewed artifact, deletes each selected root, and prints the result', async () => {
    const artifact = {
      schema: 1,
      repository,
      codexVersion: version,
      generatedAt: '2026-09-26T00:00:00.000Z',
      protocolFingerprint,
      roots: [
        {
          id: 'root',
          cwd: repository,
          archived: false,
          createdAt: 1,
          updatedAt: 2,
          status: 'notLoaded',
          descendantIds: []
        }
      ]
    }
    const readArtifact = vi.fn(() => artifact)
    const fixture = cli(
      [
        { data: [thread('root')], nextCursor: null },
        { data: [], nextCursor: null },
        { data: [], nextCursor: null },
        {}
      ],
      { readArtifact }
    )

    await runCli(
      [
        'delete',
        '--repo',
        repository,
        '--artifact',
        'review.json',
        '--thread',
        'root',
        '--confirm',
        'PERMANENTLY_DELETE_SELECTED_CODEX_THREADS'
      ],
      fixture.dependencies
    )

    expect(readArtifact).toHaveBeenCalledWith('review.json')
    expect(JSON.parse(fixture.output[0] as string)).toEqual({ deleted: ['root'] })
    expect(fixture.close).toHaveBeenCalledOnce()
  })

  test('closes the client for missing delete arguments and unknown modes', async () => {
    const missingArtifact = cli([])
    await expect(runCli(['delete', '--repo', repository], missingArtifact.dependencies)).rejects.toThrow(
      '--artifact is required'
    )
    expect(missingArtifact.close).toHaveBeenCalledOnce()

    const missingConfirmation = cli([], { readArtifact: () => ({}) })
    await expect(
      runCli(['delete', '--repo', repository, '--artifact', 'review.json'], missingConfirmation.dependencies)
    ).rejects.toThrow('confirmation')
    expect(missingConfirmation.close).toHaveBeenCalledOnce()

    const unknown = cli([])
    await expect(runCli(['other', '--repo', repository], unknown.dependencies)).rejects.toThrow('unknown mode')
    expect(unknown.close).toHaveBeenCalledOnce()
  })

  test('does not enter cleanup when client startup fails', async () => {
    const fixture = cli([], { startClient: async () => Promise.reject(new Error('offline')) })
    await expect(runCli(['inventory', '--repo', repository], fixture.dependencies)).rejects.toThrow('offline')
    expect(fixture.close).not.toHaveBeenCalled()
  })

  test('runs only for the entry module and reports Error and non-Error failures', async () => {
    const run = vi.fn(async () => undefined)
    const report = vi.fn()
    runCliIfMain(false)
    runCliIfMain(false, run, report)
    expect(run).not.toHaveBeenCalled()

    runCliIfMain(true, run, report)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(run).toHaveBeenCalledOnce()
    expect(report).not.toHaveBeenCalled()

    runCliIfMain(true, async () => Promise.reject(new Error('broken')), report)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(report).toHaveBeenCalledWith('broken')
    runCliIfMain(true, async () => Promise.reject('offline'), report)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(report).toHaveBeenCalledWith('offline')
  })

  test('uses the default fatal-error reporter', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    runCliIfMain(true, async () => Promise.reject(new Error('fatal')))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(error).toHaveBeenCalledWith('fatal')
    expect(process.exitCode).toBe(1)
  })
})
