import express from 'express'
import { groupsService } from './groups.services'
import { groupSchema, updateGroupSchema, inviteSchema } from '../../schemas'
import { asBigInt } from '../../utils'
import { requireRegisteredActor } from '../../auth'
import { asyncHandler, AppError } from '../../middleware/error-handler'

export const groupsRouter: express.Router = express.Router()

// GET /api/groups — list user's groups
groupsRouter.get('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const result = await groupsService.getGroups(actor)
  res.json(result)
}))

// POST /api/groups — create group
groupsRouter.post('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const parsed = groupSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await groupsService.createGroup(actor, parsed.data)
  res.status(201).json(result)
}))

// GET /api/groups/:id — group detail
groupsRouter.get('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  if (!groupId) throw new AppError('Neplatné ID skupiny.', 400)

  const result = await groupsService.getGroupDetail(groupId, actor)
  res.json(result)
}))

// PATCH /api/groups/:id — update group
groupsRouter.patch('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  if (!groupId) throw new AppError('Neplatné ID skupiny.', 400)

  const parsed = updateGroupSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await groupsService.updateGroup(groupId, actor, parsed.data)
  res.json(result)
}))

// DELETE /api/groups/:id — delete group
groupsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  if (!groupId) throw new AppError('Neplatné ID skupiny.', 400)

  await groupsService.deleteGroup(groupId, actor)
  res.json({ success: true })
}))

// GET /api/groups/:id/members — list members
groupsRouter.get('/:id/members', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  if (!groupId) throw new AppError('Neplatné ID skupiny.', 400)

  const result = await groupsService.getMembers(groupId, actor)
  res.json(result)
}))

// POST /api/groups/:id/invite — invite member
groupsRouter.post('/:id/invite', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  if (!groupId) throw new AppError('Neplatné ID skupiny.', 400)

  const parsed = inviteSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await groupsService.inviteMember(groupId, actor, parsed.data)
  res.status(201).json(result)
}))

// DELETE /api/groups/:id/members/:userId — remove member
groupsRouter.delete('/:id/members/:userId', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const groupId = asBigInt(req.params.id)
  const targetUserId = asBigInt(req.params.userId)
  if (!groupId || !targetUserId) throw new AppError('Neplatné parametry.', 400)

  await groupsService.removeMember(groupId, targetUserId, actor)
  res.json({ success: true })
}))
