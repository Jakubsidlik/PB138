import { db } from '../../db/client'
import { groups, groupMembers, users, images } from '../../db/schema'
import { eq, and, isNull, count } from 'drizzle-orm'

export const groupsRepository = {
  async findAllByUser(userId: bigint) {
    const rows = await db
      .select({
        id: groups.id,
        name: groups.name,
        ownerId: groups.ownerId,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
      })
      .from(groups)
      .innerJoin(groupMembers, eq(groupMembers.groupId, groups.id))
      .where(eq(groupMembers.userId, userId))
      .orderBy(groups.createdAt)

    return rows
  },

  async findById(groupId: bigint) {
    const [row] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1)
    return row ?? null
  },

  async create(data: { name: string; ownerId: bigint }) {
    const [created] = await db
      .insert(groups)
      .values(data)
      .returning()
    return created
  },

  async update(groupId: bigint, data: { name?: string }) {
    const [updated] = await db
      .update(groups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(groups.id, groupId))
      .returning()
    return updated
  },

  async delete(groupId: bigint) {
    return db.delete(groups).where(eq(groups.id, groupId))
  },

  async addMember(groupId: bigint, userId: bigint, role: 'OWNER' | 'MEMBER' = 'MEMBER') {
    const [member] = await db
      .insert(groupMembers)
      .values({ groupId, userId, role })
      .onConflictDoNothing()
      .returning()
    return member
  },

  async removeMember(groupId: bigint, userId: bigint) {
    return db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
  },

  async findMembers(groupId: bigint) {
    return db
      .select({
        id: groupMembers.id,
        groupId: groupMembers.groupId,
        userId: groupMembers.userId,
        role: groupMembers.role,
        createdAt: groupMembers.createdAt,
        userFullName: users.fullName,
        userEmail: users.email,
      })
      .from(groupMembers)
      .innerJoin(users, eq(users.id, groupMembers.userId))
      .where(eq(groupMembers.groupId, groupId))
      .orderBy(groupMembers.createdAt)
  },

  async isMember(groupId: bigint, userId: bigint): Promise<boolean> {
    const [row] = await db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1)
    return !!row
  },

  async getMemberRole(groupId: bigint, userId: bigint): Promise<'OWNER' | 'MEMBER' | null> {
    const [row] = await db
      .select({ role: groupMembers.role })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1)
    return row?.role ?? null
  },

  async countMembers(groupId: bigint): Promise<number> {
    const [row] = await db
      .select({ count: count() })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId))
    return row?.count ?? 0
  },

  async countUnratedImages(groupId: bigint): Promise<number> {
    const [row] = await db
      .select({ count: count() })
      .from(images)
      .where(and(eq(images.groupId, groupId), isNull(images.tier)))
    return row?.count ?? 0
  },

  async findUserByEmail(email: string) {
    const [row] = await db
      .select({ id: users.id, fullName: users.fullName, email: users.email })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)
    return row ?? null
  },
}
