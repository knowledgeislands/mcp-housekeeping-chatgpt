/**
 * Read-only adapter for the installed ChatGPT application's opaque local store.
 * It preserves bytes and provenance; it never decodes, deletes, or mutates records.
 */

import { createHash } from 'node:crypto'
import { lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { join, relative } from 'node:path'

const SCHEMA = 1 as const
const PROJECT = /^project-[A-Za-z0-9-]+$/
const CONVERSATIONS = /^conversations-v3-[A-Za-z0-9-]+$/
const RECORD = /^([A-Za-z0-9-]+)\.data$/

export type ChatGptSession = {
  id: string
  projectId: string
  sourceLocator: string
  sourcePath: string
  byteSize: number
  modifiedAt: string
  sha256: string
  opaque: true
}

export type ChatGptCheckpoint = {
  schema: typeof SCHEMA
  provider: 'chatgpt'
  store: string
  generatedAt: string
  adapter: { storeFormat: 'project-conversations-v3'; opaquePayloads: true }
  sessions: ChatGptSession[]
}

export type ChatGptSessionRead = {
  schema: typeof SCHEMA
  provider: 'chatgpt'
  store: string
  session: ChatGptSession & {
    contentType: 'application/octet-stream'
    contentEncoding: 'base64'
    contentBase64: string
  }
}

const physicalDirectory = (path: string): string => {
  const stat = lstatSync(path)
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`store path must be a physical directory: ${path}`)
  return realpathSync(path)
}

const physicalRecord = (path: string): Buffer => {
  const stat = lstatSync(path)
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`session record must be a physical file: ${path}`)
  return readFileSync(path)
}

const locator = (projectId: string, id: string): string =>
  `chatgpt-local://projects/${encodeURIComponent(projectId)}/sessions/${encodeURIComponent(id)}`

const session = (store: string, projectId: string, recordPath: string): ChatGptSession => {
  const match = RECORD.exec(recordPath.split('/').at(-1) ?? '')
  if (!match) throw new Error(`invalid session record name: ${recordPath}`)
  const bytes = physicalRecord(recordPath)
  return {
    id: match[1] as string,
    projectId,
    sourceLocator: locator(projectId, match[1] as string),
    sourcePath: relative(store, recordPath),
    byteSize: bytes.byteLength,
    modifiedAt: lstatSync(recordPath).mtime.toISOString(),
    sha256: createHash('sha256').update(bytes).digest('hex'),
    opaque: true
  }
}

export const acquisitionCheckpoint = (storePath: string, generatedAt = new Date().toISOString()): ChatGptCheckpoint => {
  const store = physicalDirectory(storePath)
  const sessions: ChatGptSession[] = []
  for (const projectId of readdirSync(store)
    .filter((name) => PROJECT.test(name))
    .sort()) {
    const projectPath = join(store, projectId)
    if (!lstatSync(projectPath).isDirectory() || lstatSync(projectPath).isSymbolicLink()) continue
    for (const conversations of readdirSync(projectPath)
      .filter((name) => CONVERSATIONS.test(name))
      .sort()) {
      const conversationsPath = join(projectPath, conversations)
      if (!lstatSync(conversationsPath).isDirectory() || lstatSync(conversationsPath).isSymbolicLink()) continue
      for (const record of readdirSync(conversationsPath)
        .filter((name) => RECORD.test(name))
        .sort()) {
        const recordPath = join(conversationsPath, record)
        const stat = lstatSync(recordPath)
        if (!stat.isFile() || stat.isSymbolicLink()) continue
        sessions.push(session(store, projectId, recordPath))
      }
    }
  }
  return {
    schema: SCHEMA,
    provider: 'chatgpt',
    store,
    generatedAt,
    adapter: { storeFormat: 'project-conversations-v3', opaquePayloads: true },
    sessions: sessions.sort((left, right) => left.sourcePath.localeCompare(right.sourcePath))
  }
}

export const acquisitionSessionRead = (storePath: string, projectId: string, id: string): ChatGptSessionRead => {
  const checkpoint = acquisitionCheckpoint(storePath)
  const found = checkpoint.sessions.find((candidate) => candidate.projectId === projectId && candidate.id === id)
  if (!found) throw new Error(`ChatGPT session is not present in the physical store: ${projectId}/${id}`)
  const bytes = physicalRecord(join(checkpoint.store, found.sourcePath))
  return {
    schema: SCHEMA,
    provider: 'chatgpt',
    store: checkpoint.store,
    session: {
      ...found,
      contentType: 'application/octet-stream',
      contentEncoding: 'base64',
      contentBase64: bytes.toString('base64')
    }
  }
}
