import express from 'express'
import { ratingsServices } from './ratings.services'
import { rateImageSchema } from '../../schemas'
import { asBigInt } from '../../utils'
import { requireRegisteredActor } from '../../auth'
import { asyncHandler, AppError } from '../../middleware/error-handler'

export const ratingsRouter: express.Router = express.Router({ mergeParams: true })

ratingsRouter.post('/images/:imageId/rate', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  const imageId = asBigInt(req.params.imageId)

  if (!groupId || !imageId) throw new AppError('Neplatné parametry.', 400)

  const parsed = rateImageSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const rating = await ratingsServices.rateImage(groupId, imageId, actor, parsed.data.tier)
  res.json(rating)
}))

ratingsRouter.get('/result', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  if (!groupId) throw new AppError('Neplatné parametry.', 400)

  const result = await ratingsServices.getGroupResult(groupId, actor)
  res.json(result)
}))

ratingsRouter.get('/my-ratings', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  if (!groupId) throw new AppError('Neplatné parametry.', 400)

  const result = await ratingsServices.getMyRatings(groupId, actor)
  res.json(result)
}))
