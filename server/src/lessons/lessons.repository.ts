import { and, asc, desc, eq, exists, gt, inArray, isNull, or, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { lessons, lessonNotes, textAnnotations, studyPlans, studyPlanCollaborators, subjects, fileRecords } from '../db/schema.js'
import { asBigInt } from '../utils.js'

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

  async findNotes(lessonId: bigint, filters: { includeAll?: boolean, userId?: bigint, isPublic?: boolean }) {
    const whereParts = [
      eq(lessonNotes.lessonId, lessonId),
      filters.isPublic ? undefined : (filters.includeAll ? undefined : eq(lessonNotes.userId, filters.userId!)),
    ].filter(Boolean)

    return db
      .select()
      .from(lessonNotes)
      .where(and(...(whereParts as any)))
      .orderBy(desc(lessonNotes.isPinned), asc(lessonNotes.createdAt))
  }

  async createNote(data: any) {
    const [created] = await db.insert(lessonNotes).values(data).returning()
    return created
  }

  async updateNote(noteId: bigint, data: any) {
    const [updated] = await db.update(lessonNotes).set(data).where(eq(lessonNotes.id, noteId)).returning()
    return updated
  }

  async deleteNote(noteId: bigint) {
    await db.delete(lessonNotes).where(eq(lessonNotes.id, noteId))
    return { success: true }
  }

  async findAnnotations(targetType: any, targetId: bigint) {
    return db
      .select()
      .from(textAnnotations)
      .where(and(eq(textAnnotations.targetType, targetType), eq(textAnnotations.targetId, targetId)))
      .orderBy(asc(textAnnotations.createdAt))
  }

  async createAnnotation(data: any) {
    const [created] = await db.insert(textAnnotations).values(data).returning()
    return created
  }

  async deleteAnnotation(annotationId: bigint) {
    await db.delete(textAnnotations).where(eq(textAnnotations.id, annotationId))
    return { success: true }
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

  async findNoteById(noteId: bigint) {
    const [note] = await db.select({ id: lessonNotes.id, userId: lessonNotes.userId }).from(lessonNotes).where(eq(lessonNotes.id, noteId)).limit(1)
    return note || null
  }

  async findAnnotationById(annotationId: bigint) {
    const [annotation] = await db.select({ id: textAnnotations.id, userId: textAnnotations.userId }).from(textAnnotations).where(eq(textAnnotations.id, annotationId)).limit(1)
    return annotation || null
  }
}

export const lessonsRepository = new LessonsRepository()
