import express from 'express'
import { subjectsService } from './subjects.services'
import { subjectSchema, updateSubjectSchema } from '../../schemas'
import { asBigInt, parseCursorPagination } from '../../utils'
import { getActorFromRequest, requireRegisteredActor } from '../../auth'
import { asyncHandler, AppError } from '../../middleware/error-handler'

export const subjectsRouter: express.Router = express.Router()

subjectsRouter.get('/', asyncHandler(async (req, res) => {
  const actor = await getActorFromRequest(req)
  const pagination = parseCursorPagination(req, { defaultLimit: 20, maxLimit: 100 })
  
  const filters = {
    pagination,
    includeDeleted: req.query.includeDeleted === 'true',
    studyPlanId: asBigInt(req.query.studyPlanId),
  }

  const result = await subjectsService.getSubjects(actor, filters)
  res.json(result)
}))

subjectsRouter.post('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const parsed = subjectSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await subjectsService.createSubject(actor, parsed.data)
  res.status(201).json(result)
}))

subjectsRouter.put('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const subjectId = asBigInt(req.params.id)
  if (!subjectId) throw new AppError('Neplatne ID predmetu.', 400)

  const parsed = updateSubjectSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await subjectsService.updateSubject(subjectId, actor, parsed.data)
  res.json(result)
}))

subjectsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const subjectId = asBigInt(req.params.id)
  if (!subjectId) throw new AppError('Neplatne ID predmetu.', 400)

  const result = await subjectsService.deleteSubject(subjectId, actor)
  res.json(result)
}))
