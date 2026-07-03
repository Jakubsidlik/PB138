import { db } from '../../db/client'
import { imageRatings, users } from '../../db/schema'
import type { Tier } from '../../db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export const ratingsRepository = {
  async upsertRating(imageId: bigint, userId: bigint, tier: Tier) {
    const [rating] = await db
      .insert(imageRatings)
      .values({ imageId, userId, tier })
      .onConflictDoUpdate({
        target: [imageRatings.imageId, imageRatings.userId],
        set: { tier, updatedAt: new Date() },
      })
      .returning()
    return rating
  },

  async findByImage(imageId: bigint) {
    return db
      .select({
        imageId: imageRatings.imageId,
        userId: imageRatings.userId,
        tier: imageRatings.tier,
        createdAt: imageRatings.createdAt,
        updatedAt: imageRatings.updatedAt,
        userFullName: users.fullName,
      })
      .from(imageRatings)
      .innerJoin(users, eq(users.id, imageRatings.userId))
      .where(eq(imageRatings.imageId, imageId))
  },

  async findMyRating(imageId: bigint, userId: bigint) {
    const [row] = await db
      .select()
      .from(imageRatings)
      .where(and(eq(imageRatings.imageId, imageId), eq(imageRatings.userId, userId)))
      .limit(1)
    return row ?? null
  },

  async findAllByGroupImages(imageIds: bigint[]) {
    if (imageIds.length === 0) return []
    return db
      .select({
        imageId: imageRatings.imageId,
        userId: imageRatings.userId,
        tier: imageRatings.tier,
        userFullName: users.fullName,
      })
      .from(imageRatings)
      .innerJoin(users, eq(users.id, imageRatings.userId))
      .where(inArray(imageRatings.imageId, imageIds))
  }
}
