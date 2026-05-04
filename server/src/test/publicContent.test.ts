import { describe, expect, it } from 'vitest'
import { isPubliclyVisible } from '../contentVisibility.js'

describe('public content visibility', () => {
  it('allows only shared and not deleted content for anonymous users', () => {
    expect(isPubliclyVisible({ isShared: true, deletedAt: null })).toBe(true)
    expect(isPubliclyVisible({ isShared: true, deletedAt: undefined })).toBe(false)
    expect(isPubliclyVisible({ isShared: false, deletedAt: null })).toBe(false)
    expect(isPubliclyVisible({ isShared: null, deletedAt: null })).toBe(false)
  })

  it('rejects deleted content even when it is shared', () => {
    expect(isPubliclyVisible({ isShared: true, deletedAt: new Date() })).toBe(false)
  })
})
