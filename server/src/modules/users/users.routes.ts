import express from 'express'
import { usersService } from './users.services'
import { profileSchema, updateProfileSchema } from '../../schemas'
import { requireRegisteredActor, requireAdmin } from '../../auth'
import { asyncHandler, AppError } from '../../middleware/error-handler'
import { asBigInt } from '../../utils'
import { Resend } from 'resend'
import { env } from '../../env'

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

usersRouter.post('/invite', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const { email, itemName, itemType } = req.body
  if (!email || typeof email !== 'string') {
    throw new AppError('E-mail je povinný.', 400)
  }

  if (env.RESEND_API_KEY) {
    const resend = new Resend(env.RESEND_API_KEY)
    const registerUrl = 'http://localhost:5173/login?mode=register'
    
    let typeName = 'studijní plán'
    if (itemType === 'subject') typeName = 'předmět'
    if (itemType === 'file') typeName = 'soubor'
    
    await resend.emails.send({
      from: 'Planner <onboarding@resend.dev>',
      to: email,
      subject: `Pozvánka do aplikace Planner`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #3b82f6;">Pozvánka do aplikace Planner!</h2>
          <p>Ahoj,</p>
          <p>Uživatel <strong>${actor.fullName || actor.email}</strong> s tebou chce sdílet ${typeName} <strong>${itemName || ''}</strong> v aplikaci Planner.</p>
          <p>Tento e-mail k dané adrese nemá založený účet. Pro zobrazení sdíleného obsahu se prosím nejprve zaregistruj.</p>
          <div style="margin: 30px 0;">
            <a href="${registerUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Zaregistrovat se</a>
          </div>
          <p style="color: #666; font-size: 14px;">Tento e-mail byl automaticky vygenerován aplikací Planner.</p>
        </div>
      `
    })
  } else {
    console.log(`RESEND_API_KEY is not defined. Email would be sent to: ${email}`)
  }

  res.json({ success: true })
}))

