import { describe, expect, it } from 'vitest'
import { parseOptionalDate } from '../utils.js'

describe('backend nullable handling', () => {
  it('keeps optional date fields empty when no value is provided', () => {
    expect(parseOptionalDate(undefined)).toBeUndefined()
    expect(parseOptionalDate(null)).toBeNull()
    expect(parseOptionalDate('')).toBeNull()
  })

  it('accepts valid date strings for nullable date fields', () => {
    const parsed = parseOptionalDate('2026-04-29')

    expect(parsed).toBeInstanceOf(Date)
    expect(parsed?.toISOString().startsWith('2026-04-29')).toBe(true)
  })

  it('rejects invalid date values for nullable date fields', () => {
    expect(parseOptionalDate('not-a-date')).toBeUndefined()
    expect(parseOptionalDate(123)).toBeUndefined()
    expect(parseOptionalDate({})).toBeUndefined()
  })
})