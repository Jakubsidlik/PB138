import express from 'express'
import { studyPlansService } from './study-plans.services.js'
import { shareStudyPlanSchema, studyPlanSchema, updateStudyPlanSchema } from '../../schemas.js'
import { asBigInt } from '../../utils.js'
import { getActorFromRequest, requireRegisteredActor } from '../../auth.js'
import { asyncHandler, AppError } from '../../middleware/error-handler.js'

export const studyPlansRouter: express.Router = express.Router()

studyPlansRouter.get('/', asyncHandler(async (req, res) => {
  const actor = await getActorFromRequest(req)
  const includeInactive = req.query.includeInactive === 'true'

  const result = await studyPlansService.getStudyPlans(actor, { includeInactive })
  res.json(result)
}))

studyPlansRouter.post('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const parsed = studyPlanSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await studyPlansService.createStudyPlan(actor.id, parsed.data)
  res.status(201).json(result)
}))

studyPlansRouter.patch('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const studyPlanId = asBigInt(req.params.id)
  if (!studyPlanId) throw new AppError('Neplatne ID studijniho planu.', 400)

  const parsed = updateStudyPlanSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await studyPlansService.updateStudyPlan(studyPlanId, actor, parsed.data)
  res.json(result)
}))

studyPlansRouter.delete('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const studyPlanId = asBigInt(req.params.id)
  if (!studyPlanId) throw new AppError('Neplatne ID studijniho planu.', 400)

  const result = await studyPlansService.deleteStudyPlan(studyPlanId, actor)
  res.json(result)
}))

studyPlansRouter.get('/:id/collaborators', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const studyPlanId = asBigInt(req.params.id)
  if (!studyPlanId) throw new AppError('Neplatne ID studijniho planu.', 400)

  const result = await studyPlansService.getCollaborators(studyPlanId, actor)
  res.json(result)
}))

studyPlansRouter.post('/:id/share', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const studyPlanId = asBigInt(req.params.id)
  if (!studyPlanId) throw new AppError('Neplatne ID studijniho planu.', 400)

  const parsed = shareStudyPlanSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await studyPlansService.shareStudyPlan(studyPlanId, actor, parsed.data)
  res.status(201).json(result)
}))

studyPlansRouter.delete('/:id/share/:userId', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const studyPlanId = asBigInt(req.params.id)
  const userId = asBigInt(req.params.userId)
  if (!studyPlanId || !userId) throw new AppError('Neplatne ID studijniho planu nebo uzivatele.', 400)

  const result = await studyPlansService.unshareStudyPlan(studyPlanId, userId, actor)
  res.json(result)
}))
