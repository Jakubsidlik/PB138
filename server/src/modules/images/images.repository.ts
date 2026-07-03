import { db } from '../../db/client'
import { images, users, type Tier } from '../../db/schema'
import { eq, and, isNull, isNotNull, count } from 'drizzle-orm'

export const imagesRepository = {
  async findByGroup(groupId: bigint, tier?: Tier) {
    const conditions = [eq(images.groupId, groupId)]
    if (tier) {
      conditions.push(eq(images.tier, tier))
    } else {
      conditions.push(isNotNull(images.tier))
    }

    return db
      .select({
        id: images.id,
        groupId: images.groupId,
        uploadedById: images.uploadedById,
        name: images.name,
        fileKey: images.fileKey,
        fileUrl: images.fileUrl,
        size: images.size,
        tier: images.tier,
        ratedById: images.ratedById,
        createdAt: images.createdAt,
        updatedAt: images.updatedAt,
        uploaderFullName: users.fullName,
      })
      .from(images)
      .innerJoin(users, eq(users.id, images.uploadedById))
      .where(and(...conditions))
      .orderBy(images.createdAt)
  },

  async findUnrated(groupId: bigint) {
    return db
      .select({
        id: images.id,
        groupId: images.groupId,
        uploadedById: images.uploadedById,
        name: images.name,
        fileKey: images.fileKey,
        fileUrl: images.fileUrl,
        size: images.size,
        tier: images.tier,
        ratedById: images.ratedById,
        createdAt: images.createdAt,
        updatedAt: images.updatedAt,
        uploaderFullName: users.fullName,
      })
      .from(images)
      .innerJoin(users, eq(users.id, images.uploadedById))
      .where(and(eq(images.groupId, groupId), isNull(images.tier)))
      .orderBy(images.createdAt)
  },

  async findById(imageId: bigint) {
    const [row] = await db
      .select()
      .from(images)
      .where(eq(images.id, imageId))
      .limit(1)
    return row ?? null
  },

  async create(data: {
    groupId: bigint
    uploadedById: bigint
    name: string
    fileKey?: string | null
    fileUrl?: string | null
    size: number
  }) {
    const [created] = await db
      .insert(images)
      .values({
        groupId: data.groupId,
        uploadedById: data.uploadedById,
        name: data.name,
        fileKey: data.fileKey ?? null,
        fileUrl: data.fileUrl ?? null,
        size: data.size,
      })
      .returning()
    return created
  },

  async setTier(imageId: bigint, tier: Tier, ratedById: bigint) {
    const [updated] = await db
      .update(images)
      .set({ tier, ratedById, updatedAt: new Date() })
      .where(eq(images.id, imageId))
      .returning()
    return updated
  },

  async delete(imageId: bigint) {
    return db.delete(images).where(eq(images.id, imageId))
  },

  async countByTier(groupId: bigint) {
    const rows = await db
      .select({
        tier: images.tier,
        count: count(),
      })
      .from(images)
      .where(eq(images.groupId, groupId))
      .groupBy(images.tier)

    const result: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, unrated: 0 }
    for (const row of rows) {
      if (row.tier === null) {
        result.unrated = row.count
      } else {
        result[row.tier] = row.count
      }
    }
    return result
  },

  async getRaterName(ratedById: bigint | null) {
    if (!ratedById) return null
    const [row] = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, ratedById))
      .limit(1)
    return row?.fullName ?? null
  },
}
