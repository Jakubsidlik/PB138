import express from 'express'
import { and, asc, desc, eq, exists, inArray, isNull, or, sql } from 'drizzle-orm'

import { db } from './db/client.js'
import { fileRecords, lessonNotes, lessons, studyPlanCollaborators, studyPlans, subjects, textAnnotations } from './db/schema.js'
import { lessonNoteSchema, lessonSchema, textAnnotationSchema, updateLessonNoteSchema, updateLessonSchema } from './schemas.js'
import { asBigInt, asNumberId, parseAnnotationTargetType } from './utils.js'
import { getActorFromRequest, isPublicActor, requireRegisteredActor, canActorReadAnnotationTarget } from './auth.js'

export const lessonsRouter: express.Router = express.Router()
export const lessonNotesRouter: express.Router = express.Router()
export const annotationsRouter: express.Router = express.Router()

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

const countByLesson = async (table: any, lessonId: bigint) => {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(table).where(eq(table.lessonId, lessonId))
  return row?.count ?? 0
}

const canActorManageLesson = async (actor: Awaited<ReturnType<typeof getActorFromRequest>>, lessonId: bigint) => {
  if (actor.role === 'ADMIN') return true

  const [lesson] = await db.select({ subjectId: lessons.subjectId, studyPlanId: lessons.studyPlanId }).from(lessons).where(eq(lessons.id, lessonId)).limit(1)
  if (!lesson) return false

  if (lesson.studyPlanId !== null) {
    const [ownPlan] = await db.select({ id: studyPlans.id }).from(studyPlans).where(and(eq(studyPlans.id, lesson.studyPlanId), eq(studyPlans.userId, BigInt(actor.id)))).limit(1)
    if (ownPlan) return true

    const [collaborator] = await db.select({ id: studyPlanCollaborators.id }).from(studyPlanCollaborators).where(and(eq(studyPlanCollaborators.studyPlanId, lesson.studyPlanId), eq(studyPlanCollaborators.userId, BigInt(actor.id)))).limit(1)
    if (collaborator) return true
  }

  if (lesson.subjectId !== null) {
    const [ownSubject] = await db.select({ id: subjects.id }).from(subjects).where(and(eq(subjects.id, lesson.subjectId), eq(subjects.userId, BigInt(actor.id)))).limit(1)
    if (ownSubject) return true
  }

  return false
}

lessonsRouter.get('/', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const subjectId = asBigInt(req.query.subjectId)
    const studyPlanId = asBigInt(req.query.studyPlanId)
    const includeDeleted = req.query.includeDeleted === 'true'

    const rows = await db
      .select(lessonSelect)
      .from(lessons)
      .leftJoin(subjects, eq(lessons.subjectId, subjects.id))
      .leftJoin(studyPlans, eq(lessons.studyPlanId, studyPlans.id))
      .where(
        isPublicActor(actor)
          ? and(
              subjectId ? eq(lessons.subjectId, subjectId) : undefined,
              studyPlanId ? eq(lessons.studyPlanId, studyPlanId) : undefined,
              eq(lessons.isShared, true),
              includeDeleted ? undefined : isNull(lessons.deletedAt),
            )
          : and(
              subjectId ? eq(lessons.subjectId, subjectId) : undefined,
              studyPlanId ? eq(lessons.studyPlanId, studyPlanId) : undefined,
              includeDeleted ? undefined : isNull(lessons.deletedAt),
              or(
                eq(lessons.isShared, true),
                eq(subjects.userId, BigInt(actor.id)),
                eq(studyPlans.userId, BigInt(actor.id)),
                exists(
                  db
                    .select({ id: studyPlanCollaborators.id })
                    .from(studyPlanCollaborators)
                    .where(and(eq(studyPlanCollaborators.studyPlanId, lessons.studyPlanId), eq(studyPlanCollaborators.userId, BigInt(actor.id)))),
                ),
              ),
            ),
      )
      .orderBy(asc(lessons.orderIndex), asc(lessons.createdAt))

    const mappedLessons = await Promise.all(rows.map(async (row) => ({
      id: Number(row.id),
      subjectId: asNumberId(row.subjectId),
      studyPlanId: asNumberId(row.studyPlanId),
      title: row.title,
      content: row.content,
      isShared: row.isShared,
      orderIndex: row.orderIndex,
      notesCount: await countByLesson(lessonNotes, row.id),
      filesCount: await countByLesson(fileRecords, row.id),
      deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })))

    res.json(mappedLessons)
  } catch (error) {
    next(error)
  }
})

lessonsRouter.post('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const parsed = lessonSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const payload = parsed.data

    const [created] = await db.insert(lessons).values({
      subjectId: asBigInt(payload.subjectId),
      studyPlanId: asBigInt(payload.studyPlanId),
      title: payload.title,
      content: payload.content ?? null,
      isShared: payload.isShared,
      orderIndex: Math.trunc(payload.orderIndex),
    }).returning(lessonSelect)

    res.status(201).json({
      id: Number(created.id),
      subjectId: asNumberId(created.subjectId),
      studyPlanId: asNumberId(created.studyPlanId),
      title: created.title,
      content: created.content,
      isShared: created.isShared,
      orderIndex: created.orderIndex,
      deletedAt: created.deletedAt,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

lessonsRouter.patch('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const lessonId = asBigInt(req.params.id)
    if (!lessonId) {
      res.status(400).json({ error: 'Neplatne ID lekce.' })
      return
    }

    const existing = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    if (!existing.length) {
      res.status(404).json({ error: 'Lekce nebyla nalezena.' })
      return
    }

    const canEditLesson = await canActorManageLesson(actor, lessonId)
    if (!canEditLesson) {
      res.status(403).json({ error: 'Nemate opravneni upravit tuto lekci.' })
      return
    }

    const parsed = updateLessonSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const payload = parsed.data

    const [updated] = await db.update(lessons).set({
      subjectId: payload.subjectId !== undefined ? asBigInt(payload.subjectId) : undefined,
      studyPlanId: payload.studyPlanId !== undefined ? asBigInt(payload.studyPlanId) : undefined,
      title: payload.title,
      content: payload.content,
      isShared: payload.isShared,
      orderIndex: payload.orderIndex !== undefined ? Math.trunc(payload.orderIndex) : undefined,
    }).where(eq(lessons.id, lessonId)).returning(lessonSelect)

    res.json({
      id: Number(updated.id),
      subjectId: asNumberId(updated.subjectId),
      studyPlanId: asNumberId(updated.studyPlanId),
      title: updated.title,
      content: updated.content,
      isShared: updated.isShared,
      orderIndex: updated.orderIndex,
      deletedAt: updated.deletedAt,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

lessonsRouter.delete('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const lessonId = asBigInt(req.params.id)
    if (!lessonId) {
      res.status(400).json({ error: 'Neplatne ID lekce.' })
      return
    }

    const existing = await db.select({ id: lessons.id, deletedAt: lessons.deletedAt }).from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    if (!existing.length || existing[0].deletedAt) {
      res.status(404).json({ error: 'Lekce nebyla nalezena.' })
      return
    }

    const canDeleteLesson = await canActorManageLesson(actor, lessonId)
    if (!canDeleteLesson) {
      res.status(403).json({ error: 'Nemate opravneni smazat tuto lekci.' })
      return
    }

    await db.update(lessons).set({ deletedAt: new Date() }).where(eq(lessons.id, lessonId))
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

lessonsRouter.get('/:id/notes', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const lessonId = asBigInt(req.params.id)
    if (!lessonId) {
      res.status(400).json({ error: 'Neplatne ID lekce.' })
      return
    }

    const [lesson] = await db.select({ id: lessons.id, isShared: lessons.isShared, deletedAt: lessons.deletedAt }).from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    if (!lesson || lesson.deletedAt) {
      res.status(404).json({ error: 'Lekce nebyla nalezena.' })
      return
    }

    if (isPublicActor(actor)) {
      if (!lesson.isShared) {
        res.status(403).json({ error: 'Verejnost vidi jen verejne poznamky.' })
        return
      }

      const publicNotes = await db.select().from(lessonNotes).where(eq(lessonNotes.lessonId, lessonId)).orderBy(desc(lessonNotes.isPinned), asc(lessonNotes.createdAt))
      res.json(publicNotes.map((note) => ({
        id: Number(note.id),
        lessonId: Number(note.lessonId),
        userId: Number(note.userId),
        note: note.note,
        isPinned: note.isPinned,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      })))
      return
    }

    const includeAll = req.query.includeAll === 'true' && actor.role === 'ADMIN'

    const notes = await db.select().from(lessonNotes).where(
      includeAll ? eq(lessonNotes.lessonId, lessonId) : and(eq(lessonNotes.lessonId, lessonId), eq(lessonNotes.userId, BigInt(actor.id))),
    ).orderBy(desc(lessonNotes.isPinned), asc(lessonNotes.createdAt))

    res.json(notes.map((note) => ({
      id: Number(note.id),
      lessonId: Number(note.lessonId),
      userId: Number(note.userId),
      note: note.note,
      isPinned: note.isPinned,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    })))
  } catch (error) {
    next(error)
  }
})

lessonsRouter.post('/:id/notes', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const lessonId = asBigInt(req.params.id)
    if (!lessonId) {
      res.status(400).json({ error: 'Neplatne ID lekce.' })
      return
    }

    const [lesson] = await db.select({ id: lessons.id, deletedAt: lessons.deletedAt }).from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    if (!lesson || lesson.deletedAt) {
      res.status(404).json({ error: 'Lekce nebyla nalezena.' })
      return
    }

    const parsed = lessonNoteSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const payload = parsed.data

    const [created] = await db.insert(lessonNotes).values({
      lessonId,
      userId: BigInt(actor.id),
      note: payload.note,
      isPinned: payload.isPinned,
    }).returning()

    res.status(201).json({
      id: Number(created.id),
      lessonId: Number(created.lessonId),
      userId: Number(created.userId),
      note: created.note,
      isPinned: created.isPinned,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

lessonNotesRouter.patch('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const noteId = asBigInt(req.params.id)
    if (!noteId) {
      res.status(400).json({ error: 'Neplatne ID poznamky.' })
      return
    }

    const existing = await db.select({ id: lessonNotes.id, userId: lessonNotes.userId }).from(lessonNotes).where(eq(lessonNotes.id, noteId)).limit(1)
    if (!existing.length) {
      res.status(404).json({ error: 'Poznamka nebyla nalezena.' })
      return
    }

    if (existing[0].userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni upravit tuto poznamku.' })
      return
    }

    const parsed = updateLessonNoteSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const payload = parsed.data

    const [updated] = await db.update(lessonNotes).set({
      note: payload.note,
      isPinned: payload.isPinned,
    }).where(eq(lessonNotes.id, noteId)).returning()

    res.json({
      id: Number(updated.id),
      lessonId: Number(updated.lessonId),
      userId: Number(updated.userId),
      note: updated.note,
      isPinned: updated.isPinned,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

lessonNotesRouter.delete('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const noteId = asBigInt(req.params.id)
    if (!noteId) {
      res.status(400).json({ error: 'Neplatne ID poznamky.' })
      return
    }

    const existing = await db.select({ id: lessonNotes.id, userId: lessonNotes.userId }).from(lessonNotes).where(eq(lessonNotes.id, noteId)).limit(1)
    if (!existing.length) {
      res.status(404).json({ error: 'Poznamka nebyla nalezena.' })
      return
    }

    if (existing[0].userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni smazat tuto poznamku.' })
      return
    }

    await db.delete(lessonNotes).where(eq(lessonNotes.id, noteId))
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

annotationsRouter.get('/', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const targetType = parseAnnotationTargetType(req.query.targetType)
    const targetId = asBigInt(req.query.targetId)

    if (!targetType || !targetId) {
      res.status(400).json({ error: 'Pole targetType a targetId jsou povinna.' })
      return
    }

    const canRead = await canActorReadAnnotationTarget(targetType, targetId, actor)
    if (!canRead) {
      res.status(403).json({ error: 'Nemate opravneni zobrazit anotace tohoto obsahu.' })
      return
    }

    const annotations = await db.select().from(textAnnotations).where(and(eq(textAnnotations.targetType, targetType), eq(textAnnotations.targetId, targetId))).orderBy(asc(textAnnotations.createdAt))

    res.json(annotations.map((annotation) => ({
      id: Number(annotation.id),
      targetType: annotation.targetType,
      targetId: Number(annotation.targetId),
      userId: Number(annotation.userId),
      startOffset: annotation.startOffset,
      endOffset: annotation.endOffset,
      selectedText: annotation.selectedText,
      comment: annotation.comment,
      createdAt: annotation.createdAt.toISOString(),
      updatedAt: annotation.updatedAt.toISOString(),
    })))
  } catch (error) {
    next(error)
  }
})

annotationsRouter.post('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const parsed = textAnnotationSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const payload = parsed.data

    const targetType = parseAnnotationTargetType(payload.targetType)
    const targetId = asBigInt(payload.targetId)

    if (!targetType || !targetId) {
      res.status(400).json({ error: 'Pole targetType a targetId jsou povinna.' })
      return
    }

    if (payload.endOffset < payload.startOffset) {
      res.status(400).json({ error: 'Neplatny interval oznaceni textu.' })
      return
    }

    const canRead = await canActorReadAnnotationTarget(targetType, targetId, actor)
    if (!canRead) {
      res.status(403).json({ error: 'Nemate opravneni komentovat tento obsah.' })
      return
    }

    const [created] = await db.insert(textAnnotations).values({
      targetType,
      targetId,
      userId: BigInt(actor.id),
      startOffset: Math.trunc(payload.startOffset),
      endOffset: Math.trunc(payload.endOffset),
      selectedText: payload.selectedText.trim(),
      comment: payload.comment.trim(),
    }).returning()

    res.status(201).json({
      id: Number(created.id),
      targetType: created.targetType,
      targetId: Number(created.targetId),
      userId: Number(created.userId),
      startOffset: created.startOffset,
      endOffset: created.endOffset,
      selectedText: created.selectedText,
      comment: created.comment,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

annotationsRouter.delete('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const annotationId = asBigInt(req.params.id)
    if (!annotationId) {
      res.status(400).json({ error: 'Neplatne ID anotace.' })
      return
    }

    const annotation = await db.select({ id: textAnnotations.id, userId: textAnnotations.userId }).from(textAnnotations).where(eq(textAnnotations.id, annotationId)).limit(1)
    if (!annotation.length) {
      res.status(404).json({ error: 'Anotace nebyla nalezena.' })
      return
    }

    if (annotation[0].userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni smazat tuto anotaci.' })
      return
    }

    await db.delete(textAnnotations).where(eq(textAnnotations.id, annotationId))
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})