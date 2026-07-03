import express from 'express'
import { commentsServices } from './comments.services'
import { commentSchema } from '../../schemas'
import { asBigInt } from '../../utils'
import { requireRegisteredActor } from '../../auth'
import { asyncHandler, AppError } from '../../middleware/error-handler'

export const commentsRouter: express.Router = express.Router({ mergeParams: true })

commentsRouter.get('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  const imageId = asBigInt(req.params.imageId)

  if (!groupId || !imageId) throw new AppError('Neplatné parametry.', 400)

  const comments = await commentsServices.getComments(groupId, imageId, actor)
  res.json(comments)
}))

commentsRouter.post('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  const imageId = asBigInt(req.params.imageId)

  if (!groupId || !imageId) throw new AppError('Neplatné parametry.', 400)

  const parsed = commentSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const comment = await commentsServices.addComment(groupId, imageId, actor, parsed.data.content)
  res.status(201).json(comment)
}))

commentsRouter.delete('/:commentId', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  const imageId = asBigInt(req.params.imageId)
  const commentId = asBigInt(req.params.commentId)

  if (!groupId || !imageId || !commentId) throw new AppError('Neplatné parametry.', 400)

  const result = await commentsServices.deleteComment(groupId, imageId, commentId, actor)
  res.json(result)
}))
