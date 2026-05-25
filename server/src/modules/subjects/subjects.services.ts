import { subjectsRepository } from './subjects.repository'
import { AppError } from '../../middleware/error-handler'
import { asNumberId, toPaginatedPayload, asBigInt } from '../../utils'
import { fileRecords, tasks, events, lessons, studyPlans, studyPlanCollaborators, subjects, users } from '../../db/schema'
import { db } from '../../db/client'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { tags, subjectTags } from '../../db/schema'
export class SubjectsService {
  async getSubjects(actor: { id: number, role: string }, filters: {
    pagination: any
    includeDeleted?: boolean
    studyPlanId?: bigint | null
  }) {
    const rows = await subjectsRepository.findAll(actor, filters)
    
    const subjectIds = rows.map(r => r.id)
    const tagsBySubjectId: Record<string, any[]> = {}
    
    if (subjectIds.length > 0) {
      const allTags = await db.select({
        subjectId: subjectTags.subjectId,
        id: tags.id,
        name: tags.name,
        color: tags.color,
        isSystem: tags.isSystem,
      })
      .from(subjectTags)
      .innerJoin(tags, eq(subjectTags.tagId, tags.id))
      .where(inArray(subjectTags.subjectId, subjectIds))

      for (const t of allTags) {
        const sId = t.subjectId.toString()
        if (!tagsBySubjectId[sId]) tagsBySubjectId[sId] = []
        tagsBySubjectId[sId].push({ id: Number(t.id), name: t.name, color: t.color, isSystem: t.isSystem })
      }
    }
    
    const mappedSubjects = await Promise.all(rows.map(async (subject) => ({
      id: Number(subject.id),
      userId: asNumberId(subject.userId),
      studyPlanId: asNumberId(subject.studyPlanId),
      name: subject.name,
      teacher: subject.teacher,
      code: subject.code,
      isShared: subject.isShared,
      archived: subject.isArchived,
      deletedAt: subject.deletedAt ? subject.deletedAt.toISOString() : null,
      tags: tagsBySubjectId[subject.id.toString()] || [],
      files: await subjectsRepository.countRows(fileRecords, subject.id),
      notes: await subjectsRepository.countRows(lessons, subject.id),
      createdAt: subject.createdAt.toISOString(),
      updatedAt: subject.updatedAt.toISOString(),
    })))

    if (!filters.pagination.enabled) {
      return mappedSubjects
    }

    return {
      ...toPaginatedPayload(mappedSubjects, filters.pagination.limit),
      limit: filters.pagination.limit,
    }
  }

  async createSubject(actor: { id: number, role: string }, data: {
    name: string
    teacher?: string | null
    code?: string | null
    studyPlanId?: number | null
    isShared?: boolean
    tagIds?: number[]
  }) {
    const parsedStudyPlanId = asBigInt(data.studyPlanId)
    let ownerUserId = BigInt(actor.id)

    if (parsedStudyPlanId) {
      const [plan] = await db.select({ id: studyPlans.id, userId: studyPlans.userId }).from(studyPlans).where(eq(studyPlans.id, parsedStudyPlanId)).limit(1)
      if (!plan) {
        throw new AppError('Studijni plan nebyl nalezen.', 404)
      }

      const [collaborator] = await db
        .select({ role: studyPlanCollaborators.role })
        .from(studyPlanCollaborators)
        .where(and(eq(studyPlanCollaborators.studyPlanId, parsedStudyPlanId), eq(studyPlanCollaborators.userId, BigInt(actor.id))))
        .limit(1)

      const canCreateInPlan =
        actor.role === 'ADMIN' ||
        plan.userId === BigInt(actor.id) ||
        collaborator?.role === 'CONTRIBUTOR'

      if (!canCreateInPlan) {
        throw new AppError('Nemate opravneni pridavat predmety do tohoto planu.', 403)
      }

      ownerUserId = plan.userId
    }

    const created = await subjectsRepository.create({
      userId: ownerUserId,
      studyPlanId: parsedStudyPlanId,
      name: data.name,
      teacher: data.teacher,
      code: data.code,
      isShared: data.isShared,
    })

    if (data.tagIds && data.tagIds.length > 0) {
      const toInsert = data.tagIds.map(tid => ({ subjectId: created.id, tagId: BigInt(tid) }))
      await db.insert(subjectTags).values(toInsert).onConflictDoNothing()
    }

    return {
      id: Number(created.id),
      userId: Number(created.userId),
      studyPlanId: asNumberId(created.studyPlanId),
      name: created.name,
      teacher: created.teacher,
      code: created.code,
      isShared: created.isShared,
      archived: created.isArchived,
      deletedAt: null,
      tags: [], // Tags can be fetched later or mapped if needed
    }
  }

  async updateSubject(subjectId: bigint, actor: { id: number, role: string }, data: any) {
    const existing = await subjectsRepository.findById(subjectId)
    if (!existing) {
      throw new AppError('Predmet nebyl nalezen.', 404)
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      throw new AppError('Nemate opravneni upravit tento predmet.', 403)
    }

    const updated = await subjectsRepository.update(subjectId, {
      name: data.name,
      teacher: data.teacher,
      code: data.code,
      studyPlanId: data.studyPlanId !== undefined ? asBigInt(data.studyPlanId) : undefined,
      isShared: data.isShared,
      isArchived: data.archived,
    })

    if (data.tagIds !== undefined) {
      // replace tags
      await db.delete(subjectTags).where(eq(subjectTags.subjectId, subjectId))
      if (data.tagIds.length > 0) {
        const toInsert = data.tagIds.map((tid: number) => ({ subjectId, tagId: BigInt(tid) }))
        await db.insert(subjectTags).values(toInsert).onConflictDoNothing()
      }
    }

    return {
      id: Number(updated.id),
      userId: asNumberId(updated.userId),
      studyPlanId: asNumberId(updated.studyPlanId),
      name: updated.name,
      teacher: updated.teacher,
      code: updated.code,
      isShared: updated.isShared,
      archived: updated.isArchived,
      deletedAt: updated.deletedAt ? updated.deletedAt.toISOString() : null,
      tags: [], // Client will refetch
    }
  }

  async deleteSubject(subjectId: bigint, actor: { id: number, role: string }) {
    const existing = await subjectsRepository.findById(subjectId)
    if (!existing) {
      throw new AppError('Predmet nebyl nalezen.', 404)
    }

    // Owner or admin can always delete
    const isOwner = existing.userId === BigInt(actor.id)
    if (!isOwner && actor.role !== 'ADMIN') {
      // Check if actor is a CONTRIBUTOR on the subject's study plan
      if (existing.studyPlanId) {
        const [collaborator] = await db
          .select({ role: studyPlanCollaborators.role })
          .from(studyPlanCollaborators)
          .where(and(
            eq(studyPlanCollaborators.studyPlanId, existing.studyPlanId),
            eq(studyPlanCollaborators.userId, BigInt(actor.id))
          ))
          .limit(1)

        if (collaborator?.role !== 'CONTRIBUTOR') {
          throw new AppError('Nemate opravneni smazat tento predmet.', 403)
        }
      } else {
        throw new AppError('Nemate opravneni smazat tento predmet.', 403)
      }
    }

    return subjectsRepository.delete(subjectId)
  }

  async shareSubject(subjectId: bigint, actor: { id: number, role: string }, data: { email: string }) {
    // Load the subject to share
    const [existing] = await db
      .select({
        id: subjects.id,
        userId: subjects.userId,
        name: subjects.name,
        teacher: subjects.teacher,
        code: subjects.code,
        isShared: subjects.isShared,
      })
      .from(subjects)
      .where(eq(subjects.id, subjectId))
      .limit(1)

    if (!existing) throw new AppError('Předmět nebyl nalezen.', 404)

    const canShare = actor.role === 'ADMIN' || existing.userId === BigInt(actor.id)
    if (!canShare) throw new AppError('Nemáte oprávnění sdílet tento předmět.', 403)

    // Find recipient
    const [recipient] = await db
      .select({ id: users.id, email: users.email, fullName: users.fullName })
      .from(users)
      .where(and(eq(users.email, data.email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1)

    if (!recipient) throw new AppError('Uživatel s daným e-mailem nebyl nalezen.', 404)
    if (recipient.id === existing.userId) throw new AppError('Nelze sdílet předmět sám sobě.', 400)

    // Check if recipient already has a subject with the same code
    const [conflict] = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(and(eq(subjects.userId, recipient.id), eq(subjects.code, existing.code), isNull(subjects.deletedAt)))
      .limit(1)

    // Build a unique code for the recipient (append suffix if conflict)
    let recipientCode = existing.code
    if (conflict) {
      recipientCode = `${existing.code}-${Date.now().toString().slice(-4)}`
    }

    // Create a copy of the subject for the recipient with no study plan (Nezařazené)
    const [created] = await db
      .insert(subjects)
      .values({
        userId: recipient.id,
        studyPlanId: null,
        name: existing.name,
        teacher: existing.teacher,
        code: recipientCode,
        isShared: false,
      })
      .returning({ id: subjects.id })

    const newSubjectId = created.id

    // Copy file records — share same S3 key/URL, no physical file copy needed
    const originalFiles = await db
      .select({
        name: fileRecords.name,
        size: fileRecords.size,
        addedLabel: fileRecords.addedLabel,
        fileKey: fileRecords.fileKey,
        fileUrl: fileRecords.fileUrl,
      })
      .from(fileRecords)
      .where(and(eq(fileRecords.subjectId, subjectId), isNull(fileRecords.deletedAt)))

    if (originalFiles.length > 0) {
      await db.insert(fileRecords).values(
        originalFiles.map((f) => ({
          userId: recipient.id,
          subjectId: newSubjectId,
          name: f.name,
          size: f.size,
          addedLabel: f.addedLabel,
          fileKey: f.fileKey,
          fileUrl: f.fileUrl,
          isShared: false,
        }))
      )
    }

    // Copy lessons (notes)
    const originalLessons = await db
      .select({
        title: lessons.title,
        content: lessons.content,
        orderIndex: lessons.orderIndex,
      })
      .from(lessons)
      .where(and(eq(lessons.subjectId, subjectId), isNull(lessons.deletedAt)))

    if (originalLessons.length > 0) {
      await db.insert(lessons).values(
        originalLessons.map((l) => ({
          userId: recipient.id,
          subjectId: newSubjectId,
          title: l.title,
          content: l.content,
          orderIndex: l.orderIndex,
          isShared: false,
        }))
      )
    }

    return {
      recipientEmail: recipient.email,
      recipientFullName: recipient.fullName,
      newSubjectId: Number(newSubjectId),
      copiedFiles: originalFiles.length,
      copiedLessons: originalLessons.length,
    }
  }
}

export const subjectsService = new SubjectsService()
