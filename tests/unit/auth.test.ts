import { describe, expect, it } from 'bun:test'
import { toAuthActor } from '../../server/src/auth'

describe('auth.ts', () => {
  describe('toAuthActor', () => {
    it('should map db user to AuthActor correctly', () => {
      const dbUser = {
        id: 123n,
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'REGISTERED' as const,
      }

      const actor = toAuthActor(dbUser)

      expect(actor.id).toBe(123)
      expect(actor.fullName).toBe('Test User')
      expect(actor.email).toBe('test@example.com')
      expect(actor.role).toBe('REGISTERED')
    })

    it('should handle admin roles', () => {
      const dbUser = {
        id: 456n,
        fullName: 'Admin',
        email: 'admin@example.com',
        role: 'ADMIN' as const,
      }

      const actor = toAuthActor(dbUser)

      expect(actor.id).toBe(456)
      expect(actor.role).toBe('ADMIN')
    })
  })
})
