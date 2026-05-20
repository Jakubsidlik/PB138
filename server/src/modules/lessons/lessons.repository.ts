import { and, asc, desc, eq, exists, isNull, or, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { lessons, studyPlans, studyPlanCollaborators, subjects } from '../../db/schema.js'

const lessonSelect = {
  id: lessons.id,
  subjectId: lessons.subjectId,
  studyPlanId: lessons.studyPlanId,
  title: lessons.title,
  content: lessons.content,
  isShared: lessons.isShared,
  orderIndex: lessons.orderIndex,
  deletedAt: lessons.deletedAt,
  createdAt: lessons.createdAt,
  updatedAt: lessons.updatedAt,
}

export class LessonsRepository {
  async findAll(actor: { id: number, role: string }, filters: {
    subjectId?: bigint | null
    studyPlanId?: bigint | null
    includeDeleted?: boolean
  }) {
    const { subjectId, studyPlanId, includeDeleted } = filters

    const visibility = actor.role === 'PUBLIC'
      ? eq(lessons.isShared, true)
      : or(
          eq(lessons.isShared, true),
          eq(subjects.userId, BigInt(actor.id)),
          eq(studyPlans.userId, BigInt(actor.id)),
          exists(
            db
              .select({ id: studyPlanCollaborators.id })
              .from(studyPlanCollaborators)
              .where(and(eq(studyPlanCollaborators.studyPlanId, lessons.studyPlanId), eq(studyPlanCollaborators.userId, BigInt(actor.id)))),
          ),
        )

    const whereParts = [
      subjectId ? eq(lessons.subjectId, subjectId) : undefined,
      studyPlanId ? eq(lessons.studyPlanId, studyPlanId) : undefined,
      includeDeleted ? undefined : isNull(lessons.deletedAt),
      visibility,
    ].filter(Boolean)

    const whereClause = and(...(whereParts as any))

    return db
      .select(lessonSelect)
      .from(lessons)
      .leftJoin(subjects, eq(lessons.subjectId, subjects.id))
      .leftJoin(studyPlans, eq(lessons.studyPlanId, studyPlans.id))
      .where(whereClause)
      .orderBy(asc(lessons.orderIndex), asc(lessons.createdAt))
  }

  async findById(lessonId: bigint) {
    const [lesson] = await db.select(lessonSelect).from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    return lesson || null
  }

  async create(data: any) {
    const [created] = await db.insert(lessons).values(data).returning(lessonSelect)
    return created
  }

  async update(lessonId: bigint, data: any) {
    const [updated] = await db.update(lessons).set(data).where(eq(lessons.id, lessonId)).returning(lessonSelect)
    return updated
  }

  async softDelete(lessonId: bigint) {
    await db.update(lessons).set({ deletedAt: new Date() }).where(eq(lessons.id, lessonId))
    return { success: true }
  }

  async countByLesson(table: any, lessonId: bigint) {
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(table).where(eq(table.lessonId, lessonId))
    return row?.count ?? 0
  }


  async canActorManageLesson(actorId: number, actorRole: string, lessonId: bigint) {
    if (actorRole === 'ADMIN') return true

    const [lesson] = await db.select({ subjectId: lessons.subjectId, studyPlanId: lessons.studyPlanId }).from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    if (!lesson) return false

    if (lesson.studyPlanId !== null) {
      const [ownPlan] = await db.select({ id: studyPlans.id }).from(studyPlans).where(and(eq(studyPlans.id, lesson.studyPlanId), eq(studyPlans.userId, BigInt(actorId)))).limit(1)
      if (ownPlan) return true

      const [collaborator] = await db.select({ id: studyPlanCollaborators.id }).from(studyPlanCollaborators).where(and(eq(studyPlanCollaborators.studyPlanId, lesson.studyPlanId), eq(studyPlanCollaborators.userId, BigInt(actorId)))).limit(1)
      if (collaborator) return true
    }

    if (lesson.subjectId !== null) {
      const [ownSubject] = await db.select({ id: subjects.id }).from(subjects).where(and(eq(subjects.id, lesson.subjectId), eq(subjects.userId, BigInt(actorId)))).limit(1)
      if (ownSubject) return true
    }

    return false
  }

}

export const lessonsRepository = new LessonsRepository()
