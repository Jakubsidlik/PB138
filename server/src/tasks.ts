import express from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { taskSchema, updateTaskSchema, bulkTasksSchema } from './schemas.js'
import { asBigInt, parseCursorPagination, parseOptionalDate, parseTaskPriority, mapTask, toPaginatedPayload } from './utils.js'
import { requireRegisteredActor } from './auth.js'

export const tasksRouter = express.Router()

tasksRouter.get('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const pagination = parseCursorPagination(req, { defaultLimit: 30, maxLimit: 200 })
    const subjectId = asBigInt(req.query.subjectId)
    const studyPlanId = asBigInt(req.query.studyPlanId)
    const includeDeleted = req.query.includeDeleted === 'true'
    const doneFilter = req.query.done
    const favoriteFilter = req.query.favorite
    const tagFilter = typeof req.query.tag === 'string' ? req.query.tag.trim() : ''
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const deadlineFrom = parseOptionalDate(req.query.deadlineFrom)
    const deadlineTo = parseOptionalDate(req.query.deadlineTo)

    const findArgs: Prisma.TaskFindManyArgs = {
      orderBy: { createdAt: 'asc' },
      where: {
        userId: BigInt(actor.id),
        subjectId: subjectId ?? undefined,
        studyPlanId: studyPlanId ?? undefined,
        done: doneFilter === 'true' ? true : doneFilter === 'false' ? false : undefined,
        favorite: favoriteFilter === 'true' ? true : favoriteFilter === 'false' ? false : undefined,
        tag: tagFilter ? tagFilter : undefined,
        title: search ? { contains: search, mode: 'insensitive' } : undefined,
        deadline:
          deadlineFrom || deadlineTo
            ? {
                gte: deadlineFrom ?? undefined,
                lte: deadlineTo ?? undefined,
              }
            : undefined,
        deletedAt: includeDeleted ? undefined : null,
      },
    }

    if (pagination.enabled) {
      findArgs.take = pagination.limit + 1
      findArgs.skip = pagination.cursor ? 1 : 0
      findArgs.cursor = pagination.cursor ? { id: pagination.cursor } : undefined
      findArgs.orderBy = { id: 'asc' }
    }

    const tasks = await prisma.task.findMany(findArgs)
    const mappedTasks = tasks.map(mapTask)

    if (!pagination.enabled) {
      res.json(mappedTasks)
      return
    }

    const paginated = toPaginatedPayload(mappedTasks, pagination.limit)
    res.json({
      ...paginated,
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

tasksRouter.post('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const parsed = taskSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const { title, done, subjectId, studyPlanId, favorite, tag, priority, deadline } = parsed.data

    const parsedDeadline = parseOptionalDate(deadline)
    if (deadline !== undefined && parsedDeadline === undefined) {
      res.status(400).json({ error: 'Neplatny format deadline.' })
      return
    }

    const parsedTag =
      tag !== undefined
        ? tag || null
        : priority !== undefined
          ? parseTaskPriority(priority) ?? null
          : null

    const created = await prisma.task.create({
      data: {
        userId: BigInt(actor.id),
        title,
        done,
        subjectId: asBigInt(subjectId),
        studyPlanId: asBigInt(studyPlanId),
        favorite,
        tag: parsedTag,
        deadline: parsedDeadline,
      },
    })

    res.status(201).json(mapTask(created))
  } catch (error) {
    next(error)
  }
})

tasksRouter.patch('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const taskId = asBigInt(req.params.id)
    if (!taskId) {
      res.status(400).json({ error: 'Neplatne ID ukolu.' })
      return
    }

    const existing = await prisma.task.findFirst({ where: { id: taskId, userId: BigInt(actor.id) } })
    if (!existing) {
      res.status(404).json({ error: 'Ukol nebyl nalezen.' })
      return
    }

    const parsed = updateTaskSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const { title, done, subjectId, studyPlanId, favorite, tag, priority, deadline } = parsed.data

    const parsedDeadline = parseOptionalDate(deadline)
    if (deadline !== undefined && parsedDeadline === undefined) {
      res.status(400).json({ error: 'Neplatny format deadline.' })
      return
    }

    const parsedTag =
      tag !== undefined
        ? tag || null
        : priority !== undefined
          ? (parseTaskPriority(priority) ?? null)
          : undefined

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        done,
        subjectId: subjectId !== undefined ? asBigInt(subjectId) : undefined,
        studyPlanId: studyPlanId !== undefined ? asBigInt(studyPlanId) : undefined,
        favorite,
        tag: parsedTag,
        deadline: parsedDeadline,
      },
    })

    res.json(mapTask(updated))
  } catch (error) {
    next(error)
  }
})

tasksRouter.delete('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const taskId = asBigInt(req.params.id)
    if (!taskId) {
      res.status(400).json({ error: 'Neplatne ID ukolu.' })
      return
    }

    const existing = await prisma.task.findFirst({ where: { id: taskId, userId: BigInt(actor.id), deletedAt: null } })
    if (!existing) {
      res.status(404).json({ error: 'Ukol nebyl nalezen.' })
      return
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    })

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

tasksRouter.put('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const parsed = bulkTasksSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const typedTasks = parsed.data.tasks

    const existingTasks = await prisma.task.findMany({ where: { userId: BigInt(actor.id), deletedAt: null } })

    const incomingIds = typedTasks.map((task) => BigInt(task.id))
    const incomingIdSet = new Set(incomingIds.map((id) => id.toString()))

    await prisma.$transaction(async (transaction) => {
      const subjectIds = Array.from(new Set(typedTasks.map((t) => t.subjectId).filter((id) => id !== null))) as number[]
      const validSubjects = await transaction.subject.findMany({
        where: { id: { in: subjectIds.map((id) => BigInt(id)) } },
        select: { id: true }
      })
      const validSubjectIds = new Set(validSubjects.map((s) => s.id.toString()))

      for (const task of typedTasks) {
        const taskId = BigInt(task.id)
        let nextSubjectId = asBigInt(task.subjectId)

        if (nextSubjectId !== null && !validSubjectIds.has(nextSubjectId.toString())) {
          nextSubjectId = null
        }

        await transaction.task.upsert({
          where: { id: taskId },
          update: {
            title: task.title,
            done: task.done,
            subjectId: nextSubjectId,
            userId: BigInt(actor.id),
            deletedAt: null,
          },
          create: {
            id: taskId,
            title: task.title,
            done: task.done,
            subjectId: nextSubjectId,
            userId: BigInt(actor.id),
            favorite: false,
            tag: null,
            deletedAt: null,
          },
        })
      }

      const removedTasks = existingTasks.filter((task) => !incomingIdSet.has(task.id.toString()))

      if (removedTasks.length > 0) {
        await transaction.task.updateMany({
          where: {
            id: {
              in: removedTasks.map((task) => task.id),
            },
          },
          data: {
            deletedAt: new Date(),
          },
        })
      }
    })

    const finalTasks = await prisma.task.findMany({
      where: { userId: BigInt(actor.id), deletedAt: null },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ success: true, tasks: finalTasks.map(mapTask) })
  } catch (error) {
    next(error)
  }
})