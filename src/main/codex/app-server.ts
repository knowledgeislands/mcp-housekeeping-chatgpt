/**
 * Purpose: Discover, read, checkpoint, and explicitly delete repository-scoped Codex threads.
 * Run: bun scripts/app-server.ts --help
 * Boundary: Inventory is read-only; delete mutates only reviewed persisted thread roots after complete preflight validation.
 */

import { type ChildProcessWithoutNullStreams, spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, realpathSync } from 'node:fs'
import { createInterface } from 'node:readline'

const SCHEMA = 1 as const
const CONFIRMATION = 'PERMANENTLY_DELETE_SELECTED_CODEX_THREADS'
const PAGE_LIMIT = 100
const PROTOCOL_CONTRACT = {
  experimentalApi: true,
  methods: ['initialize', 'thread/list', 'thread/read', 'thread/delete'],
  inventoryFields: ['id', 'cwd', 'createdAt', 'updatedAt', 'status.type'],
  filters: ['archived', 'cwd', 'ancestorThreadId', 'cursor', 'limit']
} as const

export const protocolFingerprint = createHash('sha256').update(JSON.stringify(PROTOCOL_CONTRACT)).digest('hex')

type JsonObject = Record<string, unknown>

export type ThreadRecord = {
  id: string
  cwd: string
  archived: boolean
  createdAt: number
  updatedAt: number
  status: string
  descendantIds: string[]
}

export type InventoryArtifact = {
  schema: typeof SCHEMA
  repository: string
  codexVersion: string
  generatedAt: string
  protocolFingerprint: string
  roots: ThreadRecord[]
}

export type AcquisitionSession = {
  id: string
  sourceLocator: string
  createdAt: string | null
  updatedAt: string
  byteSize: null
  status: string
  archived: boolean
  descendantIds: string[]
}

export type AcquisitionCheckpoint = {
  schema: typeof SCHEMA
  provider: 'codex'
  repository: string
  generatedAt: string
  adapter: {
    version: string
    protocolFingerprint: string
  }
  sessions: AcquisitionSession[]
}

export type AcquisitionSessionRead = {
  schema: typeof SCHEMA
  provider: 'codex'
  repository: string
  session: {
    id: string
    sourceLocator: string
    contentType: 'application/json'
    content: Record<string, unknown>
    updatedAt: string
  }
}

export type AppServerClient = {
  request: (method: string, params: JsonObject) => Promise<unknown>
  close: () => Promise<void>
}

type ListedThread = {
  id: string
  cwd: string
  createdAt: number
  updatedAt: number
  status: string
}

const object = (value: unknown, label: string): JsonObject => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  return value as JsonObject
}

const text = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || !value) throw new Error(`${label} must be a non-empty string`)
  return value
}

const number = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be a finite number`)
  return value
}

const listedThread = (value: unknown): ListedThread => {
  const thread = object(value, 'thread/list result entry')
  const status = object(thread.status, 'thread status')
  return {
    id: text(thread.id, 'thread id'),
    cwd: text(thread.cwd, 'thread cwd'),
    createdAt: number(thread.createdAt, 'thread createdAt'),
    updatedAt: number(thread.updatedAt, 'thread updatedAt'),
    status: text(status.type, 'thread status type')
  }
}

const listPage = (value: unknown): { data: ListedThread[]; nextCursor: string | null } => {
  const result = object(value, 'thread/list result')
  if (!Array.isArray(result.data)) throw new Error('thread/list result data must be an array')
  const nextCursor = result.nextCursor
  if (nextCursor !== null && typeof nextCursor !== 'string')
    throw new Error('thread/list nextCursor must be a string or null')
  return { data: result.data.map(listedThread), nextCursor }
}

const pageThreads = async (client: AppServerClient, params: JsonObject): Promise<ListedThread[]> => {
  const found: ListedThread[] = []
  let cursor: string | null = null
  do {
    const page = listPage(await client.request('thread/list', { ...params, cursor, limit: PAGE_LIMIT }))
    found.push(...page.data)
    cursor = page.nextCursor
  } while (cursor)
  return found
}

const distinct = (values: readonly string[]): string[] => [...new Set(values)].sort()

export const buildInventory = async (
  client: AppServerClient,
  repository: string,
  codexVersion: string,
  generatedAt = new Date().toISOString()
): Promise<InventoryArtifact> => {
  const physicalRepository = realpathSync(repository)
  const candidates = [
    ...(await pageThreads(client, { cwd: physicalRepository, archived: false })).map((thread) => ({
      ...thread,
      archived: false
    })),
    ...(await pageThreads(client, { cwd: physicalRepository, archived: true })).map((thread) => ({
      ...thread,
      archived: true
    }))
  ]
  const byId = new Map<string, ListedThread & { archived: boolean }>()
  for (const candidate of candidates) {
    if (candidate.cwd !== physicalRepository)
      throw new Error(`app-server returned cross-repository thread ${candidate.id}`)
    const previous = byId.get(candidate.id)
    if (previous && previous.archived !== candidate.archived)
      throw new Error(`thread ${candidate.id} appears active and archived`)
    byId.set(candidate.id, candidate)
  }

  const descendants = new Map<string, string[]>()
  for (const id of byId.keys()) {
    const rows = await pageThreads(client, { ancestorThreadId: id })
    descendants.set(id, distinct(rows.map((row) => row.id).filter((descendant) => descendant !== id)))
  }
  const nested = new Set([...descendants.values()].flat())
  const roots = [...byId.values()]
    .filter(({ id }) => !nested.has(id))
    .map((thread) => ({ ...thread, descendantIds: descendants.get(thread.id) as string[] }))
    .sort((left, right) => left.id.localeCompare(right.id))
  return {
    schema: SCHEMA,
    repository: physicalRepository,
    codexVersion,
    generatedAt,
    protocolFingerprint,
    roots
  }
}

export const readSession = async (
  client: AppServerClient,
  repository: string,
  threadId: string,
  includeTurns: boolean
): Promise<Record<string, unknown>> => {
  const physicalRepository = realpathSync(repository)
  const thread = object(await client.request('thread/read', { threadId, includeTurns }), 'thread/read result')
  if (text(thread.id, 'thread id') !== threadId) throw new Error('thread/read returned a different thread')
  if (text(thread.cwd, 'thread cwd') !== physicalRepository)
    throw new Error(`app-server returned cross-repository thread ${threadId}`)
  return thread
}

const sourceLocator = (threadId: string): string => `codex-app-server://threads/${encodeURIComponent(threadId)}`

const isoTimestamp = (value: number, label: string): string => {
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) throw new Error(`${label} must be a valid timestamp`)
  return timestamp.toISOString()
}

export const acquisitionCheckpoint = async (
  client: AppServerClient,
  repository: string,
  codexVersion: string,
  generatedAt = new Date().toISOString()
): Promise<AcquisitionCheckpoint> => {
  const inventory = await buildInventory(client, repository, codexVersion, generatedAt)
  return {
    schema: SCHEMA,
    provider: 'codex',
    repository: inventory.repository,
    generatedAt: inventory.generatedAt,
    adapter: {
      version: inventory.codexVersion,
      protocolFingerprint: inventory.protocolFingerprint
    },
    sessions: inventory.roots.map((root) => ({
      id: root.id,
      sourceLocator: sourceLocator(root.id),
      createdAt: isoTimestamp(root.createdAt, 'thread createdAt'),
      updatedAt: isoTimestamp(root.updatedAt, 'thread updatedAt'),
      byteSize: null,
      status: root.status,
      archived: root.archived,
      descendantIds: root.descendantIds
    }))
  }
}

export const acquisitionSessionRead = async (
  client: AppServerClient,
  repository: string,
  threadId: string,
  includeTurns: boolean
): Promise<AcquisitionSessionRead> => {
  const thread = await readSession(client, repository, threadId, includeTurns)
  return {
    schema: SCHEMA,
    provider: 'codex',
    repository: realpathSync(repository),
    session: {
      id: threadId,
      sourceLocator: sourceLocator(threadId),
      contentType: 'application/json',
      content: thread,
      updatedAt: isoTimestamp(number(thread.updatedAt, 'thread updatedAt'), 'thread updatedAt')
    }
  }
}

const inventoryArtifact = (value: unknown): InventoryArtifact => {
  const artifact = object(value, 'inventory artifact')
  if (artifact.schema !== SCHEMA) throw new Error(`inventory artifact schema must be ${SCHEMA}`)
  if (!Array.isArray(artifact.roots)) throw new Error('inventory artifact roots must be an array')
  return {
    schema: SCHEMA,
    repository: text(artifact.repository, 'artifact repository'),
    codexVersion: text(artifact.codexVersion, 'artifact codexVersion'),
    generatedAt: text(artifact.generatedAt, 'artifact generatedAt'),
    protocolFingerprint: text(artifact.protocolFingerprint, 'artifact protocolFingerprint'),
    roots: artifact.roots.map((rootValue) => {
      const root = object(rootValue, 'artifact root')
      if (typeof root.archived !== 'boolean') throw new Error('artifact root archived must be boolean')
      if (!Array.isArray(root.descendantIds)) throw new Error('artifact root descendantIds must be an array')
      return {
        id: text(root.id, 'artifact root id'),
        cwd: text(root.cwd, 'artifact root cwd'),
        archived: root.archived,
        createdAt: number(root.createdAt, 'artifact root createdAt'),
        updatedAt: number(root.updatedAt, 'artifact root updatedAt'),
        status: text(root.status, 'artifact root status'),
        descendantIds: distinct(root.descendantIds.map((id) => text(id, 'artifact descendant id')))
      }
    })
  }
}

const comparable = (root: ThreadRecord): string =>
  JSON.stringify({
    id: root.id,
    cwd: root.cwd,
    archived: root.archived,
    createdAt: root.createdAt,
    updatedAt: root.updatedAt,
    descendantIds: root.descendantIds
  })

export const deleteReviewed = async (
  client: AppServerClient,
  artifactValue: unknown,
  repository: string,
  codexVersion: string,
  selectedIds: readonly string[],
  confirmation: string
): Promise<string[]> => {
  if (confirmation !== CONFIRMATION) throw new Error(`confirmation must equal ${CONFIRMATION}`)
  if (selectedIds.length === 0 || new Set(selectedIds).size !== selectedIds.length)
    throw new Error('select one or more duplicate-free root thread IDs')
  const artifact = inventoryArtifact(artifactValue)
  const physicalRepository = realpathSync(repository)
  if (artifact.repository !== physicalRepository)
    throw new Error('artifact repository does not match selected repository')
  if (artifact.codexVersion !== codexVersion) throw new Error('installed Codex version changed after review')
  if (artifact.protocolFingerprint !== protocolFingerprint) throw new Error('adapter protocol changed after review')
  const reviewed = new Map(artifact.roots.map((root) => [root.id, root]))
  for (const id of selectedIds)
    if (!reviewed.has(id)) throw new Error(`selected root ${id} is absent from the artifact`)

  const fresh = await buildInventory(client, physicalRepository, codexVersion)
  const current = new Map(fresh.roots.map((root) => [root.id, root]))
  for (const id of selectedIds) {
    const before = reviewed.get(id) as ThreadRecord
    const now = current.get(id)
    if (!now || comparable(before) !== comparable(now)) throw new Error(`selected root ${id} changed after review`)
  }

  const deleted: string[] = []
  for (const threadId of selectedIds) {
    const result = object(await client.request('thread/delete', { threadId }), 'thread/delete result')
    if (Object.keys(result).length !== 0) throw new Error(`thread/delete for ${threadId} returned an unexpected result`)
    deleted.push(threadId)
  }
  return deleted
}

export class StdioClient implements AppServerClient {
  readonly #process: ChildProcessWithoutNullStreams
  readonly #pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>()
  #id = 0

  private constructor(subprocess: ChildProcessWithoutNullStreams) {
    this.#process = subprocess
    const lines = createInterface({ input: subprocess.stdout })
    lines.on('line', (line) => {
      let message: JsonObject
      try {
        message = object(JSON.parse(line), 'app-server message')
      } catch (error) {
        for (const pending of this.#pending.values()) pending.reject(error as Error)
        this.#pending.clear()
        return
      }
      if (typeof message.id !== 'number') return
      const pending = this.#pending.get(message.id)
      if (!pending) return
      this.#pending.delete(message.id)
      if (message.error) pending.reject(new Error(JSON.stringify(message.error)))
      else pending.resolve(message.result)
    })
    subprocess.stderr.on('data', (chunk) => globalThis.process.stderr.write(chunk))
    subprocess.on('error', (error) => {
      for (const pending of this.#pending.values()) pending.reject(error)
      this.#pending.clear()
    })
    subprocess.on('exit', (code) => {
      if (code === 0) return
      for (const pending of this.#pending.values()) pending.reject(new Error(`codex app-server exited with ${code}`))
      this.#pending.clear()
    })
  }

  static async start(): Promise<StdioClient> {
    const client = new StdioClient(spawn('codex', ['app-server'], { stdio: ['pipe', 'pipe', 'pipe'] }))
    await client.request('initialize', {
      clientInfo: { name: 'ki_housekeeping_codex', title: 'KI Codex Housekeeping', version: '1.0.0' },
      capabilities: { experimentalApi: true, optOutNotificationMethods: ['item/agentMessage/delta'] }
    })
    client.#send({ method: 'initialized', params: {} })
    return client
  }

  #send(message: unknown): void {
    this.#process.stdin.write(`${JSON.stringify(message)}\n`)
  }

  request(method: string, params: JsonObject): Promise<unknown> {
    const id = this.#id++
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject })
      this.#send({ method, id, params })
    })
  }

  async close(): Promise<void> {
    this.#process.kill()
    await new Promise<void>((resolve) => this.#process.once('exit', () => resolve()))
  }
}

const value = (args: readonly string[], flag: string): string | undefined => {
  const index = args.indexOf(flag)
  return index === -1 ? undefined : args[index + 1]
}

const values = (args: readonly string[], flag: string): string[] =>
  args.flatMap((arg, index) => (arg === flag && args[index + 1] ? [args[index + 1] as string] : []))

export const installedCodexVersion = (): string => {
  const result = spawnSync('codex', ['--version'], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr.trim() || 'codex --version failed')
  return result.stdout.trim()
}

const help = (writeOutput: (value: string) => void): void => {
  writeOutput(`Usage:
  bun scripts/app-server.ts inventory --repo <absolute-repository>
  bun scripts/app-server.ts delete --repo <absolute-repository> --artifact <review.json> --thread <id> [--thread <id>...] --confirm ${CONFIRMATION}

inventory prints a content-minimised JSON review artifact and never deletes.
delete revalidates the complete reviewed selection before permanent deletion.`)
}

export type CliDependencies = {
  startClient: () => Promise<AppServerClient>
  codexVersion: () => string
  readArtifact: (artifactPath: string) => unknown
  writeOutput: (value: string) => void
}

export const readArtifactFile = (artifactPath: string): unknown => JSON.parse(readFileSync(artifactPath, 'utf8'))

const CLI_DEPENDENCIES: CliDependencies = {
  startClient: StdioClient.start,
  codexVersion: installedCodexVersion,
  readArtifact: readArtifactFile,
  writeOutput: (value) => console.log(value)
}

export const runCli = async (
  args: readonly string[] = process.argv.slice(2),
  dependencies: CliDependencies = CLI_DEPENDENCIES
): Promise<void> => {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) return help(dependencies.writeOutput)
  const mode = args[0]
  const repository = value(args, '--repo')
  if (!repository) throw new Error('--repo is required')
  const codexVersion = dependencies.codexVersion()
  const client = await dependencies.startClient()
  try {
    if (mode === 'inventory') {
      dependencies.writeOutput(JSON.stringify(await buildInventory(client, repository, codexVersion), null, 2))
      return
    }
    if (mode === 'delete') {
      const artifactPath = value(args, '--artifact')
      if (!artifactPath) throw new Error('--artifact is required')
      const artifact = dependencies.readArtifact(artifactPath)
      const deleted = await deleteReviewed(
        client,
        artifact,
        repository,
        codexVersion,
        values(args, '--thread'),
        value(args, '--confirm') ?? ''
      )
      dependencies.writeOutput(JSON.stringify({ deleted }, null, 2))
      return
    }
    throw new Error(`unknown mode ${mode}; use inventory or delete`)
  } finally {
    await client.close()
  }
}

export const runCliIfMain = (
  isMain: boolean,
  run: () => Promise<void> = runCli,
  reportError: (message: string) => void = (message) => {
    console.error(message)
    process.exitCode = 1
  }
): void => {
  if (!isMain) return
  void run().catch((error) => reportError(error instanceof Error ? error.message : String(error)))
}

runCliIfMain(import.meta.main)
