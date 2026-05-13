import { filesRepository } from './files.repository.js'
import { AppError } from '../../middleware/error-handler.js'
import { mapFileRecord, parseFileSizeToBytes, toPaginatedPayload } from '../../utils.js'
import { usersRepository } from '../users/users.repository.js'
import { env } from '../../env.js'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { fileComments } from '../../db/schema.js'
import { Resend } from 'resend'

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

const mapComment = (comment: typeof fileComments.$inferSelect) => ({
  id: Number(comment.id),
  fileId: Number(comment.fileId),
  userId: Number(comment.userId),
  comment: comment.comment,
  createdAt: comment.createdAt.toISOString(),
  updatedAt: comment.updatedAt.toISOString(),
})

export class FilesService {
  async getFiles(actor: { id: number, role: string }, filters: {
    pagination: any
    subjectId?: bigint | null
    lessonId?: bigint | null
    shared?: string
    includeDeleted?: boolean
  }) {
    const rows = await filesRepository.findAll(actor, filters)
    const mappedFiles = rows.map(mapFileRecord)

    if (!filters.pagination.enabled) {
      return mappedFiles
    }

    return {
      ...toPaginatedPayload(mappedFiles, filters.pagination.limit),
      limit: filters.pagination.limit,
    }
  }

  async getPublicFiles() {
    const files = await filesRepository.findPublic()
    return files.map(mapFileRecord)
  }

  async getAdminFiles(includeDeleted: boolean) {
    const files = await filesRepository.findAdminAll(includeDeleted)
    return files.map(mapFileRecord)
  }

  async getUploadUrl(actorId: number, data: { filename: string, contentType: string }) {
    const fileKey = `${uuidv4()}-${data.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    if (!env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
      const uploadUrl = `http://localhost:${env.PORT}/api/files/local-upload/${fileKey}`
      const fileUrl = `http://localhost:${env.PORT}/api/files/local-upload/${fileKey}`
      return { uploadUrl, fileKey, fileUrl }
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: data.contentType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    const fileUrl = env.S3_ENDPOINT
      ? `${env.S3_ENDPOINT}/${BUCKET_NAME}/${fileKey}`
      : `https://${BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com/${fileKey}`

    return { uploadUrl, fileKey, fileUrl }
  }

  async createFile(actorId: number, data: any) {
    const parsedSize = parseFileSizeToBytes(data.size)
    if (parsedSize === undefined || parsedSize === null) {
      throw new AppError('Pole size musi byt cislo nebo text typu "2.4 MB".', 400)
    }

    const created = await filesRepository.create({
      userId: BigInt(actorId),
      subjectId: data.subjectId ? BigInt(data.subjectId) : null,
      lessonId: data.lessonId ? BigInt(data.lessonId) : null,
      name: data.name,
      size: parsedSize,
      addedLabel: data.addedLabel,
      isShared: data.isShared !== undefined ? data.isShared : data.shared !== undefined ? data.shared : false,
      fileKey: data.fileKey ?? null,
      fileUrl: data.fileUrl ?? null,
    })

    return mapFileRecord(created)
  }

  async updateFile(fileId: bigint, actor: { id: number, role: string }, data: any) {
    const existing = await filesRepository.findById(fileId)
    if (!existing) {
      throw new AppError('Soubor nebyl nalezen.', 404)
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      throw new AppError('Nemate opravneni upravit tento soubor.', 403)
    }

    const parsedSize = parseFileSizeToBytes(data.size)
    if (data.size !== undefined && parsedSize === undefined) {
      throw new AppError('Neplatna velikost souboru.', 400)
    }

    const updated = await filesRepository.update(fileId, {
      name: data.name,
      size: parsedSize ?? undefined,
      addedLabel: data.addedLabel,
      isShared: data.isShared !== undefined ? data.isShared : data.shared !== undefined ? data.shared : undefined,
      subjectId: data.subjectId !== undefined ? (data.subjectId ? BigInt(data.subjectId) : null) : undefined,
      lessonId: data.lessonId !== undefined ? (data.lessonId ? BigInt(data.lessonId) : null) : undefined,
    })

    return mapFileRecord(updated)
  }

  async deleteFile(fileId: bigint, actor: { id: number, role: string }) {
    const existing = await filesRepository.findById(fileId)
    if (!existing || existing.deletedAt) {
      throw new AppError('Soubor nebyl nalezen.', 404)
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      throw new AppError('Nemate opravneni smazat tento soubor.', 403)
    }

    return filesRepository.softDelete(fileId)
  }

  async shareFile(fileId: bigint, actor: { id: number, role: string, fullName?: string, email?: string }, data: { targetUserEmail: string, permission: string }) {
    const file = await filesRepository.findById(fileId)
    if (!file) {
      throw new AppError('Soubor nebyl nalezen.', 404)
    }

    const canShare = actor.role === 'ADMIN' || file.userId === BigInt(actor.id)
    if (!canShare) {
      throw new AppError('Nemate opravneni sdilet tento soubor.', 403)
    }

    let targetUser = await filesRepository.findUserByEmail(data.targetUserEmail)
    if (!targetUser) {
      const fallbackName = data.targetUserEmail.split('@')[0] || 'Uživatel'
      const createdUser = await usersRepository.create({
        email: data.targetUserEmail,
        fullName: fallbackName,
        role: 'REGISTERED',
      })
      targetUser = { id: createdUser.id }
    }

    if (targetUser.id === BigInt(actor.id)) {
      throw new AppError('Nemuzete sdilet soubor sam se sebou.', 400)
    }

    const share = await filesRepository.createShare({
      fileId,
      userId: targetUser.id,
      permission: data.permission,
    })

    try {
      if (env.RESEND_API_KEY) {
        const resend = new Resend(env.RESEND_API_KEY)
        
        await resend.emails.send({
          from: 'Planner <onboarding@resend.dev>',
          to: data.targetUserEmail,
          subject: `Sdílený soubor: ${file.name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #3b82f6;">Nový soubor nasdílen!</h2>
              <p>Ahoj,</p>
              <p>Uživatel <strong>${actor.fullName || actor.email}</strong> s tebou nasdílel soubor <strong>${file.name}</strong> v aplikaci Planner.</p>
              <div style="margin: 30px 0;">
                <a href="http://localhost:5173/files" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Otevřít v aplikaci</a>
              </div>
              <p style="color: #666; font-size: 14px;">Tento e-mail byl automaticky vygenerován aplikací Planner.</p>
            </div>
          `
        })
      }
    } catch (emailError) {
      console.error('Nepodařilo se odeslat upozorňovací e-mail:', emailError)
    }

    return {
      fileId: Number(share.fileId),
      userId: Number(share.userId),
      permission: share.permission,
      createdAt: share.createdAt.toISOString(),
    }
  }

  async unshareFile(fileId: bigint, userId: bigint, actor: { id: number, role: string }) {
    const file = await filesRepository.findById(fileId)
    if (!file) {
      throw new AppError('Soubor nebyl nalezen.', 404)
    }

    const canShare = actor.role === 'ADMIN' || file.userId === BigInt(actor.id)
    if (!canShare) {
      throw new AppError('Nemate opravneni upravovat sdileni tohoto souboru.', 403)
    }

    return filesRepository.deleteShare(fileId, userId)
  }

  async getComments(fileId: bigint, actor: { id: number, role: string }) {
    const comments = await filesRepository.findComments(fileId)
    return comments.map(mapComment)
  }

  async createComment(fileId: bigint, actorId: number, actorRole: string, data: { comment: string }) {
    const created = await filesRepository.createComment({
      fileId,
      userId: BigInt(actorId),
      comment: data.comment,
    })

    return mapComment(created)
  }

  async updateComment(commentId: bigint, actorId: number, actorRole: string, data: { comment: string }) {
    const updated = await filesRepository.updateComment(commentId, { comment: data.comment })
    return mapComment(updated)
  }

  async deleteComment(commentId: bigint, actorId: number, actorRole: string) {
    return filesRepository.deleteComment(commentId)
  }
}

export const filesService = new FilesService()
