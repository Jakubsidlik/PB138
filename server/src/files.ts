import express from 'express'
import { Prisma } from '@prisma/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from './prisma.js'
import { env } from './env.js'
import { fileSchema, updateFileSchema, fileCommentSchema, uploadUrlSchema, fileModerationSchema } from './schemas.js'
import { asBigInt, parseCursorPagination, toPaginatedPayload, parseFileSizeToBytes, mapFileRecord } from './utils.js'
import { getActorFromRequest, isPublicActor, requireRegisteredActor, requireAdmin } from './auth.js'

export const filesRouter = express.Router()
export const adminFilesRouter = express.Router()
export const fileCommentsRouter = express.Router()

const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT || undefined,
  forcePathStyle: !!env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
})

const BUCKET_NAME = env.S3_BUCKET_NAME

filesRouter.get('/', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const pagination = parseCursorPagination(req, { defaultLimit: 25, maxLimit: 100 })
    const subjectId = asBigInt(req.query.subjectId)
    const lessonId = asBigInt(req.query.lessonId)
    const shared = req.query.shared
    const includeDeleted = req.query.includeDeleted === 'true'

    const findArgs: Prisma.FileRecordFindManyArgs = {
      orderBy: { createdAt: 'desc' },
      where: isPublicActor(actor)
        ? {
            subjectId: subjectId ?? undefined,
            lessonId: lessonId ?? undefined,
            isShared: true,
            deletedAt: includeDeleted ? undefined : null,
          }
        : {
            subjectId: subjectId ?? undefined,
            lessonId: lessonId ?? undefined,
            isShared: shared === 'true' ? true : shared === 'false' ? false : undefined,
            deletedAt: includeDeleted ? undefined : null,
            OR: [{ userId: BigInt(actor.id) }, { isShared: true }],
          },
    }

    if (pagination.enabled) {
      findArgs.take = pagination.limit + 1
      findArgs.skip = pagination.cursor ? 1 : 0
      findArgs.cursor = pagination.cursor ? { id: pagination.cursor } : undefined
      findArgs.orderBy = { id: 'asc' }
    }

    const files = await prisma.fileRecord.findMany(findArgs)
    const mappedFiles = files.map(mapFileRecord)

    if (!pagination.enabled) {
      res.json(mappedFiles)
      return
    }

    const paginated = toPaginatedPayload(mappedFiles, pagination.limit)
    res.json({
      ...paginated,
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

filesRouter.get('/public', async (_req, res, next) => {
  try {
    const files = await prisma.fileRecord.findMany({
      where: {
        isShared: true,
        deletedAt: null,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    })

    res.json(files.map(mapFileRecord))
  } catch (error) {
    next(error)
  }
})

adminFilesRouter.get('/', async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res)
    if (!admin) {
      return
    }

    const includeDeleted = req.query.includeDeleted === 'true'
    const files = await prisma.fileRecord.findMany({
      where: {
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    })

    res.json(files.map(mapFileRecord))
  } catch (error) {
    next(error)
  }
})

adminFilesRouter.patch('/:id/moderation', async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res)
    if (!admin) {
      return
    }

    const fileId = asBigInt(req.params.id)
    if (!fileId) {
      res.status(400).json({ error: 'Neplatne ID souboru.' })
      return
    }

    const parsed = fileModerationSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const payload = parsed.data

    const existing = await prisma.fileRecord.findUnique({ where: { id: fileId } })
    if (!existing) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    const updated = await prisma.fileRecord.update({
      where: { id: fileId },
      data: {
        isShared: payload.isShared,
        deletedAt:
          payload.deleted === true
            ? new Date()
            : payload.deleted === false
              ? null
              : undefined,
      },
    })

    res.json(mapFileRecord(updated))
  } catch (error) {
    next(error)
  }
})

filesRouter.post('/upload-url', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const parsed = uploadUrlSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const { filename, contentType } = parsed.data

    const fileKey = `${uuidv4()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    const fileUrl = env.S3_ENDPOINT 
      ? `${env.S3_ENDPOINT}/${BUCKET_NAME}/${fileKey}`
      : `https://${BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com/${fileKey}`

    res.json({ uploadUrl, fileKey, fileUrl })
  } catch (error) {
    next(error)
  }
})

filesRouter.post('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const parsed = fileSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const { name, size, addedLabel, shared, isShared, subjectId, lessonId, fileKey, fileUrl } = parsed.data

    const parsedSize = parseFileSizeToBytes(size)
    if (parsedSize === undefined || parsedSize === null) {
      res.status(400).json({ error: 'Pole size musi byt cislo nebo text typu "2.4 MB".' })
      return
    }

    const created = await prisma.fileRecord.create({
      data: {
        userId: BigInt(actor.id),
        subjectId: asBigInt(subjectId),
        lessonId: asBigInt(lessonId),
        name,
        size: parsedSize,
        addedLabel,
        isShared: isShared !== undefined ? isShared : (shared !== undefined ? shared : false),
        fileKey: fileKey ?? null,
        fileUrl: fileUrl ?? null,
      },
    })

    res.status(201).json(mapFileRecord(created))
  } catch (error) {
    next(error)
  }
})

filesRouter.put('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const fileId = asBigInt(req.params.id)
    if (!fileId) {
      res.status(400).json({ error: 'Neplatne ID souboru.' })
      return
    }

    const existing = await prisma.fileRecord.findUnique({ where: { id: fileId } })
    if (!existing) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni upravit tento soubor.' })
      return
    }

    const parsed = updateFileSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const { name, size, addedLabel, shared, isShared, subjectId, lessonId } = parsed.data

    const parsedSize = parseFileSizeToBytes(size)
    if (size !== undefined && parsedSize === undefined) {
      res.status(400).json({ error: 'Neplatna velikost souboru.' })
      return
    }

    const updated = await prisma.fileRecord.update({
      where: { id: fileId },
      data: {
        name,
        size: parsedSize === null ? undefined : parsedSize,
        addedLabel,
        isShared:
          isShared !== undefined ? isShared : shared !== undefined ? shared : undefined,
        subjectId: subjectId !== undefined ? asBigInt(subjectId) : undefined,
        lessonId: lessonId !== undefined ? asBigInt(lessonId) : undefined,
      },
    })

    res.json(mapFileRecord(updated))
  } catch (error) {
    next(error)
  }
})

filesRouter.delete('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const fileId = asBigInt(req.params.id)
    if (!fileId) {
      res.status(400).json({ error: 'Neplatne ID souboru.' })
      return
    }

    const existing = await prisma.fileRecord.findUnique({ where: { id: fileId } })
    if (!existing) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    if (existing.deletedAt) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni smazat tento soubor.' })
      return
    }

    await prisma.fileRecord.update({ where: { id: fileId }, data: { deletedAt: new Date() } })

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

filesRouter.get('/:id/comments', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const fileId = asBigInt(req.params.id)
    if (!fileId) {
      res.status(400).json({ error: 'Neplatne ID souboru.' })
      return
    }

    const file = await prisma.fileRecord.findUnique({ where: { id: fileId } })
    if (!file || file.deletedAt) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    const canRead = file.isShared || file.userId === BigInt(actor.id) || actor.role === 'ADMIN'
    if (!canRead) {
      res.status(403).json({ error: 'Nemate opravneni zobrazit komentare tohoto souboru.' })
      return
    }

    const comments = await prisma.fileComment.findMany({
      where: { fileId },
      orderBy: { createdAt: 'asc' },
    })

    res.json(
      comments.map((comment) => ({
        id: Number(comment.id),
        fileId: Number(comment.fileId),
        userId: Number(comment.userId),
        comment: comment.comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      })),
    )
  } catch (error) {
    next(error)
  }
})

filesRouter.post('/:id/comments', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const fileId = asBigInt(req.params.id)
    if (!fileId) {
      res.status(400).json({ error: 'Neplatne ID souboru.' })
      return
    }

    const parsed = fileCommentSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const { comment } = parsed.data

    const file = await prisma.fileRecord.findUnique({ where: { id: fileId } })
    if (!file || file.deletedAt) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    const canComment = file.isShared || file.userId === BigInt(actor.id) || actor.role === 'ADMIN'
    if (!canComment) {
      res.status(403).json({ error: 'Nemate opravneni komentovat tento soubor.' })
      return
    }

    const created = await prisma.fileComment.create({
      data: {
        fileId,
        userId: BigInt(actor.id),
        comment,
      },
    })

    res.status(201).json({
      id: Number(created.id),
      fileId: Number(created.fileId),
      userId: Number(created.userId),
      comment: created.comment,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

fileCommentsRouter.patch('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const commentId = asBigInt(req.params.id)
    if (!commentId) {
      res.status(400).json({ error: 'Neplatne ID komentare.' })
      return
    }

    const parsed = fileCommentSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const { comment } = parsed.data

    const existing = await prisma.fileComment.findUnique({
      where: { id: commentId },
      include: {
        file: {
          select: {
            userId: true,
          },
        },
      },
    })
    if (!existing) {
      res.status(404).json({ error: 'Komentar nebyl nalezen.' })
      return
    }

    const canEdit =
      existing.userId === BigInt(actor.id) || existing.file.userId === BigInt(actor.id) || actor.role === 'ADMIN'
    if (!canEdit) {
      res.status(403).json({ error: 'Nemate opravneni upravit tento komentar.' })
      return
    }

    const updated = await prisma.fileComment.update({
      where: { id: commentId },
      data: { comment },
    })

    res.json({
      id: Number(updated.id),
      fileId: Number(updated.fileId),
      userId: Number(updated.userId),
      comment: updated.comment,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

fileCommentsRouter.delete('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const commentId = asBigInt(req.params.id)
    if (!commentId) {
      res.status(400).json({ error: 'Neplatne ID komentare.' })
      return
    }

    const existing = await prisma.fileComment.findUnique({
      where: { id: commentId },
      include: {
        file: {
          select: {
            userId: true,
          },
        },
      },
    })
    if (!existing) {
      res.status(404).json({ error: 'Komentar nebyl nalezen.' })
      return
    }

    const canDelete =
      existing.userId === BigInt(actor.id) || existing.file.userId === BigInt(actor.id) || actor.role === 'ADMIN'
    if (!canDelete) {
      res.status(403).json({ error: 'Nemate opravneni smazat tento komentar.' })
      return
    }

    await prisma.fileComment.delete({ where: { id: commentId } })

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})