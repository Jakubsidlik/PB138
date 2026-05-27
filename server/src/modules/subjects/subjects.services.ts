import { subjectsRepository } from './subjects.repository'
import { AppError } from '../../middleware/error-handler'
import { asNumberId, toPaginatedPayload, asBigInt } from '../../utils'
import { fileRecords, tasks, events, lessons, studyPlans, studyPlanCollaborators, subjects, users, subjectShares } from '../../db/schema'
import { db } from '../../db/client'
import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import { tags, subjectTags } from '../../db/schema'
import { Resend } from 'resend'
import { env } from '../../env'
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
    
        const mappedSubjects = await Promise.all(rows.map(async (subject: any) => {
      const studyPlanOwnerId = subject.studyPlanOwnerId
      const studyPlanIsShared = subject.studyPlanIsShared
      const collaboratorId = subject.collaboratorId

      const hasPlanAccess =
        actor.role === 'ADMIN' ||
        !subject.studyPlanId ||
        (studyPlanOwnerId !== null && studyPlanOwnerId !== undefined && BigInt(studyPlanOwnerId) === BigInt(actor.id)) ||
        studyPlanIsShared === true ||
        collaboratorId !== null

      const finalStudyPlanId = hasPlanAccess ? subject.studyPlanId : null

      return {
        id: Number(subject.id),
        userId: asNumberId(subject.userId),
        studyPlanId: asNumberId(finalStudyPlanId),
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
      }
    }))

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
      tags: [],
    }
  }

  async updateSubject(subjectId: bigint, actor: { id: number, role: string }, data: any) {
    const existing = await subjectsRepository.findById(subjectId)
    if (!existing) {
      throw new AppError('Predmet nebyl nalezen.', 404)
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      const [share] = await db
        .select({ id: subjectShares.id })
        .from(subjectShares)
        .where(and(eq(subjectShares.subjectId, subjectId), eq(subjectShares.userId, BigInt(actor.id))))
        .limit(1)

      let isCollaborator = false
      if (existing.studyPlanId) {
        const [collab] = await db
          .select({ id: studyPlanCollaborators.id })
          .from(studyPlanCollaborators)
          .where(and(
            eq(studyPlanCollaborators.studyPlanId, existing.studyPlanId),
            eq(studyPlanCollaborators.userId, BigInt(actor.id))
          ))
          .limit(1)
        if (collab) {
          isCollaborator = true
        }
      }

      if ((share || isCollaborator) && data.archived !== undefined) {
        await db.insert(subjectShares)
          .values({
            subjectId,
            userId: BigInt(actor.id),
            isArchived: data.archived,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [subjectShares.subjectId, subjectShares.userId],
            set: {
              isArchived: data.archived,
              updatedAt: new Date(),
            },
          })

        return {
          id: Number(existing.id),
          userId: asNumberId(existing.userId),
          studyPlanId: asNumberId(existing.studyPlanId),
          name: data.name ?? existing.name,
          teacher: data.teacher ?? existing.teacher,
          code: data.code ?? existing.code,
          isShared: true,
          archived: data.archived,
          deletedAt: null,
          tags: [],
        }
      }

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
      tags: [],
    }
  }

  async deleteSubject(subjectId: bigint, actor: { id: number, role: string }) {
    const existing = await subjectsRepository.findById(subjectId)
    if (!existing) {
      throw new AppError('Predmet nebyl nalezen.', 404)
    }

    const isOwner = existing.userId === BigInt(actor.id)
    if (!isOwner && actor.role !== 'ADMIN') {
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

  async shareSubject(subjectId: bigint, actor: { id: number, role: string, fullName?: string, email?: string }, data: { email: string }) {
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

    const [recipient] = await db
      .select({ id: users.id, email: users.email, fullName: users.fullName })
      .from(users)
      .where(and(eq(users.email, data.email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1)

    let recipientUser = recipient
    let isNewUser = false
    if (!recipientUser) {
      const [newDbUser] = await db
        .insert(users)
        .values({
          fullName: data.email.split('@')[0],
          email: data.email.toLowerCase(),
          role: 'PUBLIC',
        })
        .returning({ id: users.id, email: users.email, fullName: users.fullName })
      recipientUser = newDbUser
      isNewUser = true
    }

    if (recipientUser.id === existing.userId) throw new AppError('Nelze sdílet předmět sám sobě.', 400)

    const [alreadyShared] = await db
      .select({ id: subjectShares.id })
      .from(subjectShares)
      .where(and(eq(subjectShares.subjectId, subjectId), eq(subjectShares.userId, recipientUser.id)))
      .limit(1)

    if (alreadyShared) {
      throw new AppError('Tento předmět je již s tímto uživatelem sdílen.', 400)
    }

    await db.insert(subjectShares).values({
      subjectId,
      userId: recipientUser.id,
      isArchived: false,
    })

    await db.update(subjects).set({ isShared: true }).where(eq(subjects.id, subjectId))

    if (isNewUser && env.RESEND_API_KEY) {
      try {
        const resend = new Resend(env.RESEND_API_KEY)
        const registerUrl = 'http://localhost:5173/login?mode=register'
        await resend.emails.send({
          from: 'Planner <onboarding@resend.dev>',
          to: data.email,
          subject: `Pozvánka do aplikace Planner`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #3b82f6;">Pozvánka do aplikace Planner!</h2>
              <p>Ahoj,</p>
              <p>Uživatel <strong>${actor.fullName || actor.email}</strong> s tebou chce sdílet předmět <strong>${existing.name}</strong> v aplikaci Planner.</p>
              <p>Tento e-mail k dané adrese nemá založený účet. Pro zobrazení sdíleného obsahu se prosím nejprve zaregistruj.</p>
              <div style="margin: 30px 0;">
                <a href="${registerUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Zaregistrovat se</a>
              </div>
              <p style="color: #666; font-size: 14px;">Tento e-mail byl automaticky vygenerován aplikací Planner.</p>
            </div>
          `
        })
      } catch (err) {
        console.error('Nepodařilo se odeslat pozvánku předmětu:', err)
      }
    }

    const [filesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(fileRecords).where(and(eq(fileRecords.subjectId, subjectId), isNull(fileRecords.deletedAt)))
    const [notesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(lessons).where(and(eq(lessons.subjectId, subjectId), isNull(lessons.deletedAt)))

    return {
      recipientEmail: recipientUser.email,
      recipientFullName: recipientUser.fullName,
      newSubjectId: Number(subjectId),
      copiedFiles: filesCount?.count ?? 0,
      copiedLessons: notesCount?.count ?? 0,
    }
  }
}

export const subjectsService = new SubjectsService()
