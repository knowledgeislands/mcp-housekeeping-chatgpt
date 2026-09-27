import { strict as assert } from 'node:assert'
import { homedir } from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const hydrateEnvFromFiles = (): void => {
  const files = ['.env.local']
  if (process.env.NODE_ENV) files.push(`.env.${process.env.NODE_ENV}`)
  files.push('.env')
  for (const file of files) {
    try {
      process.loadEnvFile(path.join(packageRoot, file))
    } catch {
      // Bun loads these files itself; missing files are optional under Node.
    }
  }
}

export type AccessLevel = 'read' | 'write' | 'destructive'
export const ACCESS_LEVELS: readonly AccessLevel[] = ['read', 'write', 'destructive'] as const
export const ACCESS_LEVEL_RANK: Record<AccessLevel, number> = { read: 1, write: 2, destructive: 3 }
export type AuditLogMode = 'off' | 'writes' | 'all'

export interface Config {
  housekeepingPath: string
  accessLevel: AccessLevel
  auditLogMode: AuditLogMode
  auditLogPath: string
  auditLogMaxBytes: number
  auditLogKeep: number
}

const accessLevel = (value: string | undefined): AccessLevel => {
  if (!value) return 'read'
  if ((ACCESS_LEVELS as readonly string[]).includes(value)) return value as AccessLevel
  throw new Error(`Invalid MCP_HOUSEKEEPING_CHATGPT_ACCESS_LEVEL="${value}". Allowed: ${ACCESS_LEVELS.join(', ')}`)
}

const auditLogMode = (value: string | undefined): AuditLogMode => {
  if (!value) return 'writes'
  if (value === 'off' || value === 'writes' || value === 'all') return value
  throw new Error(`Invalid MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG="${value}". Allowed: off, writes, all`)
}

const nonNegativeInt = (value: string | undefined, fallback: number, name: string): number => {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 0)
    throw new Error(`Invalid ${name}="${value}"; expected a non-negative integer`)
  return parsed
}

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
  if (env === process.env) hydrateEnvFromFiles()
  assert(env.MCP_HOUSEKEEPING_CHATGPT_PATH, 'MCP_HOUSEKEEPING_CHATGPT_PATH environment variable must be set')
  const configuredPath = env.MCP_HOUSEKEEPING_CHATGPT_PATH
  const housekeepingPath = path.resolve(
    configuredPath === '~' ? homedir() : configuredPath.replace(/^~\//, `${homedir()}/`)
  )
  return {
    housekeepingPath,
    accessLevel: accessLevel(env.MCP_HOUSEKEEPING_CHATGPT_ACCESS_LEVEL),
    auditLogMode: auditLogMode(env.MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG),
    auditLogPath: path.resolve(
      env.MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_PATH ?? path.join(housekeepingPath, 'audit', 'audit.jsonl')
    ),
    auditLogMaxBytes: nonNegativeInt(
      env.MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_MAX_BYTES,
      10 * 1024 * 1024,
      'MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_MAX_BYTES'
    ),
    auditLogKeep: nonNegativeInt(
      env.MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_KEEP,
      5,
      'MCP_HOUSEKEEPING_CHATGPT_AUDIT_LOG_KEEP'
    )
  }
}
