import { and, asc, desc, eq, exists, gt, inArray, isNull, or, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { fileRecords, fileComments, fileShares, users } from '../db/schema.js'
import { asBigInt } from '../utils.js'

const fileSelect = {
  id: fileRecords.id,
  userId: fileRecords.userId,
  subjectId: fileRecords.subjectId,
  lessonId: fileRecords.lessonId,
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
    lessonId?: bigint | null
    shared?: string
    includeDeleted?: boolean
  }) {
    const { pagination, subjectId, lessonId, shared, includeDeleted } = filters

    const baseConditions = [
      subjectId ? eq(fileRecords.subjectId, subjectId) : undefined,
      lessonId ? eq(fileRecords.lessonId, lessonId) : undefined,
      includeDeleted ? undefined : isNull(fileRecords.deletedAt),
      pagination.enabled && pagination.cursor ? gt(fileRecords.id, pagination.cursor) : undefined,
    ].filter(Boolean)

    const explicitShares = actor.role !== 'PUBLIC'
      ? db.select({ fileId: fileShares.fileId }).from(fileShares).where(eq(fileShares.userId, BigInt(actor.id)))
      : undefined

    const visibility = actor.role === 'PUBLIC'
      ? eq(fileRecords.isShared, true)
      : or(
          eq(fileRecords.userId, BigInt(actor.id)),
          eq(fileRecords.isShared, true),
          explicitShares ? sql`${fileRecords.id} IN ${explicitShares}` : undefined
        )

    const sharedFilter = shared === 'true' 
      ? or(eq(fileRecords.isShared, true), explicitShares ? sql`${fileRecords.id} IN ${explicitShares}` : undefined) 
      : shared === 'false' 
        ? eq(fileRecords.isShared, false)
        : undefined
        
    const whereClause = and(...([visibility, sharedFilter, ...baseConditions] as any).filter(Boolean))

    const query = db.select(fileSelect).from(fileRecords)
    const rows = pagination.enabled
      ? await query.where(whereClause).orderBy(asc(fileRecords.id)).limit(pagination.limit + 1).offset(pagination.cursor ? 1 : 0)
      : await query.where(whereClause).orderBy(desc(fileRecords.createdAt))

    return rows
  }

  async findPublic() {
    return db
      .select(fileSelect)
      .from(fileRecords)
      .where(and(eq(fileRecords.isShared, true), isNull(fileRecords.deletedAt)))
      .orderBy(desc(fileRecords.updatedAt), desc(fileRecords.createdAt))
  }

  async findAdminAll(includeDeleted: boolean) {
    return db
      .select(fileSelect)
      .from(fileRecords)
      .where(includeDeleted ? undefined : isNull(fileRecords.deletedAt))
      .orderBy(desc(fileRecords.updatedAt), desc(fileRecords.createdAt))
  }

  async findById(fileId: bigint) {
    const [file] = await db.select(fileSelect).from(fileRecords).where(eq(fileRecords.id, fileId)).limit(1)
    return file || null
  }

  async create(data: any) {
    const [created] = await db.insert(fileRecords).values(data).returning(fileSelect)
    return created
  }

  async update(fileId: bigint, data: any) {
    const [updated] = await db.update(fileRecords).set(data).where(eq(fileRecords.id, fileId)).returning(fileSelect)
    return updated
  }

  async softDelete(fileId: bigint) {
    await db.update(fileRecords).set({ deletedAt: new Date() }).where(eq(fileRecords.id, fileId))
    return { success: true }
  }

  async findComments(fileId: bigint) {
    return db.select().from(fileComments).where(eq(fileComments.fileId, fileId)).orderBy(asc(fileComments.createdAt))
  }

  async createComment(data: any) {
    const [created] = await db.insert(fileComments).values(data).returning()
    return created
  }

  async updateComment(commentId: bigint, data: any) {
    const [updated] = await db.update(fileComments).set(data).where(eq(fileComments.id, commentId)).returning()
    return updated
  }

  async deleteComment(commentId: bigint) {
    await db.delete(fileComments).where(eq(fileComments.id, commentId))
    return { success: true }
  }

  async findCommentWithFileUser(commentId: bigint) {
    const [existing] = await db
      .select({
        id: fileComments.id,
        userId: fileComments.userId,
        fileUserId: fileRecords.userId,
      })
      .from(fileComments)
      .innerJoin(fileRecords, eq(fileComments.fileId, fileRecords.id))
      .where(eq(fileComments.id, commentId))
      .limit(1)
    return existing || null
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
}

export const filesRepository = new FilesRepository()
