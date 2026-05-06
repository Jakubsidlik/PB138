import express from 'express'
import { and, asc, count, eq, exists, gt, inArray, isNull, or, sql } from 'drizzle-orm'

import { db } from './db/client.js'
import { events, fileRecords, lessons, studyPlanCollaborators, studyPlans, subjects, tasks } from './db/schema.js'
import { subjectSchema, updateSubjectSchema } from './schemas.js'
import { asBigInt, asNumberId, parseCursorPagination, toPaginatedPayload } from './utils.js'
import { getActorFromRequest, isPublicActor, requireRegisteredActor } from './auth.js'

export const subjectsRouter: express.Router = express.Router()

const subjectSelect = {
  id: subjects.id,
  userId: subjects.userId,
  studyPlanId: subjects.studyPlanId,
  name: subjects.name,
  teacher: subjects.teacher,
  code: subjects.code,
  isShared: subjects.isShared,
  deletedAt: subjects.deletedAt,
  createdAt: subjects.createdAt,
  updatedAt: subjects.updatedAt,
}

const countRows = async <T extends { subjectId: bigint | null }>(table: T extends never ? never : any, subjectId: bigint) => {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(table).where(eq(table.subjectId, subjectId))
  return row?.count ?? 0
}

subjectsRouter.get('/', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const pagination = parseCursorPagination(req, { defaultLimit: 20, maxLimit: 100 })
    const includeDeleted = req.query.includeDeleted === 'true'
    const studyPlanId = asBigInt(req.query.studyPlanId)

    const visibility = isPublicActor(actor)
      ? or(eq(subjects.isShared, true), eq(studyPlans.isShared, true))
      : or(
          eq(subjects.userId, BigInt(actor.id)),
          eq(subjects.isShared, true),
          eq(studyPlans.isShared, true),
          exists(
            db
              .select({ id: studyPlanCollaborators.id })
              .from(studyPlanCollaborators)
              .where(and(eq(studyPlanCollaborators.studyPlanId, subjects.studyPlanId), eq(studyPlanCollaborators.userId, BigInt(actor.id)))),
          ),
        )

    const whereParts = [
      includeDeleted ? undefined : isNull(subjects.deletedAt),
      studyPlanId ? eq(subjects.studyPlanId, studyPlanId) : undefined,
      visibility,
      pagination.enabled && pagination.cursor ? gt(subjects.id, pagination.cursor) : undefined,
    ].filter(Boolean)

    const whereClause = whereParts.length > 0 ? and(...(whereParts as Parameters<typeof and>)) : undefined

    const query = db.select(subjectSelect).from(subjects).leftJoin(studyPlans, eq(subjects.studyPlanId, studyPlans.id))
    const rows = pagination.enabled
      ? await query.where(whereClause).orderBy(asc(subjects.id)).limit(pagination.limit + 1).offset(pagination.cursor ? 1 : 0)
      : await query.where(whereClause).orderBy(asc(subjects.createdAt))

    const mappedSubjects = await Promise.all(rows.map(async (subject) => ({
      id: Number(subject.id),
      userId: asNumberId(subject.userId),
      studyPlanId: asNumberId(subject.studyPlanId),
      name: subject.name,
      teacher: subject.teacher,
      code: subject.code,
      isShared: subject.isShared,
      archived: Boolean(subject.deletedAt),
      deletedAt: subject.deletedAt ? subject.deletedAt.toISOString() : null,
      files: await countRows(fileRecords, subject.id),
      tasks: await countRows(tasks, subject.id),
      events: await countRows(events, subject.id),
      notes: await countRows(lessons, subject.id),
      createdAt: subject.createdAt.toISOString(),
      updatedAt: subject.updatedAt.toISOString(),
    })))

    if (!pagination.enabled) {
      res.json(mappedSubjects)
      return
    }

    res.json({
      ...toPaginatedPayload(mappedSubjects, pagination.limit),
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

subjectsRouter.post('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const parsed = subjectSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const { name, teacher, code, studyPlanId, isShared } = parsed.data

    const parsedStudyPlanId = asBigInt(studyPlanId)
    let ownerUserId = BigInt(actor.id)

    if (parsedStudyPlanId) {
      const [plan] = await db.select({ id: studyPlans.id, userId: studyPlans.userId }).from(studyPlans).where(eq(studyPlans.id, parsedStudyPlanId)).limit(1)
      if (!plan) {
        res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
        return
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
        res.status(403).json({ error: 'Nemate opravneni pridavat predmety do tohoto planu.' })
        return
      }

      ownerUserId = plan.userId
    }

    const [created] = await db.insert(subjects).values({
      userId: ownerUserId,
      studyPlanId: parsedStudyPlanId,
      name,
      teacher,
      code,
      isShared,
    }).returning(subjectSelect)

    res.status(201).json({
      id: Number(created.id),
      userId: Number(created.userId),
      studyPlanId: asNumberId(created.studyPlanId),
      name: created.name,
      teacher: created.teacher,
      code: created.code,
      isShared: created.isShared,
      archived: false,
      deletedAt: null,
    })
  } catch (error) {
    next(error)
  }
})

subjectsRouter.put('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const subjectId = asBigInt(req.params.id)
    if (!subjectId) {
      res.status(400).json({ error: 'Neplatne ID predmetu.' })
      return
    }

    const [existing] = await db.select({ id: subjects.id, userId: subjects.userId }).from(subjects).where(eq(subjects.id, subjectId)).limit(1)
    if (!existing) {
      res.status(404).json({ error: 'Predmet nebyl nalezen.' })
      return
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni upravit tento predmet.' })
      return
    }

    const parsed = updateSubjectSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const { name, teacher, code, archived, studyPlanId, isShared } = parsed.data

    const [updated] = await db
      .update(subjects)
      .set({
        name,
        teacher,
        code,
        studyPlanId: studyPlanId !== undefined ? asBigInt(studyPlanId) : undefined,
        isShared,
        deletedAt: archived !== undefined ? (archived ? new Date() : null) : undefined,
      })
      .where(eq(subjects.id, subjectId))
      .returning(subjectSelect)

    res.json({
      id: Number(updated.id),
      userId: asNumberId(updated.userId),
      studyPlanId: asNumberId(updated.studyPlanId),
      name: updated.name,
      teacher: updated.teacher,
      code: updated.code,
      isShared: updated.isShared,
      archived: Boolean(updated.deletedAt),
      deletedAt: updated.deletedAt ? updated.deletedAt.toISOString() : null,
    })
  } catch (error) {
    next(error)
  }
})

subjectsRouter.delete('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const subjectId = asBigInt(req.params.id)
    if (!subjectId) {
      res.status(400).json({ error: 'Neplatne ID predmetu.' })
      return
    }

    const [existing] = await db.select({ id: subjects.id, userId: subjects.userId }).from(subjects).where(eq(subjects.id, subjectId)).limit(1)
    if (!existing) {
      res.status(404).json({ error: 'Predmet nebyl nalezen.' })
      return
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni smazat tento predmet.' })
      return
    }

    const deletedAt = new Date()

    await db.transaction(async (transaction) => {
      await transaction.update(subjects).set({ deletedAt }).where(eq(subjects.id, subjectId))
      await transaction.update(tasks).set({ deletedAt }).where(eq(tasks.subjectId, subjectId))
      await transaction.update(fileRecords).set({ deletedAt }).where(eq(fileRecords.subjectId, subjectId))
      await transaction.update(lessons).set({ deletedAt }).where(eq(lessons.subjectId, subjectId))
      await transaction.update(events).set({ deletedAt }).where(eq(events.subjectId, subjectId))
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})