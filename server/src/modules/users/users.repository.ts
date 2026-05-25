import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import { users } from '../../db/schema'

const userSelect = {
  id: users.id,
  fullName: users.fullName,
  email: users.email,
  role: users.role,
  school: users.school,
  studyMajor: users.studyMajor,
  studyYear: users.studyYear,
  studyType: users.studyType,

  avatarDataUrl: users.avatarDataUrl,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
}

export class UsersRepository {
  async findAll() {
    return db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        hasAvatar: sql<boolean>`CASE WHEN ${users.avatarDataUrl} IS NOT NULL THEN true ELSE false END`.as('hasAvatar'),
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(asc(users.id))
  }

  async findById(userId: bigint) {
    const [user] = await db
      .select(userSelect)
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    return user || null
  }

  async findByEmail(email: string) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1)
    return user || null
  }

  async create(data: any) {
    const [created] = await db.insert(users).values(data).returning(userSelect)
    return created
  }

  async update(userId: bigint, data: any) {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning(userSelect)
    return updated
  }

  async softDelete(userId: bigint) {
    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, userId))
    return { success: true }
  }

  async findFirstActive() {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(asc(users.id))
      .limit(1)
    return user || null
  }
}

export const usersRepository = new UsersRepository()
