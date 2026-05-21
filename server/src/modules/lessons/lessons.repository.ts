import { and, asc, desc, eq, exists, isNull, or, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { lessons, studyPlans, studyPlanCollaborators, subjects, users } from '../../db/schema.js'

// Used for INSERT/UPDATE RETURNING — only columns from the Lesson table itself
const lessonBaseSelect = {
  id: lessons.id,
  subjectId: lessons.subjectId,
  userId: lessons.userId,
  title: lessons.title,
  content: lessons.content,
  isShared: lessons.isShared,
  orderIndex: lessons.orderIndex,
  deletedAt: lessons.deletedAt,
  createdAt: lessons.createdAt,
  updatedAt: lessons.updatedAt,
}

// Used for SELECT with LEFT JOIN users — includes authorFullName
const lessonSelect = {
  ...lessonBaseSelect,
  authorFullName: users.fullName,
}

export class LessonsRepository {
  async findAll(actor: { id: number, role: string }, filters: {
    subjectId?: bigint | null
    includeDeleted?: boolean
  }) {
    const { subjectId, includeDeleted } = filters

    const visibility = actor.role === 'PUBLIC'
      ? or(eq(lessons.isShared, true), eq(subjects.isShared, true), eq(studyPlans.isShared, true))
      : or(
          eq(lessons.isShared, true),
          eq(subjects.userId, BigInt(actor.id)),
          eq(subjects.isShared, true),
          eq(studyPlans.isShared, true),
          exists(
            db
              .select({ id: studyPlanCollaborators.id })
              .from(studyPlanCollaborators)
              .where(and(eq(studyPlanCollaborators.studyPlanId, subjects.studyPlanId), eq(studyPlanCollaborators.userId, BigInt(actor.id)))),
          )
        )

    const whereParts = [
      subjectId ? eq(lessons.subjectId, subjectId) : undefined,
      includeDeleted ? undefined : isNull(lessons.deletedAt),
      visibility,
    ].filter(Boolean)

    const whereClause = and(...(whereParts as any))

    return db
      .select(lessonSelect)
      .from(lessons)
      .leftJoin(subjects, eq(lessons.subjectId, subjects.id))
      .leftJoin(studyPlans, eq(subjects.studyPlanId, studyPlans.id))
      .leftJoin(users, eq(lessons.userId, users.id))
      .where(whereClause)
      .orderBy(asc(lessons.orderIndex), asc(lessons.createdAt))
  }

  async findById(lessonId: bigint) {
    const [lesson] = await db.select(lessonSelect)
      .from(lessons)
      .leftJoin(users, eq(lessons.userId, users.id))
      .where(eq(lessons.id, lessonId)).limit(1)
    return lesson || null
  }

  async create(data: any) {
    const [created] = await db.insert(lessons).values(data).returning(lessonBaseSelect)
    return created
  }

  async update(lessonId: bigint, data: any) {
    const [updated] = await db.update(lessons).set(data).where(eq(lessons.id, lessonId)).returning(lessonBaseSelect)
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

    const [lesson] = await db.select({ subjectId: lessons.subjectId }).from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    if (!lesson) return false

    if (lesson.subjectId !== null) {
      const [ownSubject] = await db.select({ id: subjects.id }).from(subjects).where(and(eq(subjects.id, lesson.subjectId), eq(subjects.userId, BigInt(actorId)))).limit(1)
      if (ownSubject) return true
      
      const [collab] = await db.select({ id: studyPlanCollaborators.id })
        .from(subjects)
        .innerJoin(studyPlanCollaborators, eq(subjects.studyPlanId, studyPlanCollaborators.studyPlanId))
        .where(and(eq(subjects.id, lesson.subjectId), eq(studyPlanCollaborators.userId, BigInt(actorId))))
        .limit(1)
      if (collab) return true
    }

    return false
  }

}

export const lessonsRepository = new LessonsRepository()
