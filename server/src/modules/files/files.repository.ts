import { and, asc, desc, eq, exists, gt, isNull, or, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import { fileRecords, fileShares, users, subjects, studyPlans, studyPlanCollaborators, fileRatings, subjectShares } from '../../db/schema'

const fileSelect = (actorId: number) => ({
  id: fileRecords.id,
  userId: fileRecords.userId,
  subjectId: fileRecords.subjectId,
  fileKey: fileRecords.fileKey,
  fileUrl: fileRecords.fileUrl,
  name: fileRecords.name,
  size: fileRecords.size,
  addedLabel: fileRecords.addedLabel,
  isShared: fileRecords.isShared,
  deletedAt: fileRecords.deletedAt,
  createdAt: fileRecords.createdAt,
  updatedAt: fileRecords.updatedAt,
  likes: sql<number>`count(case when ${fileRatings.vote} = 'LIKE' then 1 end)::int`,
  dislikes: sql<number>`count(case when ${fileRatings.vote} = 'DISLIKE' then 1 end)::int`,
  userVote: sql<string | null>`max(case when ${fileRatings.userId} = ${actorId} then ${fileRatings.vote}::text else null end)`,
})

const fileSelectBasic = {
  id: fileRecords.id,
  userId: fileRecords.userId,
  subjectId: fileRecords.subjectId,
  fileKey: fileRecords.fileKey,
  fileUrl: fileRecords.fileUrl,
  name: fileRecords.name,
  size: fileRecords.size,
  addedLabel: fileRecords.addedLabel,
  isShared: fileRecords.isShared,
  deletedAt: fileRecords.deletedAt,
  createdAt: fileRecords.createdAt,
  updatedAt: fileRecords.updatedAt,
}

export class FilesRepository {
  async findAll(actor: { id: number, role: string }, filters: {
    pagination: any
    subjectId?: bigint | null
    shared?: string
    includeDeleted?: boolean
  }) {
    const { pagination, subjectId, shared, includeDeleted } = filters

    const baseConditions = [
      subjectId ? eq(fileRecords.subjectId, subjectId) : undefined,
      includeDeleted ? undefined : isNull(fileRecords.deletedAt),
      pagination.enabled && pagination.cursor ? gt(fileRecords.id, pagination.cursor) : undefined,
    ].filter(Boolean)

    const explicitShares = db.select({ fileId: fileShares.fileId }).from(fileShares).where(eq(fileShares.userId, BigInt(actor.id)))

    const visibility = or(
      eq(fileRecords.userId, BigInt(actor.id)),
      eq(fileRecords.isShared, true),
      sql`${fileRecords.id} IN ${explicitShares}`,
      eq(subjects.userId, BigInt(actor.id)),
      eq(subjects.isShared, true),
      eq(studyPlans.isShared, true),
      exists(
        db
          .select({ id: studyPlanCollaborators.id })
          .from(studyPlanCollaborators)
          .where(and(eq(studyPlanCollaborators.studyPlanId, subjects.studyPlanId), eq(studyPlanCollaborators.userId, BigInt(actor.id)))),
      ),
      exists(
        db
          .select({ id: subjectShares.id })
          .from(subjectShares)
          .where(and(eq(subjectShares.subjectId, fileRecords.subjectId), eq(subjectShares.userId, BigInt(actor.id)))),
      )
    )

    const sharedFilter = shared === 'true' 
      ? or(eq(fileRecords.isShared, true), sql`${fileRecords.id} IN ${explicitShares}`) 
      : shared === 'false' 
        ? eq(fileRecords.isShared, false)
        : undefined
        
    const whereClause = and(...([visibility, sharedFilter, ...baseConditions] as any).filter(Boolean))

    const query = db.select(fileSelect(actor.id))
      .from(fileRecords)
      .leftJoin(subjects, eq(fileRecords.subjectId, subjects.id))
      .leftJoin(studyPlans, eq(subjects.studyPlanId, studyPlans.id))
      .leftJoin(fileRatings, eq(fileRecords.id, fileRatings.fileId))
      .groupBy(fileRecords.id, subjects.id, studyPlans.id)
      
    const rows = pagination.enabled
      ? await query.where(whereClause).orderBy(asc(fileRecords.id)).limit(pagination.limit + 1).offset(pagination.cursor ? 1 : 0)
      : await query.where(whereClause).orderBy(desc(fileRecords.createdAt))

    return rows
  }

  async findAdminAll(includeDeleted: boolean) {
    return db
      .select({
        ...fileSelect(0),
        userEmail: users.email,
      })
      .from(fileRecords)
      .leftJoin(users, eq(fileRecords.userId, users.id))
      .leftJoin(fileRatings, eq(fileRecords.id, fileRatings.fileId))
      .where(includeDeleted ? undefined : isNull(fileRecords.deletedAt))
      .groupBy(fileRecords.id, users.email)
      .orderBy(desc(fileRecords.updatedAt), desc(fileRecords.createdAt))
  }

  async findById(fileId: bigint, actorId: number = 0) {
    const [file] = await db.select(fileSelect(actorId))
      .from(fileRecords)
      .leftJoin(fileRatings, eq(fileRecords.id, fileRatings.fileId))
      .where(eq(fileRecords.id, fileId))
      .groupBy(fileRecords.id)
      .limit(1)
    return file || null
  }

  async create(data: any) {
    const [created] = await db.insert(fileRecords).values(data).returning(fileSelectBasic)
    return created
  }

  async update(fileId: bigint, data: any) {
    const [updated] = await db.update(fileRecords).set(data).where(eq(fileRecords.id, fileId)).returning(fileSelectBasic)
    return updated
  }

  async softDelete(fileId: bigint) {
    await db.update(fileRecords).set({ deletedAt: new Date() }).where(eq(fileRecords.id, fileId))
    return { success: true }
  }


  async createShare(data: any) {
    const [share] = await db
      .insert(fileShares)
      .values(data)
      .onConflictDoUpdate({
        target: [fileShares.fileId, fileShares.userId],
        set: { permission: data.permission },
      })
      .returning()
    return share
  }

  async deleteShare(fileId: bigint, userId: bigint) {
    await db.delete(fileShares).where(and(eq(fileShares.fileId, fileId), eq(fileShares.userId, userId)))
    return { success: true }
  }

  async findUserByEmail(email: string) {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    return user || null
  }

  async setVote(fileId: bigint, userId: bigint, vote: 'LIKE' | 'DISLIKE' | null) {
    if (vote === null) {
      await db.delete(fileRatings).where(and(eq(fileRatings.fileId, fileId), eq(fileRatings.userId, userId)))
    } else {
      await db.insert(fileRatings).values({
        fileId,
        userId,
        vote
      }).onConflictDoUpdate({
        target: [fileRatings.fileId, fileRatings.userId],
        set: { vote }
      })
    }
  }
}

export const filesRepository = new FilesRepository()
