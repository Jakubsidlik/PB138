import { imagesRepository } from './images.repository'
import { groupsRepository } from '../groups/groups.repository'
import { AppError } from '../../middleware/error-handler'
import { env } from '../../env'
import { type Tier } from '../../db/schema'
import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
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

const mapImage = (img: any) => ({
  id: Number(img.id),
  groupId: Number(img.groupId),
  name: img.name,
  fileKey: img.fileKey,
  fileUrl: img.fileUrl,
  size: img.size,
  tier: img.tier ?? null,
  uploadedBy: {
    id: Number(img.uploadedById),
    fullName: img.uploaderFullName ?? 'Neznámý',
  },
  ratedBy: img.ratedById ? { id: Number(img.ratedById) } : null,
  createdAt: img.createdAt instanceof Date ? img.createdAt.toISOString() : img.createdAt,
})

export class ImagesService {
  async getImages(groupId: bigint, actor: { id: number }, tier?: Tier) {
    const isMember = await groupsRepository.isMember(groupId, BigInt(actor.id))
    if (!isMember) throw new AppError('Nemáte přístup k této skupině.', 403)

    const rows = await imagesRepository.findByGroup(groupId, tier)
    const mapped = await Promise.all(rows.map(async (img) => {
      const base = mapImage(img)
      if (img.ratedById) {
        const raterName = await imagesRepository.getRaterName(img.ratedById)
        base.ratedBy = { id: Number(img.ratedById), fullName: raterName ?? 'Neznámý' } as any
      }
      return base
    }))
    return mapped
  }

  async getUnrated(groupId: bigint, actor: { id: number }) {
    const isMember = await groupsRepository.isMember(groupId, BigInt(actor.id))
    if (!isMember) throw new AppError('Nemáte přístup k této skupině.', 403)

    const rows = await imagesRepository.findUnrated(groupId)
    return rows.map(mapImage)
  }

  async getTierCounts(groupId: bigint, actor: { id: number }) {
    const isMember = await groupsRepository.isMember(groupId, BigInt(actor.id))
    if (!isMember) throw new AppError('Nemáte přístup k této skupině.', 403)

    return imagesRepository.countByTier(groupId)
  }

  async getUploadUrl(actor: { id: number }, data: { filename: string; contentType: string }) {
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

  async createImage(groupId: bigint, actor: { id: number; fullName?: string; email?: string }, data: {
    name: string
    size: number
    fileKey?: string | null
    fileUrl?: string | null
  }) {
    const isMember = await groupsRepository.isMember(groupId, BigInt(actor.id))
    if (!isMember) throw new AppError('Nemáte přístup k této skupině.', 403)

    const created = await imagesRepository.create({
      groupId,
      uploadedById: BigInt(actor.id),
      name: data.name,
      fileKey: data.fileKey,
      fileUrl: data.fileUrl,
      size: data.size,
    })

    // Send email notifications to other group members
    try {
      if (env.RESEND_API_KEY) {
        const resend = new Resend(env.RESEND_API_KEY)
        const members = await groupsRepository.findMembers(groupId)
        const group = await groupsRepository.findById(groupId)
        const groupName = group?.name ?? 'Neznámá skupina'

        const otherMembers = members.filter((m) => m.userId !== BigInt(actor.id))

        for (const member of otherMembers) {
          try {
            await resend.emails.send({
              from: 'Car-Y-list <onboarding@resend.dev>',
              to: member.userEmail,
              subject: `Nový obrázek ve skupině: ${groupName}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                  <h2 style="color: #f59e0b;">🆕 Nový obrázek k hodnocení!</h2>
                  <p>Ahoj <strong>${member.userFullName}</strong>,</p>
                  <p>Uživatel <strong>${actor.fullName || actor.email}</strong> nahrál nový obrázek <strong>${data.name}</strong> do skupiny <strong>${groupName}</strong>.</p>
                  <p>Přihlas se a zařaď obrázek do odpovídající kategorie v tier listu!</p>
                  <div style="margin: 30px 0;">
                    <a href="http://localhost:5173/group/${Number(groupId)}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ohodnotit obrázek</a>
                  </div>
                  <p style="color: #666; font-size: 14px;">Tento e-mail byl automaticky vygenerován aplikací Car-Y-list.</p>
                </div>
              `
            })
          } catch (e) {
            console.error(`Nepodařilo se odeslat email uživateli ${member.userEmail}:`, e)
          }
        }
      }
    } catch (emailError) {
      console.error('Chyba při odesílání notifikací:', emailError)
    }

    return {
      id: Number(created.id),
      groupId: Number(created.groupId),
      name: created.name,
      fileKey: created.fileKey,
      fileUrl: created.fileUrl,
      size: created.size,
      tier: null,
      uploadedBy: {
        id: actor.id,
        fullName: actor.fullName ?? 'Neznámý',
      },
      ratedBy: null,
      createdAt: created.createdAt.toISOString(),
    }
  }

  async setTier(groupId: bigint, imageId: bigint, actor: { id: number }, tier: Tier) {
    const isMember = await groupsRepository.isMember(groupId, BigInt(actor.id))
    if (!isMember) throw new AppError('Nemáte přístup k této skupině.', 403)

    const image = await imagesRepository.findById(imageId)
    if (!image) throw new AppError('Obrázek nebyl nalezen.', 404)
    if (image.groupId !== groupId) throw new AppError('Obrázek nepatří do této skupiny.', 400)

    const updated = await imagesRepository.setTier(imageId, tier, BigInt(actor.id))
    return {
      id: Number(updated.id),
      groupId: Number(updated.groupId),
      name: updated.name,
      tier: updated.tier,
      ratedBy: { id: actor.id },
      updatedAt: updated.updatedAt.toISOString(),
    }
  }

  async deleteImage(groupId: bigint, imageId: bigint, actor: { id: number; role?: string }) {
    const isMember = await groupsRepository.isMember(groupId, BigInt(actor.id))
    if (!isMember) throw new AppError('Nemáte přístup k této skupině.', 403)

    const image = await imagesRepository.findById(imageId)
    if (!image) throw new AppError('Obrázek nebyl nalezen.', 404)
    if (image.groupId !== groupId) throw new AppError('Obrázek nepatří do této skupiny.', 400)

    // Only uploader or group owner can delete
    const group = await groupsRepository.findById(groupId)
    const canDelete = image.uploadedById === BigInt(actor.id) ||
      group?.ownerId === BigInt(actor.id) ||
      actor.role === 'ADMIN'
    if (!canDelete) throw new AppError('Nemáte oprávnění smazat tento obrázek.', 403)

    return imagesRepository.delete(imageId)
  }
}

export const imagesService = new ImagesService()
