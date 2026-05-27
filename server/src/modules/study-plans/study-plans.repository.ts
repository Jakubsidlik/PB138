import { and, asc, eq, exists, isNull, or, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import { users, studyPlans, studyPlanCollaborators } from '../../db/schema'

const studyPlanSelect = {
  id: studyPlans.id,
  userId: studyPlans.userId,
  name: studyPlans.name,
  description: studyPlans.description,

  isActive: studyPlans.isActive,
  isShared: studyPlans.isShared,
  createdAt: studyPlans.createdAt,
  updatedAt: studyPlans.updatedAt,
}

export class StudyPlanRepository {
  async findAll(actor: { id: number, role: string }, filters: { includeInactive?: boolean }) {
    const visibility = or(
      eq(studyPlans.userId, BigInt(actor.id)),
      exists(
        db
          .select({ id: studyPlanCollaborators.id })
          .from(studyPlanCollaborators)
          .where(and(eq(studyPlanCollaborators.studyPlanId, studyPlans.id), eq(studyPlanCollaborators.userId, BigInt(actor.id)))),
      ),
    )

    const whereClause = and(
      filters.includeInactive ? undefined : eq(studyPlans.isActive, true),
      visibility,
    )

    const rows = await db.select(studyPlanSelect).from(studyPlans).where(whereClause).orderBy(asc(studyPlans.isActive), asc(studyPlans.createdAt))
    return rows
  }

  async findById(studyPlanId: bigint) {
    const [plan] = await db.select(studyPlanSelect).from(studyPlans).where(eq(studyPlans.id, studyPlanId)).limit(1)
    return plan || null
  }

  async create(data: any) {
    const [created] = await db.insert(studyPlans).values(data).returning(studyPlanSelect)
    return created
  }

  async update(studyPlanId: bigint, data: any) {
    const [updated] = await db.update(studyPlans).set(data).where(eq(studyPlans.id, studyPlanId)).returning(studyPlanSelect)
    return updated
  }

  async delete(studyPlanId: bigint) {
    await db.delete(studyPlans).where(eq(studyPlans.id, studyPlanId))
    return { success: true }
  }

  async findCollaborators(studyPlanId: bigint) {
    return db
      .select({
        id: studyPlanCollaborators.id,
        studyPlanId: studyPlanCollaborators.studyPlanId,
        userId: studyPlanCollaborators.userId,
        role: studyPlanCollaborators.role,
        userIdRef: users.id,
        userFullName: users.fullName,
        userEmail: users.email,
      })
      .from(studyPlanCollaborators)
      .innerJoin(users, eq(studyPlanCollaborators.userId, users.id))
      .where(eq(studyPlanCollaborators.studyPlanId, studyPlanId))
      .orderBy(asc(studyPlanCollaborators.createdAt))
  }

  async addCollaborator(studyPlanId: bigint, userId: bigint, role: any) {
    const [collaborator] = await db
      .insert(studyPlanCollaborators)
      .values({
        studyPlanId,
        userId,
        role,
      })
      .onConflictDoUpdate({
        target: [studyPlanCollaborators.studyPlanId, studyPlanCollaborators.userId],
        set: { role },
      })
      .returning({
        id: studyPlanCollaborators.id,
        studyPlanId: studyPlanCollaborators.studyPlanId,
        userId: studyPlanCollaborators.userId,
        role: studyPlanCollaborators.role,
      })
    return collaborator
  }

  async removeCollaborator(studyPlanId: bigint, userId: bigint) {
    await db.delete(studyPlanCollaborators).where(and(eq(studyPlanCollaborators.studyPlanId, studyPlanId), eq(studyPlanCollaborators.userId, userId)))
    return { success: true }
  }

  async countByStudyPlan(table: any, studyPlanId: bigint) {
    const whereClause = [eq(table.studyPlanId, studyPlanId)]
    if (table.deletedAt) {
      whereClause.push(isNull(table.deletedAt))
    }
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(table)
      .where(and(...whereClause))
    return row?.count ?? 0
  }

  async getCollaboratorRole(studyPlanId: bigint, userId: bigint) {
    const [collaborator] = await db
      .select({ role: studyPlanCollaborators.role })
      .from(studyPlanCollaborators)
      .where(and(eq(studyPlanCollaborators.studyPlanId, studyPlanId), eq(studyPlanCollaborators.userId, userId)))
      .limit(1)
    return collaborator?.role ?? null
  }

  async findUserByEmail(email: string) {
    const [user] = await db.select({ id: users.id, fullName: users.fullName, email: users.email }).from(users).where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt))).limit(1)
    return user || null
  }
}

export const studyPlanRepository = new StudyPlanRepository()
