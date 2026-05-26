import { describe, expect, it } from 'bun:test'
import { canAccessProtectedResource, isPublicActor } from '../../server/src/accessControl'

describe('auth guard rules', () => {
  it('rejects public actors from protected backend actions', () => {
    expect(
      canAccessProtectedResource({
        id: 0,
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
        id: 0,
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
