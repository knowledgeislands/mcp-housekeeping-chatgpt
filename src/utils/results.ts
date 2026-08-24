export const errorResult = (action: string, error: unknown) => ({
  isError: true as const,
  content: [
    { type: 'text' as const, text: `Error ${action}: ${error instanceof Error ? error.message : String(error)}` }
  ]
})

export const jsonResult = (payload: Record<string, unknown>) => ({
  structuredContent: payload,
  content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }]
})
