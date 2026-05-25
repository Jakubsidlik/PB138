import { db } from '../../db/client'
import { tags } from '../../db/schema'
import { and, eq, or, isNull } from 'drizzle-orm'

class TagsRepository {
  async findAll(userId: number) {
    return await db.query.tags.findMany({
      where: or(
        isNull(tags.userId), // system tags
        eq(tags.userId, BigInt(userId)) // user tags
      ),
      orderBy: (tags, { asc }) => [asc(tags.id)]
    })
  }

  async create(data: { userId: number, name: string, color: string }) {
    const [created] = await db.insert(tags).values({
      userId: BigInt(data.userId),
      name: data.name,
      color: data.color,
      isSystem: false,
    }).returning()
    return created
  }

  async delete(tagId: number, userId: number) {
    const [deleted] = await db.delete(tags).where(
      and(
        eq(tags.id, BigInt(tagId)),
        eq(tags.userId, BigInt(userId)), // can only delete own tags
        eq(tags.isSystem, false)
      )
    ).returning()
    return deleted
  }
}

export const tagsRepository = new TagsRepository()
