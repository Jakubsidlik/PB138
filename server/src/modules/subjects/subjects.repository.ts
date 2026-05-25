import { and, asc, eq, exists, gt, isNull, or, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import { subjects, studyPlans, studyPlanCollaborators, tasks, fileRecords, lessons, events } from '../../db/schema'
import { CursorPagination } from '../../types'

const subjectSelect = {
  id: subjects.id,
  userId: subjects.userId,
  studyPlanId: subjects.studyPlanId,
  name: subjects.name,
  teacher: subjects.teacher,
  code: subjects.code,
  isShared: subjects.isShared,
  isArchived: subjects.isArchived,
  deletedAt: subjects.deletedAt,
  createdAt: subjects.createdAt,
  updatedAt: subjects.updatedAt,
}

export class SubjectsRepository {
  async findAll(actor: { id: number, role: string }, filters: {
    pagination: CursorPagination
    includeDeleted?: boolean
    studyPlanId?: bigint | null
  }) {
    const { pagination, includeDeleted, studyPlanId } = filters

    const visibility = actor.role === 'PUBLIC'
      ? or(eq(subjects.isShared, true), eq(studyPlans.isShared, true))
      : or(
          eq(subjects.userId, BigInt(actor.id)),
          eq(subjects.isShared, true),
          eq(studyPlans.isShared, true),
          exists(
            db
              .select({ id: studyPlanCollaborators.id })
              .from(studyPlanCollaborators)
              .where(and(eq(studyPlanCollaborators.studyPlanId, subjects.studyPlanId), eq(studyPlanCollaborators.userId, BigInt(actor.id)))),
          ),
        )

    const whereParts = [
      includeDeleted ? undefined : isNull(subjects.deletedAt),
      studyPlanId ? eq(subjects.studyPlanId, studyPlanId) : undefined,
      visibility,
      pagination.enabled && pagination.cursor ? gt(subjects.id, pagination.cursor) : undefined,
    ].filter(Boolean)

    const whereClause = whereParts.length > 0 ? and(...(whereParts as Parameters<typeof and>)) : undefined

    const query = db.select(subjectSelect).from(subjects).leftJoin(studyPlans, eq(subjects.studyPlanId, studyPlans.id))
    
    const rows = pagination.enabled
      ? await query.where(whereClause).orderBy(asc(subjects.id)).limit(pagination.limit + 1).offset(pagination.cursor ? 1 : 0)
      : await query.where(whereClause).orderBy(asc(subjects.createdAt))

    return rows
  }

  async findById(subjectId: bigint) {
    const [subject] = await db.select({ id: subjects.id, userId: subjects.userId, studyPlanId: subjects.studyPlanId }).from(subjects).where(eq(subjects.id, subjectId)).limit(1)
    return subject || null
  }

  async create(data: any) {
    const [created] = await db.insert(subjects).values(data).returning(subjectSelect)
    return created
  }

  async update(subjectId: bigint, data: any) {
    const [updated] = await db.update(subjects).set(data).where(eq(subjects.id, subjectId)).returning(subjectSelect)
    return updated
  }

  async delete(subjectId: bigint) {
    const deletedAt = new Date()
    await db.transaction(async (transaction) => {
      await transaction.update(subjects).set({ deletedAt }).where(eq(subjects.id, subjectId))
      await transaction.update(fileRecords).set({ deletedAt }).where(eq(fileRecords.subjectId, subjectId))
      await transaction.update(lessons).set({ deletedAt }).where(eq(lessons.subjectId, subjectId))
    })
    return { success: true }
  }

  async countRows(table: any, subjectId: bigint) {
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(table).where(eq(table.subjectId, subjectId))
    return row?.count ?? 0
  }
}

export const subjectsRepository = new SubjectsRepository()
