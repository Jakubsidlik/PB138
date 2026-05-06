import express from 'express'
import { prisma } from './prisma.js'
import { lessonSchema, updateLessonSchema, lessonNoteSchema, updateLessonNoteSchema, textAnnotationSchema } from './schemas.js'
import { asBigInt, asNumberId, parseAnnotationTargetType } from './utils.js'
import { getActorFromRequest, isPublicActor, requireRegisteredActor, canActorReadAnnotationTarget } from './auth.js'

export const lessonsRouter = express.Router()
export const lessonNotesRouter = express.Router()
export const annotationsRouter = express.Router()

lessonsRouter.get('/', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const subjectId = asBigInt(req.query.subjectId)
    const studyPlanId = asBigInt(req.query.studyPlanId)
    const includeDeleted = req.query.includeDeleted === 'true'

    const lessons = await prisma.lesson.findMany({
      where: isPublicActor(actor)
        ? {
            subjectId: subjectId ?? undefined,
            studyPlanId: studyPlanId ?? undefined,
            isShared: true,
            deletedAt: includeDeleted ? undefined : null,
          }
        : {
            subjectId: subjectId ?? undefined,
            studyPlanId: studyPlanId ?? undefined,
            deletedAt: includeDeleted ? undefined : null,
            OR: [
              { isShared: true },
              { subject: { userId: BigInt(actor.id) } },
              { studyPlan: { userId: BigInt(actor.id) } },
              { studyPlan: { collaborators: { some: { userId: BigInt(actor.id) } } } },
            ],
          },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: {
            notes: true,
            files: true,
          },
        },
      },
    })

    res.json(
      lessons.map((lesson) => ({
        id: Number(lesson.id),
        subjectId: asNumberId(lesson.subjectId),
        studyPlanId: asNumberId(lesson.studyPlanId),
        title: lesson.title,
        content: lesson.content,
        isShared: lesson.isShared,
        orderIndex: lesson.orderIndex,
        notesCount: lesson._count.notes,
        filesCount: lesson._count.files,
        deletedAt: lesson.deletedAt ? lesson.deletedAt.toISOString() : null,
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString(),
      })),
    )
  } catch (error) {
    next(error)
  }
})

lessonsRouter.post('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const parsed = lessonSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const payload = parsed.data

    const created = await prisma.lesson.create({
      data: {
        subjectId: asBigInt(payload.subjectId),
        studyPlanId: asBigInt(payload.studyPlanId),
        title: payload.title,
        content: payload.content ?? null,
        isShared: payload.isShared,
        orderIndex: Math.trunc(payload.orderIndex),
      },
    })

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
    if (!actor) {
      return
    }

    const lessonId = asBigInt(req.params.id)
    if (!lessonId) {
      res.status(400).json({ error: 'Neplatne ID lekce.' })
      return
    }

    const existing = await prisma.lesson.findUnique({ where: { id: lessonId } })
    if (!existing) {
      res.status(404).json({ error: 'Lekce nebyla nalezena.' })
      return
    }

    const ownsStudyPlan =
      existing.studyPlanId !== null
        ? (await prisma.studyPlan.findFirst({ where: { id: existing.studyPlanId, userId: BigInt(actor.id) } })) !==
          null
        : false

    const ownsSubject =
      existing.subjectId !== null
        ? (await prisma.subject.findFirst({ where: { id: existing.subjectId, userId: BigInt(actor.id) } })) !== null
        : false

    const canEditLesson = actor.role === 'ADMIN' || ownsStudyPlan || ownsSubject

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

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        subjectId: payload.subjectId !== undefined ? asBigInt(payload.subjectId) : undefined,
        studyPlanId: payload.studyPlanId !== undefined ? asBigInt(payload.studyPlanId) : undefined,
        title: payload.title,
        content: payload.content,
        isShared: payload.isShared,
        orderIndex: payload.orderIndex !== undefined ? Math.trunc(payload.orderIndex) : undefined,
      },
    })

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
    if (!actor) {
      return
    }

    const lessonId = asBigInt(req.params.id)
    if (!lessonId) {
      res.status(400).json({ error: 'Neplatne ID lekce.' })
      return
    }

    const existing = await prisma.lesson.findUnique({ where: { id: lessonId } })
    if (!existing || existing.deletedAt) {
      res.status(404).json({ error: 'Lekce nebyla nalezena.' })
      return
    }

    const ownsStudyPlan =
      existing.studyPlanId !== null
        ? (await prisma.studyPlan.findFirst({ where: { id: existing.studyPlanId, userId: BigInt(actor.id) } })) !==
          null
        : false

    const ownsSubject =
      existing.subjectId !== null
        ? (await prisma.subject.findFirst({ where: { id: existing.subjectId, userId: BigInt(actor.id) } })) !== null
        : false

    const canDeleteLesson = actor.role === 'ADMIN' || ownsStudyPlan || ownsSubject

    if (!canDeleteLesson) {
      res.status(403).json({ error: 'Nemate opravneni smazat tuto lekci.' })
      return
    }

    await prisma.lesson.update({
      where: { id: lessonId },
      data: { deletedAt: new Date() },
    })

    res.status(204).end()
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

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
    if (!lesson || lesson.deletedAt) {
      res.status(404).json({ error: 'Lekce nebyla nalezena.' })
      return
    }

    if (isPublicActor(actor)) {
      if (!lesson.isShared) {
        res.status(403).json({ error: 'Verejnost vidi jen verejne poznamky.' })
        return
      }

      const publicNotes = await prisma.lessonNote.findMany({
        where: { lessonId },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
      })

      res.json(
        publicNotes.map((note) => ({
          id: Number(note.id),
          lessonId: Number(note.lessonId),
          userId: Number(note.userId),
          note: note.note,
          isPinned: note.isPinned,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        })),
      )
      return
    }

    const includeAll = req.query.includeAll === 'true' && actor.role === 'ADMIN'

    const notes = await prisma.lessonNote.findMany({
      where: {
        lessonId,
        userId: includeAll ? undefined : BigInt(actor.id),
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
    })

    res.json(
      notes.map((note) => ({
        id: Number(note.id),
        lessonId: Number(note.lessonId),
        userId: Number(note.userId),
        note: note.note,
        isPinned: note.isPinned,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      })),
    )
  } catch (error) {
    next(error)
  }
})

lessonsRouter.post('/:id/notes', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const lessonId = asBigInt(req.params.id)
    if (!lessonId) {
      res.status(400).json({ error: 'Neplatne ID lekce.' })
      return
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
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

    const created = await prisma.lessonNote.create({
      data: {
        lessonId,
        userId: BigInt(actor.id),
        note: payload.note,
        isPinned: payload.isPinned,
      },
    })

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
    if (!actor) {
      return
    }

    const noteId = asBigInt(req.params.id)
    if (!noteId) {
      res.status(400).json({ error: 'Neplatne ID poznamky.' })
      return
    }

    const existing = await prisma.lessonNote.findUnique({ where: { id: noteId } })
    if (!existing) {
      res.status(404).json({ error: 'Poznamka nebyla nalezena.' })
      return
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni upravit tuto poznamku.' })
      return
    }

    const parsed = updateLessonNoteSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const payload = parsed.data

    const updated = await prisma.lessonNote.update({
      where: { id: noteId },
      data: {
        note: payload.note,
        isPinned: payload.isPinned,
      },
    })

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
    if (!actor) {
      return
    }

    const noteId = asBigInt(req.params.id)
    if (!noteId) {
      res.status(400).json({ error: 'Neplatne ID poznamky.' })
      return
    }

    const existing = await prisma.lessonNote.findUnique({ where: { id: noteId } })
    if (!existing) {
      res.status(404).json({ error: 'Poznamka nebyla nalezena.' })
      return
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni smazat tuto poznamku.' })
      return
    }

    await prisma.lessonNote.delete({ where: { id: noteId } })

    res.status(204).end()
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

    const annotations = await prisma.textAnnotation.findMany({
      where: {
        targetType,
        targetId,
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json(
      annotations.map((annotation) => ({
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
      })),
    )
  } catch (error) {
    next(error)
  }
})

annotationsRouter.post('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

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

    const created = await prisma.textAnnotation.create({
      data: {
        targetType,
        targetId,
        userId: BigInt(actor.id),
        startOffset: Math.trunc(payload.startOffset),
        endOffset: Math.trunc(payload.endOffset),
        selectedText: payload.selectedText.trim(),
        comment: payload.comment.trim(),
      },
    })

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
    if (!actor) {
      return
    }

    const annotationId = asBigInt(req.params.id)
    if (!annotationId) {
      res.status(400).json({ error: 'Neplatne ID anotace.' })
      return
    }

    const annotation = await prisma.textAnnotation.findUnique({ where: { id: annotationId } })
    if (!annotation) {
      res.status(404).json({ error: 'Anotace nebyla nalezena.' })
      return
    }

    if (annotation.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni smazat tuto anotaci.' })
      return
    }

    await prisma.textAnnotation.delete({ where: { id: annotationId } })
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})