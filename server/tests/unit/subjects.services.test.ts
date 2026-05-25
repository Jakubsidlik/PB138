import { describe, expect, it, mock } from 'bun:test'

// Import the real singletons in memory
import { subjectsRepository } from '../../src/modules/subjects/subjects.repository'
import { db } from '../../src/db/client'

describe('SubjectsService - studyPlanId accessibility mapping', () => {
  it('should nullify studyPlanId if actor has no access to the study plan', async () => {
    // 1. Dynamically import with ?nocache query param to bypass Bun E2E module mock cache entirely!
    // We use a dynamic string variable to bypass TypeScript static analysis compilation error.
    const servicePath = '../../src/modules/subjects/subjects.services.ts?nocache'
    const { subjectsService } = await import(servicePath) as any

    // Save original methods to avoid side-effects in other unit/e2e tests
    const originalFindAll = subjectsRepository.findAll
    const originalCountRows = subjectsRepository.countRows
    const originalSelect = db.select

    try {
      // 2. Directly mutate properties of the singleton instances in the memory graph
      subjectsRepository.findAll = mock(async () => [
        // Subject owned by actor - should keep studyPlanId
        {
          id: 1n,
          userId: 100n,
          studyPlanId: 10n,
          name: 'Subject 1',
          teacher: 'Teacher 1',
          code: 'CODE1',
          isShared: false,
          isArchived: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          studyPlanOwnerId: 100n,
          studyPlanIsShared: false,
          collaboratorId: null,
        },
        // Subject shared with actor, plan also shared with actor - should keep studyPlanId
        {
          id: 2n,
          userId: 200n,
          studyPlanId: 20n,
          name: 'Subject 2',
          teacher: 'Teacher 2',
          code: 'CODE2',
          isShared: true,
          isArchived: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          studyPlanOwnerId: 200n,
          studyPlanIsShared: false,
          collaboratorId: 999n,
        },
        // Subject shared with actor, plan NOT shared with actor - should nullify studyPlanId
        {
          id: 3n,
          userId: 200n,
          studyPlanId: 30n,
          name: 'Subject 3',
          teacher: 'Teacher 3',
          code: 'CODE3',
          isShared: true,
          isArchived: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          studyPlanOwnerId: 200n,
          studyPlanIsShared: false,
          collaboratorId: null,
        }
      ]) as any

      subjectsRepository.countRows = mock(async () => 0)

      db.select = mock(() => ({
        from: mock(() => ({
          innerJoin: mock(() => ({
            where: mock(async () => [])
          }))
        }))
      })) as any

      const actor = { id: 100, role: 'REGISTERED' }
      const filters = { pagination: { enabled: false } }

      const result: any = await subjectsService.getSubjects(actor, filters)

      expect(result).toHaveLength(3)

      // Subject 1: actor is study plan owner (100) -> should keep studyPlanId (10)
      expect(result[0].id).toBe(1)
      expect(result[0].studyPlanId).toBe(10)

      // Subject 2: actor is collaborator -> should keep studyPlanId (20)
      expect(result[1].id).toBe(2)
      expect(result[1].studyPlanId).toBe(20)

      // Subject 3: actor has no access to study plan -> should nullify studyPlanId
      expect(result[2].id).toBe(3)
      expect(result[2].studyPlanId).toBeNull()

    } finally {
      // 3. Restore original methods on the singletons to prevent side effects
      subjectsRepository.findAll = originalFindAll
      subjectsRepository.countRows = originalCountRows
      db.select = originalSelect
    }
  })
})
