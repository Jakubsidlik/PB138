import { db } from '../../db/client'
import { imageComments, users } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

export const commentsRepository = {
  async findByImage(imageId: bigint) {
    return db
      .select({
        id: imageComments.id,
        imageId: imageComments.imageId,
        userId: imageComments.userId,
        content: imageComments.content,
        createdAt: imageComments.createdAt,
        updatedAt: imageComments.updatedAt,
        userFullName: users.fullName,
      })
      .from(imageComments)
      .innerJoin(users, eq(users.id, imageComments.userId))
      .where(eq(imageComments.imageId, imageId))
      .orderBy(imageComments.createdAt)
  },

  async create(data: { imageId: bigint; userId: bigint; content: string }) {
    const [created] = await db
      .insert(imageComments)
      .values(data)
      .returning()
    return created
  },

  async findById(commentId: bigint) {
    const [row] = await db
      .select()
      .from(imageComments)
      .where(eq(imageComments.id, commentId))
      .limit(1)
    return row ?? null
  },

  async delete(commentId: bigint) {
    return db.delete(imageComments).where(eq(imageComments.id, commentId))
  },
}
