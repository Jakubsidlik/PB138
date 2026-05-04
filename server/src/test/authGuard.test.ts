import { describe, expect, it } from 'vitest'
import { canAccessProtectedResource, isPublicActor } from '../accessControl.js'

describe('auth guard rules', () => {
  it('rejects public actors from protected backend actions', () => {
    expect(
      canAccessProtectedResource({
        fullName: 'Verejnost',
        email: '',
        role: 'PUBLIC',
      }),
    ).toBe(false)
  })

  it('allows registered and admin actors to access protected backend actions', () => {
    expect(
      canAccessProtectedResource({
        id: 1,
        fullName: 'Student',
        email: 'student@example.com',
        role: 'REGISTERED',
      }),
    ).toBe(true)

    expect(
      canAccessProtectedResource({
        id: 2,
        fullName: 'Admin',
        email: 'admin@example.com',
        role: 'ADMIN',
      }),
    ).toBe(true)
  })

  it('detects public actors explicitly', () => {
    expect(
      isPublicActor({
        fullName: 'Verejnost',
        email: '',
        role: 'PUBLIC',
      }),
    ).toBe(true)

    expect(
      isPublicActor({
        id: 3,
        fullName: 'Student',
        email: 'student@example.com',
        role: 'REGISTERED',
      }),
    ).toBe(false)
  })
})