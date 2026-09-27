import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { acquisitionCheckpoint, acquisitionSessionRead } from '../../main/chatgpt/local-store.js'
import { READ_ONLY } from '../../utils/annotations.js'
import { errorResult, jsonResult } from '../../utils/results.js'

const projectArg = z
  .string()
  .regex(/^project-[A-Za-z0-9-]+$/)
  .describe('Project identifier returned by chatgpt_sessions_list.')
const sessionArg = z
  .string()
  .regex(/^[A-Za-z0-9-]+$/)
  .describe('Session identifier returned by chatgpt_sessions_list.')

export const registerChatGptTools = (server: McpServer, store: string): void => {
  server.registerTool(
    'chatgpt_sessions_discover',
    {
      title: 'ChatGPT sessions: discover local source',
      description:
        'Inspect the configured physical ChatGPT store and report only its opaque, read-only acquisition capabilities.',
      inputSchema: z.object({}).strict(),
      outputSchema: z.object({
        provider: z.literal('chatgpt'),
        store: z.string(),
        sessionCount: z.number(),
        operations: z.array(z.string())
      }),
      annotations: READ_ONLY
    },
    async () => {
      try {
        const checkpoint = acquisitionCheckpoint(store)
        return jsonResult({
          provider: 'chatgpt',
          store: checkpoint.store,
          sessionCount: checkpoint.sessions.length,
          operations: ['discover', 'list', 'read', 'checkpoint']
        })
      } catch (error) {
        return errorResult('discovering ChatGPT sessions', error)
      }
    }
  )
  for (const [name, title, description] of [
    [
      'chatgpt_sessions_list',
      'ChatGPT sessions: list local checkpoint',
      'List content-minimised provenance for opaque local ChatGPT records.'
    ],
    [
      'chatgpt_sessions_checkpoint',
      'ChatGPT sessions: create acquisition checkpoint',
      'Return a content-minimised checkpoint for incremental KI acquisition without changing the source.'
    ]
  ] as const) {
    server.registerTool(
      name,
      {
        title,
        description,
        inputSchema: z.object({}).strict(),
        outputSchema: z.object({
          schema: z.literal(1),
          provider: z.literal('chatgpt'),
          store: z.string(),
          generatedAt: z.string(),
          adapter: z.object({ storeFormat: z.literal('project-conversations-v3'), opaquePayloads: z.literal(true) }),
          sessions: z.array(z.unknown())
        }),
        annotations: READ_ONLY
      },
      async () => {
        try {
          return jsonResult(acquisitionCheckpoint(store))
        } catch (error) {
          return errorResult('checkpointing ChatGPT sessions', error)
        }
      }
    )
  }
  server.registerTool(
    'chatgpt_session_read',
    {
      title: 'ChatGPT sessions: read opaque source record',
      description:
        'Faithfully return one opaque local record as base64 bytes and provenance. It does not decode, mutate, archive, or delete the source.',
      inputSchema: z.object({ project_id: projectArg, session_id: sessionArg }).strict(),
      outputSchema: z.object({
        schema: z.literal(1),
        provider: z.literal('chatgpt'),
        store: z.string(),
        session: z.object({
          id: z.string(),
          projectId: z.string(),
          sourceLocator: z.string(),
          sourcePath: z.string(),
          byteSize: z.number(),
          modifiedAt: z.string(),
          sha256: z.string(),
          opaque: z.literal(true),
          contentType: z.literal('application/octet-stream'),
          contentEncoding: z.literal('base64'),
          contentBase64: z.string()
        })
      }),
      annotations: READ_ONLY
    },
    async ({ project_id, session_id }) => {
      try {
        return jsonResult(acquisitionSessionRead(store, project_id, session_id))
      } catch (error) {
        return errorResult('reading ChatGPT session', error)
      }
    }
  )
}
