import express from 'express'
import { usersService } from './users.services'
import { profileSchema, updateProfileSchema } from '../../schemas'
import { requireRegisteredActor, requireAdmin } from '../../auth'
import { asyncHandler, AppError } from '../../middleware/error-handler'
import { asBigInt } from '../../utils'

export const usersRouter: express.Router = express.Router()

usersRouter.get('/users', asyncHandler(async (req, res) => {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const result = await usersService.getAllUsers()
  res.json(result)
}))

usersRouter.get('/profile', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const result = await usersService.getProfile(actor.id)
  res.json(result)
}))

usersRouter.post('/profile', asyncHandler(async (req, res) => {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const parsed = profileSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await usersService.createProfile(parsed.data)
  res.status(201).json(result)
}))

usersRouter.put('/profile', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const parsed = updateProfileSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await usersService.updateProfile(actor.id, actor.role, parsed.data)
  res.json(result)
}))

usersRouter.delete('/profile', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const result = await usersService.deleteProfile(actor.id)
  res.json(result)
}))

usersRouter.put('/users/:id', asyncHandler(async (req, res) => {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const userId = asBigInt(req.params.id)
  if (!userId) throw new AppError('Neplatne ID uzivatele.', 400)

  const result = await usersService.adminUpdateUser(userId, req.body)
  res.json(result)
}))

usersRouter.delete('/users/:id', asyncHandler(async (req, res) => {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const userId = asBigInt(req.params.id)
  if (!userId) throw new AppError('Neplatne ID uzivatele.', 400)

  const result = await usersService.adminDeleteUser(userId)
  res.json(result)
}))
