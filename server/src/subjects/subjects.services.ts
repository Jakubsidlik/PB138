import { subjectsRepository } from './subjects.repository.js'
import { AppError } from '../middleware/error-handler.js'
import { asNumberId, toPaginatedPayload, asBigInt } from '../utils.js'
import { fileRecords, tasks, events, lessons, studyPlans, studyPlanCollaborators } from '../db/schema.js'
import { db } from '../db/client.js'
import { and, eq } from 'drizzle-orm'

export class SubjectsService {
  async getSubjects(actor: { id: number, role: string }, filters: {
    pagination: any
    includeDeleted?: boolean
    studyPlanId?: bigint | null
  }) {
    const rows = await subjectsRepository.findAll(actor, filters)
    
    const mappedSubjects = await Promise.all(rows.map(async (subject) => ({
      id: Number(subject.id),
      userId: asNumberId(subject.userId),
      studyPlanId: asNumberId(subject.studyPlanId),
      name: subject.name,
      teacher: subject.teacher,
      code: subject.code,
      isShared: subject.isShared,
      archived: subject.isArchived,
      deletedAt: subject.deletedAt ? subject.deletedAt.toISOString() : null,
      files: await subjectsRepository.countRows(fileRecords, subject.id),
      tasks: await subjectsRepository.countRows(tasks, subject.id),
      events: await subjectsRepository.countRows(events, subject.id),
      notes: await subjectsRepository.countRows(lessons, subject.id),
      createdAt: subject.createdAt.toISOString(),
      updatedAt: subject.updatedAt.toISOString(),
    })))

    if (!filters.pagination.enabled) {
      return mappedSubjects
    }

    return {
      ...toPaginatedPayload(mappedSubjects, filters.pagination.limit),
      limit: filters.pagination.limit,
    }
  }

  async createSubject(actor: { id: number, role: string }, data: {
    name: string
    teacher?: string | null
    code?: string | null
    studyPlanId?: number | null
    isShared?: boolean
  }) {
    const parsedStudyPlanId = asBigInt(data.studyPlanId)
    let ownerUserId = BigInt(actor.id)

    if (parsedStudyPlanId) {
      const [plan] = await db.select({ id: studyPlans.id, userId: studyPlans.userId }).from(studyPlans).where(eq(studyPlans.id, parsedStudyPlanId)).limit(1)
      if (!plan) {
        throw new AppError('Studijni plan nebyl nalezen.', 404)
      }

      const [collaborator] = await db
        .select({ role: studyPlanCollaborators.role })
        .from(studyPlanCollaborators)
        .where(and(eq(studyPlanCollaborators.studyPlanId, parsedStudyPlanId), eq(studyPlanCollaborators.userId, BigInt(actor.id))))
        .limit(1)

      const canCreateInPlan =
        actor.role === 'ADMIN' ||
        plan.userId === BigInt(actor.id) ||
        collaborator?.role === 'CONTRIBUTOR'

      if (!canCreateInPlan) {
        throw new AppError('Nemate opravneni pridavat predmety do tohoto planu.', 403)
      }

      ownerUserId = plan.userId
    }

    const created = await subjectsRepository.create({
      userId: ownerUserId,
      studyPlanId: parsedStudyPlanId,
      name: data.name,
      teacher: data.teacher,
      code: data.code,
      isShared: data.isShared,
    })

    return {
      id: Number(created.id),
      userId: Number(created.userId),
      studyPlanId: asNumberId(created.studyPlanId),
      name: created.name,
      teacher: created.teacher,
      code: created.code,
      isShared: created.isShared,
      archived: created.isArchived,
      deletedAt: null,
    }
  }

  async updateSubject(subjectId: bigint, actor: { id: number, role: string }, data: any) {
    const existing = await subjectsRepository.findById(subjectId)
    if (!existing) {
      throw new AppError('Predmet nebyl nalezen.', 404)
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      throw new AppError('Nemate opravneni upravit tento predmet.', 403)
    }

    const updated = await subjectsRepository.update(subjectId, {
      name: data.name,
      teacher: data.teacher,
      code: data.code,
      studyPlanId: data.studyPlanId !== undefined ? asBigInt(data.studyPlanId) : undefined,
      isShared: data.isShared,
      isArchived: data.archived,
    })

    return {
      id: Number(updated.id),
      userId: asNumberId(updated.userId),
      studyPlanId: asNumberId(updated.studyPlanId),
      name: updated.name,
      teacher: updated.teacher,
      code: updated.code,
      isShared: updated.isShared,
      archived: updated.isArchived,
      deletedAt: updated.deletedAt ? updated.deletedAt.toISOString() : null,
    }
  }

  async deleteSubject(subjectId: bigint, actor: { id: number, role: string }) {
    const existing = await subjectsRepository.findById(subjectId)
    if (!existing) {
      throw new AppError('Predmet nebyl nalezen.', 404)
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      throw new AppError('Nemate opravneni smazat tento predmet.', 403)
    }

    return subjectsRepository.delete(subjectId)
  }
}

export const subjectsService = new SubjectsService()
