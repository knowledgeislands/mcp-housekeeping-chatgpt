import { describe, expect, it } from 'vitest'
import { errorResult, jsonResult } from './results.ts'

describe('result helpers', () => {
  it('formats Error and non-Error failures', () => {
    expect(errorResult('reading', new Error('broken'))).toMatchObject({
      isError: true,
      content: [{ type: 'text', text: 'Error reading: broken' }]
    })
    expect(errorResult('reading', 'broken')).toMatchObject({
      isError: true,
      content: [{ type: 'text', text: 'Error reading: broken' }]
    })
  })

  it('returns structured and readable JSON', () => {
    const payload = { count: 2, ok: true }
    expect(jsonResult(payload)).toEqual({
      structuredContent: payload,
      content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }]
    })
  })
})
