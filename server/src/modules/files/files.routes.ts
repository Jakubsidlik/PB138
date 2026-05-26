import express from 'express'
import { filesService } from './files.services'
import { fileSchema, updateFileSchema, uploadUrlSchema, shareFileSchema } from '../../schemas'
import { asBigInt, parseCursorPagination } from '../../utils'
import { getActorFromRequest, requireAdmin, requireRegisteredActor } from '../../auth'
import { asyncHandler, AppError } from '../../middleware/error-handler'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { env } from '../../env'

export const filesRouter: express.Router = express.Router()
export const adminFilesRouter: express.Router = express.Router()

filesRouter.get('/', asyncHandler(async (req, res) => {
  const actor = await getActorFromRequest(req)
  const pagination = parseCursorPagination(req, { defaultLimit: 25, maxLimit: 100 })
  
  const filters = {
    pagination,
    subjectId: asBigInt(req.query.subjectId),
    shared: req.query.shared as string | undefined,
    includeDeleted: req.query.includeDeleted === 'true',
  }

  const result = await filesService.getFiles(actor, filters)
  res.json(result)
}))

filesRouter.get('/public', asyncHandler(async (_req, res) => {
  const result = await filesService.getPublicFiles()
  res.json(result)
}))

filesRouter.post('/upload-url', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const parsed = uploadUrlSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await filesService.getUploadUrl(actor.id, parsed.data)
  res.json(result)
}))

filesRouter.put('/local-upload/:key', asyncHandler(async (req, res) => {
  const fileKey = req.params.key
  const uploadDir = path.join(process.cwd(), 'uploads')
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const uploadPath = path.join(uploadDir, fileKey)
  const writeStream = fs.createWriteStream(uploadPath)
  await pipeline(req, writeStream)
  
  res.status(200).json({ success: true })
}))

filesRouter.get('/local-upload/:key', (req, res) => {
  const fileKey = req.params.key
  const filePath = path.join(process.cwd(), 'uploads', fileKey)
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath)
  } else {
    res.status(404).send('Soubor nenalezen')
  }
})

filesRouter.post('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const parsed = fileSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await filesService.createFile(actor.id, parsed.data)
  res.status(201).json(result)
}))

filesRouter.put('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const fileId = asBigInt(req.params.id)
  if (!fileId) throw new AppError('Neplatne ID souboru.', 400)

  const parsed = updateFileSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await filesService.updateFile(fileId, actor, parsed.data)
  res.json(result)
}))

filesRouter.delete('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const fileId = asBigInt(req.params.id)
  if (!fileId) throw new AppError('Neplatne ID souboru.', 400)

  const result = await filesService.deleteFile(fileId, actor)
  res.json(result)
}))

filesRouter.post('/:id/share', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const fileId = asBigInt(req.params.id)
  if (!fileId) throw new AppError('Neplatne ID souboru.', 400)

  const parsed = shareFileSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await filesService.shareFile(fileId, actor, parsed.data)
  res.status(201).json(result)
}))

filesRouter.delete('/:id/shares/:userId', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const fileId = asBigInt(req.params.id)
  const targetUserId = asBigInt(req.params.userId)
  if (!fileId || !targetUserId) throw new AppError('Neplatné parametry.', 400)

  const result = await filesService.unshareFile(fileId, targetUserId, actor)
  res.json(result)
}))

import { z } from 'zod'
const voteSchema = z.object({ vote: z.enum(['LIKE', 'DISLIKE']).nullable() })

filesRouter.post('/:id/vote', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const fileId = asBigInt(req.params.id)
  if (!fileId) throw new AppError('Neplatné ID souboru.', 400)

  const parsed = voteSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError('Neplatný hlas.', 400)
  }

  const result = await filesService.setFileVote(fileId, actor, parsed.data.vote)
  res.json(result)
}))

filesRouter.get('/:id/download', asyncHandler(async (req, res) => {
  const fileId = asBigInt(req.params.id)
  if (!fileId) throw new AppError('Neplatné ID souboru.', 400)

  const file = await filesService.getFileForDownload(fileId)
  if (!file) throw new AppError('Soubor nebyl nalezen.', 404)

  if (file.fileKey && env.S3_ACCESS_KEY && env.S3_SECRET_KEY) {
    const signedUrl = await filesService.getPresignedDownloadUrl(file.fileKey, file.name)
    res.redirect(signedUrl)
  } else {
    const fileKey = file.fileKey || file.fileUrl?.split('/').pop() || ''
    const filePath = path.join(process.cwd(), 'uploads', fileKey)
    if (fs.existsSync(filePath)) {
      res.download(filePath, file.name)
    } else if (file.fileUrl) {
      res.redirect(file.fileUrl)
    } else {
      res.status(404).send('Soubor nenalezen')
    }
  }
}))

adminFilesRouter.get('/', asyncHandler(async (req, res) => {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const includeDeleted = req.query.includeDeleted === 'true'
  const result = await filesService.getAdminFiles(includeDeleted)
  res.json(result)
}))

