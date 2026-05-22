import express from 'express'
import { tagsService } from './tags.services.js'
import { requireRegisteredActor } from '../../auth.js'
import { asyncHandler, AppError } from '../../middleware/error-handler.js'
import { validate } from '../../middleware/validate.js'
import { tagSchema } from '../../schemas.js'
import { asBigInt } from '../../utils.js'

export const tagsRouter = express.Router()

tagsRouter.get('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const result = await tagsService.getTags(actor.id)
  res.json(result)
}))

tagsRouter.post('/', validate(tagSchema), asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const created = await tagsService.createTag(actor.id, req.body)
  res.status(201).json(created)
}))

tagsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const tagId = asBigInt(req.params.id)
  if (!tagId) throw new AppError('Neplatne ID tagu.', 400)

  const result = await tagsService.deleteTag(Number(tagId), actor.id)
  res.json(result)
}))
