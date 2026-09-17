import { describe, expect, it } from 'vitest'
import type { AccessLevel } from '../config/index.js'
import { levelFromAnnotations, makeAccessGatedRegister } from './access-level.js'
import { READ_ONLY } from './annotations.js'
import type { AuditConfig } from './audit-log.js'

const AUDIT_OFF: AuditConfig = { mode: 'off', path: '/dev/null', maxBytes: 0, keep: 0 }
const WRITE = { readOnlyHint: false, destructiveHint: false }
const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true }

const registeredAt = (accessLevel: AccessLevel): string[] => {
  const names: string[] = []
  const server = {
    registerTool(name: string) {
      names.push(name)
      return name
    }
  }
  const register = makeAccessGatedRegister(server as never, accessLevel, AUDIT_OFF)
  const callback = () => ({})

  register('read', { annotations: READ_ONLY } as never, callback as never)
  register('write', { annotations: WRITE } as never, callback as never)
  register('destructive', { annotations: DESTRUCTIVE } as never, callback as never)
  register('unannotated', {} as never, callback as never)
  return names
}

describe('levelFromAnnotations', () => {
  it('maps explicit annotations and fails closed', () => {
    expect(levelFromAnnotations(READ_ONLY)).toBe('read')
    expect(levelFromAnnotations(WRITE)).toBe('write')
    expect(levelFromAnnotations(DESTRUCTIVE)).toBe('destructive')
    expect(levelFromAnnotations(undefined)).toBe('destructive')
    expect(levelFromAnnotations({ readOnlyHint: false })).toBe('destructive')
  })
})

describe('makeAccessGatedRegister', () => {
  it('registers only tools within the configured access level', () => {
    expect(registeredAt('read')).toEqual(['read'])
    expect(registeredAt('write')).toEqual(['read', 'write'])
    expect(registeredAt('destructive')).toEqual(['read', 'write', 'destructive', 'unannotated'])
  })
})
