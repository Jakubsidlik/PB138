import express from 'express'
import { lessonsService } from './lessons.services.js'
import { lessonNoteSchema, lessonSchema, textAnnotationSchema, updateLessonNoteSchema, updateLessonSchema } from '../../schemas.js'
import { asBigInt, parseAnnotationTargetType } from '../../utils.js'
import { getActorFromRequest, requireRegisteredActor, canActorReadAnnotationTarget } from '../../auth.js'
import { asyncHandler, AppError } from '../../middleware/error-handler.js'

export const lessonsRouter: express.Router = express.Router()
export const lessonNotesRouter: express.Router = express.Router()
export const annotationsRouter: express.Router = express.Router()

// lessonsRouter
lessonsRouter.get('/', asyncHandler(async (req, res) => {
  const actor = await getActorFromRequest(req)
  const filters = {
    subjectId: asBigInt(req.query.subjectId),
    studyPlanId: asBigInt(req.query.studyPlanId),
    includeDeleted: req.query.includeDeleted === 'true',
  }

  const result = await lessonsService.getLessons(actor, filters)
  res.json(result)
}))

lessonsRouter.post('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const parsed = lessonSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await lessonsService.createLesson(actor.id, parsed.data)
  res.status(201).json(result)
}))

lessonsRouter.patch('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const lessonId = asBigInt(req.params.id)
  if (!lessonId) throw new AppError('Neplatne ID lekce.', 400)

  const parsed = updateLessonSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await lessonsService.updateLesson(lessonId, actor, parsed.data)
  res.json(result)
}))

lessonsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const lessonId = asBigInt(req.params.id)
  if (!lessonId) throw new AppError('Neplatne ID lekce.', 400)

  const result = await lessonsService.deleteLesson(lessonId, actor)
  res.json(result)
}))

lessonsRouter.get('/:id/notes', asyncHandler(async (req, res) => {
  const actor = await getActorFromRequest(req)
  const lessonId = asBigInt(req.params.id)
  if (!lessonId) throw new AppError('Neplatne ID lekce.', 400)

  const filters = {
    includeAll: req.query.includeAll === 'true' && actor.role === 'ADMIN',
  }

  const result = await lessonsService.getNotes(lessonId, actor, filters)
  res.json(result)
}))

lessonsRouter.post('/:id/notes', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const lessonId = asBigInt(req.params.id)
  if (!lessonId) throw new AppError('Neplatne ID lekce.', 400)

  const parsed = lessonNoteSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await lessonsService.createNote(lessonId, actor.id, parsed.data)
  res.status(201).json(result)
}))

// lessonNotesRouter
lessonNotesRouter.patch('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const noteId = asBigInt(req.params.id)
  if (!noteId) throw new AppError('Neplatne ID poznamky.', 400)

  const parsed = updateLessonNoteSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await lessonsService.updateNote(noteId, actor.id, actor.role, parsed.data)
  res.json(result)
}))

lessonNotesRouter.delete('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const noteId = asBigInt(req.params.id)
  if (!noteId) throw new AppError('Neplatne ID poznamky.', 400)

  const result = await lessonsService.deleteNote(noteId, actor.id, actor.role)
  res.json(result)
}))

// annotationsRouter
annotationsRouter.get('/', asyncHandler(async (req, res) => {
  const actor = await getActorFromRequest(req)
  const targetType = parseAnnotationTargetType(req.query.targetType)
  const targetId = asBigInt(req.query.targetId)

  if (!targetType || !targetId) {
    throw new AppError('Pole targetType a targetId jsou povinna.', 400)
  }

  const canRead = await canActorReadAnnotationTarget(targetType, targetId, actor)
  if (!canRead) {
    throw new AppError('Nemate opravneni zobrazit anotace tohoto obsahu.', 403)
  }

  const result = await lessonsService.getAnnotations(targetType, targetId)
  res.json(result)
}))

annotationsRouter.post('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const parsed = textAnnotationSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }
  const payload = parsed.data

  const targetType = parseAnnotationTargetType(payload.targetType)
  const targetId = asBigInt(payload.targetId)

  if (!targetType || !targetId) {
    throw new AppError('Pole targetType a targetId jsou povinna.', 400)
  }

  if (payload.endOffset < payload.startOffset) {
    throw new AppError('Neplatny interval oznaceni textu.', 400)
  }

  const canRead = await canActorReadAnnotationTarget(targetType, targetId, actor)
  if (!canRead) {
    throw new AppError('Nemate opravneni komentovat tento obsah.', 403)
  }

  const result = await lessonsService.createAnnotation(actor.id, payload)
  res.status(201).json(result)
}))

annotationsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const annotationId = asBigInt(req.params.id)
  if (!annotationId) throw new AppError('Neplatne ID anotace.', 400)

  const result = await lessonsService.deleteAnnotation(annotationId, actor.id, actor.role)
  res.json(result)
}))
