import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  acquisitionCheckpoint,
  acquisitionSessionRead,
  installedCodexVersion,
  StdioClient
} from '../../main/codex/app-server.js'
import { READ_ONLY } from '../../utils/annotations.js'
import { errorResult, jsonResult } from '../../utils/results.js'

const repositoryArg = z
  .string()
  .min(1)
  .describe('Absolute path to the repository whose physical working directory scopes the sessions.')
const threadArg = z.string().min(1).describe('Codex thread identifier returned by codex_sessions_list.')

const withClient = async <T>(work: (client: StdioClient, version: string) => Promise<T>): Promise<T> => {
  const client = await StdioClient.start()
  try {
    return await work(client, installedCodexVersion())
  } finally {
    await client.close()
  }
}

export const registerCodexTools = (server: McpServer): void => {
  const register = server.registerTool.bind(server)

  register(
    'codex_sessions_discover',
    {
      title: 'Codex sessions: discover repository source',
      description:
        'Confirm the Codex adapter can inspect the selected physical repository and return source capabilities plus a content-minimised session count.',
      inputSchema: z.object({ repository: repositoryArg }).strict(),
      outputSchema: z.object({
        provider: z.literal('codex'),
        repository: z.string(),
        sessionCount: z.number(),
        operations: z.array(z.string())
      }),
      annotations: READ_ONLY
    },
    async ({ repository }) => {
      try {
        return jsonResult(
          await withClient(async (client, version) => {
            const checkpoint = await acquisitionCheckpoint(client, repository, version)
            return {
              provider: 'codex',
              repository: checkpoint.repository,
              sessionCount: checkpoint.sessions.length,
              operations: ['discover', 'list', 'read', 'checkpoint']
            }
          })
        )
      } catch (error) {
        return errorResult('discovering Codex sessions', error)
      }
    }
  )

  register(
    'codex_sessions_list',
    {
      title: 'Codex sessions: list repository checkpoint',
      description:
        'List content-minimised roots and provenance for sessions whose working directory exactly matches the selected physical repository.',
      inputSchema: z.object({ repository: repositoryArg }).strict(),
      outputSchema: z.object({
        schema: z.literal(1),
        provider: z.literal('codex'),
        repository: z.string(),
        generatedAt: z.string(),
        adapter: z.object({ version: z.string(), protocolFingerprint: z.string() }),
        sessions: z.array(z.unknown())
      }),
      annotations: READ_ONLY
    },
    async ({ repository }) => {
      try {
        return jsonResult(await withClient((client, version) => acquisitionCheckpoint(client, repository, version)))
      } catch (error) {
        return errorResult('listing Codex sessions', error)
      }
    }
  )

  register(
    'codex_session_read',
    {
      title: 'Codex sessions: read source thread',
      description:
        'Faithfully read one repository-scoped Codex thread. include_turns defaults to true for acquisition; callers should stage the result through KI before harvesting or deleting the source.',
      inputSchema: z
        .object({ repository: repositoryArg, thread_id: threadArg, include_turns: z.boolean().default(true) })
        .strict(),
      outputSchema: z.object({
        schema: z.literal(1),
        provider: z.literal('codex'),
        repository: z.string(),
        session: z.object({
          id: z.string(),
          sourceLocator: z.string(),
          contentType: z.literal('application/json'),
          content: z.record(z.string(), z.unknown()),
          updatedAt: z.string()
        })
      }),
      annotations: READ_ONLY
    },
    async ({ repository, thread_id, include_turns }) => {
      try {
        return jsonResult(
          await withClient((client) => acquisitionSessionRead(client, repository, thread_id, include_turns))
        )
      } catch (error) {
        return errorResult('reading Codex session', error)
      }
    }
  )

  register(
    'codex_sessions_checkpoint',
    {
      title: 'Codex sessions: create acquisition checkpoint',
      description:
        'Return a content-minimised, provenance-preserving Codex checkpoint for incremental KI acquisition. This does not write KI state or change any source session.',
      inputSchema: z.object({ repository: repositoryArg }).strict(),
      outputSchema: z.object({
        schema: z.literal(1),
        provider: z.literal('codex'),
        repository: z.string(),
        generatedAt: z.string(),
        adapter: z.object({ version: z.string(), protocolFingerprint: z.string() }),
        sessions: z.array(z.unknown())
      }),
      annotations: READ_ONLY
    },
    async ({ repository }) => {
      try {
        return jsonResult(await withClient((client, version) => acquisitionCheckpoint(client, repository, version)))
      } catch (error) {
        return errorResult('checkpointing Codex sessions', error)
      }
    }
  )
}
