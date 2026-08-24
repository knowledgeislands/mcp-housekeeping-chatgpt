import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { acquisitionCheckpoint, acquisitionSessionRead } from './local-store.ts'

const fixture = (): { root: string; project: string; id: string; bytes: Buffer } => {
  const root = mkdtempSync(join(tmpdir(), 'ki-housekeeping-chatgpt-'))
  const project = 'project-11111111-1111-1111-1111-111111111111'
  const id = '22222222-2222-2222-2222-222222222222'
  const directory = join(root, project, 'conversations-v3-33333333-3333-3333-3333-333333333333')
  mkdirSync(directory, { recursive: true })
  const bytes = Buffer.from([0, 1, 2, 255, 3])
  writeFileSync(join(directory, `${id}.data`), bytes)
  return { root, project, id, bytes }
}

describe('ChatGPT opaque local-store adapter', () => {
  test('discovers only matching physical records with metadata and no decoded content', () => {
    const { root, project, id, bytes } = fixture()
    const checkpoint = acquisitionCheckpoint(root, '2026-08-24T00:00:00.000Z')
    expect(checkpoint).toMatchObject({
      schema: 1,
      provider: 'chatgpt',
      generatedAt: '2026-08-24T00:00:00.000Z',
      adapter: { storeFormat: 'project-conversations-v3', opaquePayloads: true },
      sessions: [{ id, projectId: project, byteSize: bytes.byteLength, opaque: true }]
    })
    expect(checkpoint.sessions[0]?.sha256).toBe(createHash('sha256').update(bytes).digest('hex'))
    expect(JSON.stringify(checkpoint)).not.toContain(bytes.toString('base64'))
  })

  test('faithfully returns a selected opaque record as base64 bytes', () => {
    const { root, project, id, bytes } = fixture()
    const read = acquisitionSessionRead(root, project, id)
    expect(read.session).toMatchObject({
      id,
      projectId: project,
      opaque: true,
      contentType: 'application/octet-stream',
      contentEncoding: 'base64'
    })
    expect(Buffer.from(read.session.contentBase64, 'base64')).toEqual(bytes)
  })

  test('ignores non-conforming and symlinked paths, and rejects unavailable identities', () => {
    const { root, project, id } = fixture()
    const directory = join(root, project, 'conversations-v3-33333333-3333-3333-3333-333333333333')
    writeFileSync(join(directory, 'not-a-session.txt'), 'ignore')
    symlinkSync(join(directory, `${id}.data`), join(directory, '44444444-4444-4444-4444-444444444444.data'))
    expect(acquisitionCheckpoint(root).sessions).toHaveLength(1)
    expect(() => acquisitionSessionRead(root, project, '../outside')).toThrow('not present')
    expect(() => acquisitionSessionRead(root, project, '44444444-4444-4444-4444-444444444444')).toThrow('not present')
  })
})
