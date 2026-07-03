import express from 'express'
import { imagesService } from './images.services'
import { imageSchema, setTierSchema, uploadUrlSchema } from '../../schemas'
import { asBigInt } from '../../utils'
import { requireRegisteredActor } from '../../auth'
import { asyncHandler, AppError } from '../../middleware/error-handler'
import { type Tier } from '../../db/schema'

export const imagesRouter: express.Router = express.Router()

// GET /api/groups/:id/images — images in group (optionally filtered by tier)
imagesRouter.get('/:id/images', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  if (!groupId) throw new AppError('Neplatné ID skupiny.', 400)

  const tier = req.query.tier as Tier | undefined
  const result = await imagesService.getImages(groupId, actor, tier)
  res.json(result)
}))

// GET /api/groups/:id/images/unrated — unrated images
imagesRouter.get('/:id/images/unrated', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  if (!groupId) throw new AppError('Neplatné ID skupiny.', 400)

  const result = await imagesService.getUnrated(groupId, actor)
  res.json(result)
}))

// GET /api/groups/:id/images/counts — tier counts
imagesRouter.get('/:id/images/counts', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  if (!groupId) throw new AppError('Neplatné ID skupiny.', 400)

  const result = await imagesService.getTierCounts(groupId, actor)
  res.json(result)
}))

// POST /api/groups/:id/images/upload-url — presigned upload URL
imagesRouter.post('/:id/images/upload-url', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const parsed = uploadUrlSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await imagesService.getUploadUrl(actor, parsed.data)
  res.json(result)
}))

// POST /api/groups/:id/images — create image record
imagesRouter.post('/:id/images', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  if (!groupId) throw new AppError('Neplatné ID skupiny.', 400)

  const parsed = imageSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await imagesService.createImage(groupId, actor, parsed.data)
  res.status(201).json(result)
}))

// PATCH /api/groups/:id/images/:imageId/tier — assign tier
imagesRouter.patch('/:id/images/:imageId/tier', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  const imageId = asBigInt(req.params.imageId)
  if (!groupId || !imageId) throw new AppError('Neplatné parametry.', 400)

  const parsed = setTierSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await imagesService.setTier(groupId, imageId, actor, parsed.data.tier)
  res.json(result)
}))

// DELETE /api/groups/:id/images/:imageId — delete image
imagesRouter.delete('/:id/images/:imageId', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  const imageId = asBigInt(req.params.imageId)
  if (!groupId || !imageId) throw new AppError('Neplatné parametry.', 400)

  await imagesService.deleteImage(groupId, imageId, actor)
  res.json({ success: true })
}))
