import express from 'express'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { and, asc, desc, eq, gt, isNull, or, sql } from 'drizzle-orm'

import { db } from './db/client.js'
import { env } from './env.js'
import { fileComments, fileRecords } from './db/schema.js'
import { fileCommentSchema, fileModerationSchema, fileSchema, updateFileSchema, uploadUrlSchema } from './schemas.js'
import { asBigInt, mapFileRecord, parseCursorPagination, parseFileSizeToBytes, toPaginatedPayload } from './utils.js'
import { getActorFromRequest, isPublicActor, requireAdmin, requireRegisteredActor } from './auth.js'

export const filesRouter: express.Router = express.Router()
export const adminFilesRouter: express.Router = express.Router()
export const fileCommentsRouter: express.Router = express.Router()

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

const fileSelect = {
  id: fileRecords.id,
  userId: fileRecords.userId,
  subjectId: fileRecords.subjectId,
  lessonId: fileRecords.lessonId,
  fileKey: fileRecords.fileKey,
  fileUrl: fileRecords.fileUrl,
  name: fileRecords.name,
  size: fileRecords.size,
  addedLabel: fileRecords.addedLabel,
  isShared: fileRecords.isShared,
  deletedAt: fileRecords.deletedAt,
  createdAt: fileRecords.createdAt,
  updatedAt: fileRecords.updatedAt,
}

const mapComment = (comment: typeof fileComments.$inferSelect) => ({
  id: Number(comment.id),
  fileId: Number(comment.fileId),
  userId: Number(comment.userId),
  comment: comment.comment,
  createdAt: comment.createdAt.toISOString(),
  updatedAt: comment.updatedAt.toISOString(),
})

const countCommentsForFile = async (fileId: bigint) => {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(fileComments).where(eq(fileComments.fileId, fileId))
  return row?.count ?? 0
}

filesRouter.get('/', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const pagination = parseCursorPagination(req, { defaultLimit: 25, maxLimit: 100 })
    const subjectId = asBigInt(req.query.subjectId)
    const lessonId = asBigInt(req.query.lessonId)
    const shared = req.query.shared
    const includeDeleted = req.query.includeDeleted === 'true'

    const baseConditions = [
      subjectId ? eq(fileRecords.subjectId, subjectId) : undefined,
      lessonId ? eq(fileRecords.lessonId, lessonId) : undefined,
      includeDeleted ? undefined : isNull(fileRecords.deletedAt),
      pagination.enabled && pagination.cursor ? gt(fileRecords.id, pagination.cursor) : undefined,
    ].filter(Boolean)

    const visibility = isPublicActor(actor)
      ? eq(fileRecords.isShared, true)
      : or(eq(fileRecords.userId, BigInt(actor.id)), eq(fileRecords.isShared, true))

    const sharedFilter = shared === 'true' ? eq(fileRecords.isShared, true) : shared === 'false' ? eq(fileRecords.isShared, false) : undefined
    const whereClause = and(...([visibility, sharedFilter, ...baseConditions] as Array<ReturnType<typeof eq> | ReturnType<typeof or> | undefined>).filter(Boolean))

    const query = db.select(fileSelect).from(fileRecords)
    const rows = pagination.enabled
      ? await query.where(whereClause).orderBy(asc(fileRecords.id)).limit(pagination.limit + 1).offset(pagination.cursor ? 1 : 0)
      : await query.where(whereClause).orderBy(desc(fileRecords.createdAt))

    const mappedFiles = rows.map(mapFileRecord)

    if (!pagination.enabled) {
      res.json(mappedFiles)
      return
    }

    res.json({
      ...toPaginatedPayload(mappedFiles, pagination.limit),
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

filesRouter.get('/public', async (_req, res, next) => {
  try {
    const files = await db
      .select(fileSelect)
      .from(fileRecords)
      .where(and(eq(fileRecords.isShared, true), isNull(fileRecords.deletedAt)))
      .orderBy(desc(fileRecords.updatedAt), desc(fileRecords.createdAt))

    res.json(files.map(mapFileRecord))
  } catch (error) {
    next(error)
  }
})

adminFilesRouter.get('/', async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res)
    if (!admin) return

    const includeDeleted = req.query.includeDeleted === 'true'
    const files = await db
      .select(fileSelect)
      .from(fileRecords)
      .where(includeDeleted ? undefined : isNull(fileRecords.deletedAt))
      .orderBy(desc(fileRecords.updatedAt), desc(fileRecords.createdAt))

    res.json(files.map(mapFileRecord))
  } catch (error) {
    next(error)
  }
})

adminFilesRouter.patch('/:id/moderation', async (req, res, next) => {
  try {
    const admin = await requireAdmin(req, res)
    if (!admin) return

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

    const existing = await db.select({ id: fileRecords.id }).from(fileRecords).where(eq(fileRecords.id, fileId)).limit(1)
    if (!existing.length) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    const [updated] = await db
      .update(fileRecords)
      .set({
        isShared: payload.isShared,
        deletedAt: payload.deleted === true ? new Date() : payload.deleted === false ? null : undefined,
      })
      .where(eq(fileRecords.id, fileId))
      .returning(fileSelect)

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
    if (!actor) return

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

    const [created] = await db.insert(fileRecords).values({
      userId: BigInt(actor.id),
      subjectId: asBigInt(subjectId),
      lessonId: asBigInt(lessonId),
      name,
      size: parsedSize,
      addedLabel,
      isShared: isShared !== undefined ? isShared : shared !== undefined ? shared : false,
      fileKey: fileKey ?? null,
      fileUrl: fileUrl ?? null,
    }).returning(fileSelect)

    res.status(201).json(mapFileRecord(created))
  } catch (error) {
    next(error)
  }
})

filesRouter.put('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const fileId = asBigInt(req.params.id)
    if (!fileId) {
      res.status(400).json({ error: 'Neplatne ID souboru.' })
      return
    }

    const existing = await db.select({ id: fileRecords.id, userId: fileRecords.userId }).from(fileRecords).where(eq(fileRecords.id, fileId)).limit(1)
    if (!existing.length) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    if (existing[0].userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
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

    const [updated] = await db
      .update(fileRecords)
      .set({
        name,
        size: parsedSize ?? undefined,
        addedLabel,
        isShared: isShared !== undefined ? isShared : shared !== undefined ? shared : undefined,
        subjectId: subjectId !== undefined ? asBigInt(subjectId) : undefined,
        lessonId: lessonId !== undefined ? asBigInt(lessonId) : undefined,
      })
      .where(eq(fileRecords.id, fileId))
      .returning(fileSelect)

    res.json(mapFileRecord(updated))
  } catch (error) {
    next(error)
  }
})

filesRouter.delete('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const fileId = asBigInt(req.params.id)
    if (!fileId) {
      res.status(400).json({ error: 'Neplatne ID souboru.' })
      return
    }

    const existing = await db.select({ id: fileRecords.id, userId: fileRecords.userId, deletedAt: fileRecords.deletedAt }).from(fileRecords).where(eq(fileRecords.id, fileId)).limit(1)
    if (!existing.length || existing[0].deletedAt) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    if (existing[0].userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni smazat tento soubor.' })
      return
    }

    await db.update(fileRecords).set({ deletedAt: new Date() }).where(eq(fileRecords.id, fileId))
    res.json({ success: true })
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

    const [file] = await db.select({ id: fileRecords.id, userId: fileRecords.userId, isShared: fileRecords.isShared, deletedAt: fileRecords.deletedAt }).from(fileRecords).where(eq(fileRecords.id, fileId)).limit(1)
    if (!file || file.deletedAt) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    const canRead = file.isShared || file.userId === BigInt(actor.id) || actor.role === 'ADMIN'
    if (!canRead) {
      res.status(403).json({ error: 'Nemate opravneni zobrazit komentare tohoto souboru.' })
      return
    }

    const comments = await db.select().from(fileComments).where(eq(fileComments.fileId, fileId)).orderBy(asc(fileComments.createdAt))
    res.json(comments.map(mapComment))
  } catch (error) {
    next(error)
  }
})

filesRouter.post('/:id/comments', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

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

    const [file] = await db.select({ id: fileRecords.id, userId: fileRecords.userId, isShared: fileRecords.isShared, deletedAt: fileRecords.deletedAt }).from(fileRecords).where(eq(fileRecords.id, fileId)).limit(1)
    if (!file || file.deletedAt) {
      res.status(404).json({ error: 'Soubor nebyl nalezen.' })
      return
    }

    const canComment = file.isShared || file.userId === BigInt(actor.id) || actor.role === 'ADMIN'
    if (!canComment) {
      res.status(403).json({ error: 'Nemate opravneni komentovat tento soubor.' })
      return
    }

    const [created] = await db.insert(fileComments).values({
      fileId,
      userId: BigInt(actor.id),
      comment,
    }).returning()

    res.status(201).json(mapComment(created))
  } catch (error) {
    next(error)
  }
})

fileCommentsRouter.patch('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

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

    const existing = await db
      .select({
        id: fileComments.id,
        userId: fileComments.userId,
        fileUserId: fileRecords.userId,
      })
      .from(fileComments)
      .innerJoin(fileRecords, eq(fileComments.fileId, fileRecords.id))
      .where(eq(fileComments.id, commentId))
      .limit(1)

    if (!existing.length) {
      res.status(404).json({ error: 'Komentar nebyl nalezen.' })
      return
    }

    const canEdit = existing[0].fileUserId === BigInt(actor.id) || existing[0].userId === BigInt(actor.id) || actor.role === 'ADMIN'
    if (!canEdit) {
      res.status(403).json({ error: 'Nemate opravneni upravit tento komentar.' })
      return
    }

    const [updated] = await db.update(fileComments).set({ comment }).where(eq(fileComments.id, commentId)).returning()
    res.json(mapComment(updated))
  } catch (error) {
    next(error)
  }
})

fileCommentsRouter.delete('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const commentId = asBigInt(req.params.id)
    if (!commentId) {
      res.status(400).json({ error: 'Neplatne ID komentare.' })
      return
    }

    const existing = await db
      .select({
        id: fileComments.id,
        userId: fileComments.userId,
        fileUserId: fileRecords.userId,
      })
      .from(fileComments)
      .innerJoin(fileRecords, eq(fileComments.fileId, fileRecords.id))
      .where(eq(fileComments.id, commentId))
      .limit(1)

    if (!existing.length) {
      res.status(404).json({ error: 'Komentar nebyl nalezen.' })
      return
    }

    const canDelete = existing[0].fileUserId === BigInt(actor.id) || existing[0].userId === BigInt(actor.id) || actor.role === 'ADMIN'
    if (!canDelete) {
      res.status(403).json({ error: 'Nemate opravneni smazat tento komentar.' })
      return
    }

    await db.delete(fileComments).where(eq(fileComments.id, commentId))
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})