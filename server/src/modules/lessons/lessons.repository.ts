import { and, asc, desc, eq, exists, isNull, or, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import { lessons, studyPlans, studyPlanCollaborators, subjects, users, lessonRatings, subjectShares } from '../../db/schema'

// Used for INSERT/UPDATE RETURNING â€” only columns from the Lesson table itself
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

// Used for SELECT with LEFT JOIN users â€” includes authorFullName and ratings
const lessonSelect = (actorId: number) => ({
  ...lessonBaseSelect,
  authorFullName: users.fullName,
  likes: sql<number>`count(case when ${lessonRatings.vote} = 'LIKE' then 1 end)::int`,
  dislikes: sql<number>`count(case when ${lessonRatings.vote} = 'DISLIKE' then 1 end)::int`,
  userVote: sql<string | null>`max(case when ${lessonRatings.userId} = ${actorId} then ${lessonRatings.vote}::text else null end)`,
})

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
          ),
          exists(
            db
              .select({ id: subjectShares.id })
              .from(subjectShares)
              .where(and(eq(subjectShares.subjectId, lessons.subjectId), eq(subjectShares.userId, BigInt(actor.id)))),
          )
        )

    const whereParts = [
      subjectId ? eq(lessons.subjectId, subjectId) : undefined,
      includeDeleted ? undefined : isNull(lessons.deletedAt),
      visibility,
    ].filter(Boolean)

    const whereClause = and(...(whereParts as any))

    return db
      .select(lessonSelect(actor.id))
      .from(lessons)
      .leftJoin(subjects, eq(lessons.subjectId, subjects.id))
      .leftJoin(studyPlans, eq(subjects.studyPlanId, studyPlans.id))
      .leftJoin(users, eq(lessons.userId, users.id))
      .leftJoin(lessonRatings, eq(lessons.id, lessonRatings.lessonId))
      .where(whereClause)
      .groupBy(lessons.id, subjects.id, studyPlans.id, users.id)
      .orderBy(asc(lessons.orderIndex), asc(lessons.createdAt))
  }

  async findById(lessonId: bigint, actorId: number = 0) {
    const [lesson] = await db.select(lessonSelect(actorId))
      .from(lessons)
      .leftJoin(subjects, eq(lessons.subjectId, subjects.id))
      .leftJoin(studyPlans, eq(subjects.studyPlanId, studyPlans.id))
      .leftJoin(users, eq(lessons.userId, users.id))
      .leftJoin(lessonRatings, eq(lessons.id, lessonRatings.lessonId))
      .where(eq(lessons.id, lessonId))
      .groupBy(lessons.id, subjects.id, studyPlans.id, users.id)
      .limit(1)
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

    const [lesson] = await db.select({ userId: lessons.userId }).from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    if (!lesson) return false

    return lesson.userId !== null && lesson.userId === BigInt(actorId)
  }

  async setVote(lessonId: bigint, userId: bigint, vote: 'LIKE' | 'DISLIKE' | null) {
    if (vote === null) {
      await db.delete(lessonRatings).where(and(eq(lessonRatings.lessonId, lessonId), eq(lessonRatings.userId, userId)))
    } else {
      await db.insert(lessonRatings).values({
        lessonId,
        userId,
        vote
      }).onConflictDoUpdate({
        target: [lessonRatings.lessonId, lessonRatings.userId],
        set: { vote }
      })
    }
  }

}

export const lessonsRepository = new LessonsRepository()
