import express from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { subjectSchema, updateSubjectSchema } from './schemas.js'
import { asBigInt, asNumberId, parseCursorPagination, toPaginatedPayload } from './utils.js'
import { getActorFromRequest, isPublicActor, requireRegisteredActor } from './auth.js'

export const subjectsRouter = express.Router()

subjectsRouter.get('/', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const pagination = parseCursorPagination(req, { defaultLimit: 20, maxLimit: 100 })
    const includeDeleted = req.query.includeDeleted === 'true'
    const studyPlanId = asBigInt(req.query.studyPlanId)

    const where: Prisma.SubjectWhereInput = isPublicActor(actor)
      ? {
          deletedAt: includeDeleted ? undefined : null,
          studyPlanId: studyPlanId ?? undefined,
          OR: [{ isShared: true }, { studyPlan: { isShared: true } }],
        }
      : {
          deletedAt: includeDeleted ? undefined : null,
          studyPlanId: studyPlanId ?? undefined,
          OR: [
            { userId: BigInt(actor.id) },
            { isShared: true },
            { studyPlan: { isShared: true } },
            { studyPlan: { collaborators: { some: { userId: BigInt(actor.id) } } } },
          ],
        }

    const countInclude = {
      _count: {
        select: {
          files: true,
          tasks: true,
          events: true,
          lessons: true,
        },
      },
    }

    const subjects = pagination.enabled
      ? await prisma.subject.findMany({
          take: pagination.limit + 1,
          skip: pagination.cursor ? 1 : 0,
          cursor: pagination.cursor ? { id: pagination.cursor } : undefined,
          orderBy: { id: 'asc' },
          where,
          include: countInclude,
        })
      : await prisma.subject.findMany({
          orderBy: { createdAt: 'asc' },
          where,
          include: countInclude,
        })

    const mappedSubjects = subjects.map((subject) => ({
      id: Number(subject.id),
      userId: asNumberId(subject.userId),
      studyPlanId: asNumberId(subject.studyPlanId),
      name: subject.name,
      teacher: subject.teacher,
      code: subject.code,
      isShared: subject.isShared,
      archived: Boolean(subject.deletedAt),
      deletedAt: subject.deletedAt ? subject.deletedAt.toISOString() : null,
      files: subject._count.files,
      tasks: subject._count.tasks,
      events: subject._count.events,
      notes: subject._count.lessons,
      createdAt: subject.createdAt.toISOString(),
      updatedAt: subject.updatedAt.toISOString(),
    }))

    if (!pagination.enabled) {
      res.json(mappedSubjects)
      return
    }

    const paginated = toPaginatedPayload(mappedSubjects, pagination.limit)
    res.json({
      ...paginated,
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

subjectsRouter.post('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const parsed = subjectSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const { name, teacher, code, studyPlanId, isShared } = parsed.data

    const parsedStudyPlanId = asBigInt(studyPlanId)
    let ownerUserId = BigInt(actor.id)

    if (parsedStudyPlanId) {
      const plan = await prisma.studyPlan.findUnique({ where: { id: parsedStudyPlanId } })
      if (!plan) {
        res.status(404).json({ error: 'Studijni plan nebyl nalezen.' })
        return
      }

      const collaborator = await prisma.studyPlanCollaborator.findFirst({
        where: { studyPlanId: parsedStudyPlanId, userId: BigInt(actor.id) },
      })

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

    const created = await prisma.subject.create({
      data: {
        userId: ownerUserId,
        studyPlanId: parsedStudyPlanId,
        name,
        teacher,
        code,
        isShared,
      },
    })

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
    if (!actor) {
      return
    }

    const subjectId = asBigInt(req.params.id)

    if (!subjectId) {
      res.status(400).json({ error: 'Neplatne ID predmetu.' })
      return
    }

    const existing = await prisma.subject.findUnique({ where: { id: subjectId } })
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

    const updated = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name,
        teacher,
        code,
        studyPlanId: studyPlanId !== undefined ? asBigInt(studyPlanId) : undefined,
        isShared,
        deletedAt: archived !== undefined ? (archived ? new Date() : null) : undefined,
      },
    })

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
    if (!actor) {
      return
    }

    const subjectId = asBigInt(req.params.id)
    if (!subjectId) {
      res.status(400).json({ error: 'Neplatne ID predmetu.' })
      return
    }

    const existing = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!existing) {
      res.status(404).json({ error: 'Predmet nebyl nalezen.' })
      return
    }

    if (existing.userId !== BigInt(actor.id) && actor.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate opravneni smazat tento predmet.' })
      return
    }

    const deletedAt = new Date()

    await prisma.$transaction([
      prisma.subject.update({ where: { id: subjectId }, data: { deletedAt } }),
      prisma.task.updateMany({ where: { subjectId, deletedAt: null }, data: { deletedAt } }),
      prisma.fileRecord.updateMany({ where: { subjectId, deletedAt: null }, data: { deletedAt } }),
      prisma.lesson.updateMany({ where: { subjectId, deletedAt: null }, data: { deletedAt } }),
      prisma.event.updateMany({ where: { subjectId, deletedAt: null }, data: { deletedAt } }),
    ])

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})