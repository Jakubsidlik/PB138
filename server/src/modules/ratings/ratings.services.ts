import { ratingsRepository } from './ratings.repository'
import { groupsRepository } from '../groups/groups.repository'
import { imagesRepository } from '../images/images.repository'
import { AppError } from '../../middleware/error-handler'
import type { DbUser, Tier } from '../../db/schema'

export const ratingsServices = {
  async rateImage(groupId: bigint, imageId: bigint, actor: Pick<DbUser, 'id' | 'role'>, tier: Tier) {
    if (actor.role !== 'ADMIN') {
      const isMember = await groupsRepository.isMember(groupId, actor.id)
      if (!isMember) throw new AppError('Přístup odepřen.', 403)
    }

    const image = await imagesRepository.findById(imageId)
    if (!image || image.groupId !== groupId) {
      throw new AppError('Obrázek nenalezen v dané skupině.', 404)
    }

    return ratingsRepository.upsertRating(imageId, actor.id, tier)
  },

  async getGroupResult(groupId: bigint, actor: Pick<DbUser, 'id' | 'role'>) {
    if (actor.role !== 'ADMIN') {
      const isMember = await groupsRepository.isMember(groupId, actor.id)
      if (!isMember) throw new AppError('Přístup odepřen.', 403)
    }

    const images = await imagesRepository.findByGroup(groupId)
    const imageIds = images.map(img => img.id)
    const allRatings = await ratingsRepository.findAllByGroupImages(imageIds)

    // Agregace
    const resultImages = images.map(img => {
      const imgRatings = allRatings.filter(r => r.imageId === img.id)
      const formattedRatings = imgRatings.map(r => ({
        imageId: Number(r.imageId),
        userId: Number(r.userId),
        tier: r.tier,
        user: { id: Number(r.userId), fullName: r.userFullName }
      }))

      // Vypočítat nejčastější tier
      let resultTier: Tier | null = null
      if (formattedRatings.length > 0) {
        const counts: Record<string, number> = {}
        for (const r of formattedRatings) {
          counts[r.tier] = (counts[r.tier] || 0) + 1
        }
        let maxCount = 0
        for (const [t, c] of Object.entries(counts)) {
          if (c > maxCount) {
            maxCount = c
            resultTier = t as Tier
          }
        }
      }

      return {
        image: {
          id: Number(img.id),
          groupId: Number(img.groupId),
          name: img.name,
          fileKey: img.fileKey,
          fileUrl: img.fileUrl,
          size: img.size,
          tier: img.tier, // fallback / old consensus
          createdAt: img.createdAt.toISOString(),
          uploadedBy: { fullName: img.uploaderFullName }
        },
        resultTier,
        votes: formattedRatings
      }
    })

    return { images: resultImages }
  },

  async getMyRatings(groupId: bigint, actor: Pick<DbUser, 'id' | 'role'>) {
    if (actor.role !== 'ADMIN') {
      const isMember = await groupsRepository.isMember(groupId, actor.id)
      if (!isMember) throw new AppError('Přístup odepřen.', 403)
    }

    const images = await imagesRepository.findByGroup(groupId)
    const imageIds = images.map(img => img.id)
    const allRatings = await ratingsRepository.findAllByGroupImages(imageIds)
    const myRatings = allRatings.filter(r => r.userId === actor.id)

    return myRatings.map(r => ({
      imageId: Number(r.imageId),
      userId: Number(r.userId),
      tier: r.tier,
      user: { id: Number(r.userId), fullName: r.userFullName }
    }))
  }
}
