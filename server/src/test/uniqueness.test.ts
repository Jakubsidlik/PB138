import { describe, expect, it } from 'vitest'
import { isEmailAvailable } from '../validation.js'

describe('backend uniqueness checks', () => {
  it('rejects an email that is already used', () => {
    expect(isEmailAvailable('student@example.com', 'student@example.com')).toBe(false)
    expect(isEmailAvailable('student@example.com', 'STUDENT@example.com')).toBe(false)
    expect(isEmailAvailable('student@example.com', 'other@example.com')).toBe(true)
    expect(isEmailAvailable('student@example.com', null)).toBe(true)
  })
})