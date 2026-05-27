import express from 'express'
import { lessonsService } from './lessons.services'
import { lessonSchema, updateLessonSchema } from '../../schemas'
import { asBigInt } from '../../utils'
import { getActorFromRequest, requireRegisteredActor } from '../../auth'
import { asyncHandler, AppError } from '../../middleware/error-handler'

export const lessonsRouter: express.Router = express.Router()

lessonsRouter.get('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return
  const filters = {
    subjectId: asBigInt(req.query.subjectId),
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

import { z } from 'zod'
const voteSchema = z.object({ vote: z.enum(['LIKE', 'DISLIKE']).nullable() })

lessonsRouter.post('/:id/vote', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const lessonId = asBigInt(req.params.id)
  if (!lessonId) throw new AppError('Neplatne ID lekce.', 400)

  const parsed = voteSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError('Neplatný hlas.', 400)
  }

  const result = await lessonsService.setLessonVote(lessonId, actor, parsed.data.vote)
  res.json(result)
}))
