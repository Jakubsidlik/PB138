import { describe, expect, it, mock } from 'bun:test'

import { subjectsRepository } from '../../server/src/modules/subjects/subjects.repository'
import { db } from '../../server/src/db/client'

describe('SubjectsService - studyPlanId accessibility mapping', () => {
  it('should nullify studyPlanId if actor has no access to the study plan', async () => {
    const servicePath = '../../server/src/modules/subjects/subjects.services.ts?nocache'
    const { subjectsService } = await import(servicePath) as any

    const originalFindAll = subjectsRepository.findAll
    const originalCountRows = subjectsRepository.countRows
    const originalSelect = db.select

    try {
      subjectsRepository.findAll = mock(async () => [
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

      expect(result[0].id).toBe(1)
      expect(result[0].studyPlanId).toBe(10)

      expect(result[1].id).toBe(2)
      expect(result[1].studyPlanId).toBe(20)

      expect(result[2].id).toBe(3)
      expect(result[2].studyPlanId).toBeNull()

    } finally {
      subjectsRepository.findAll = originalFindAll
      subjectsRepository.countRows = originalCountRows
      db.select = originalSelect
    }
  })
})
