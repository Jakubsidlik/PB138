import express from 'express'
import { usersService } from './users.services.js'
import { profileSchema, updateProfileSchema } from '../../schemas.js'
import { requireRegisteredActor, requireAdmin } from '../../auth.js'
import { asyncHandler, AppError } from '../../middleware/error-handler.js'

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
