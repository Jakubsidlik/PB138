import express from 'express'
import { and, asc, eq, gte, gt, ilike, inArray, isNull, lte } from 'drizzle-orm'

import { db } from './db/client.js'
import { tasks, subjects } from './db/schema.js'
import { bulkTasksSchema, taskSchema, updateTaskSchema } from './schemas.js'
import { asBigInt, parseCursorPagination, parseOptionalDate, parseTaskPriority, mapTask, toPaginatedPayload } from './utils.js'
import { requireRegisteredActor } from './auth.js'

export const tasksRouter: express.Router = express.Router()

const taskSelect = {
  id: tasks.id,
  userId: tasks.userId,
  subjectId: tasks.subjectId,
  studyPlanId: tasks.studyPlanId,
  title: tasks.title,
  done: tasks.done,
  favorite: tasks.favorite,
  tag: tasks.tag,
  deadline: tasks.deadline,
  deletedAt: tasks.deletedAt,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
}

tasksRouter.get('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

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

    const whereParts = [
      eq(tasks.userId, BigInt(actor.id)),
      subjectId ? eq(tasks.subjectId, subjectId) : undefined,
      studyPlanId ? eq(tasks.studyPlanId, studyPlanId) : undefined,
      doneFilter === 'true' ? eq(tasks.done, true) : doneFilter === 'false' ? eq(tasks.done, false) : undefined,
      favoriteFilter === 'true' ? eq(tasks.favorite, true) : favoriteFilter === 'false' ? eq(tasks.favorite, false) : undefined,
      tagFilter ? eq(tasks.tag, tagFilter) : undefined,
      search ? ilike(tasks.title, `%${search}%`) : undefined,
      deadlineFrom || deadlineTo
        ? and(
            deadlineFrom ? gte(tasks.deadline, deadlineFrom) : undefined,
            deadlineTo ? lte(tasks.deadline, deadlineTo) : undefined,
          )
        : undefined,
      includeDeleted ? undefined : isNull(tasks.deletedAt),
      pagination.enabled && pagination.cursor ? gt(tasks.id, pagination.cursor) : undefined,
    ].filter(Boolean)

    const whereClause = whereParts.length > 0 ? and(...(whereParts as Parameters<typeof and>)) : undefined

    const query = db.select(taskSelect).from(tasks)
    const rows = pagination.enabled
      ? await query.where(whereClause).orderBy(asc(tasks.id)).limit(pagination.limit + 1).offset(pagination.cursor ? 1 : 0)
      : await query.where(whereClause).orderBy(asc(tasks.createdAt))

    const mappedTasks = rows.map(mapTask)

    if (!pagination.enabled) {
      res.json(mappedTasks)
      return
    }

    res.json({
      ...toPaginatedPayload(mappedTasks, pagination.limit),
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

tasksRouter.post('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

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

    const parsedTag = tag !== undefined ? tag || null : priority !== undefined ? parseTaskPriority(priority) ?? null : null

    const [created] = await db.insert(tasks).values({
      userId: BigInt(actor.id),
      title,
      done,
      subjectId: asBigInt(subjectId),
      studyPlanId: asBigInt(studyPlanId),
      favorite,
      tag: parsedTag,
      deadline: parsedDeadline ?? null,
    }).returning(taskSelect)

    res.status(201).json(mapTask(created))
  } catch (error) {
    next(error)
  }
})

tasksRouter.patch('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const taskId = asBigInt(req.params.id)
    if (!taskId) {
      res.status(400).json({ error: 'Neplatne ID ukolu.' })
      return
    }

    const [existing] = await db.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, BigInt(actor.id)))).limit(1)
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

    const parsedTag = tag !== undefined ? tag || null : priority !== undefined ? parseTaskPriority(priority) ?? null : undefined

    const [updated] = await db
      .update(tasks)
      .set({
        title,
        done,
        subjectId: subjectId !== undefined ? asBigInt(subjectId) : undefined,
        studyPlanId: studyPlanId !== undefined ? asBigInt(studyPlanId) : undefined,
        favorite,
        tag: parsedTag,
        deadline: parsedDeadline,
      })
      .where(eq(tasks.id, taskId))
      .returning(taskSelect)

    res.json(mapTask(updated))
  } catch (error) {
    next(error)
  }
})

tasksRouter.delete('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const taskId = asBigInt(req.params.id)
    if (!taskId) {
      res.status(400).json({ error: 'Neplatne ID ukolu.' })
      return
    }

    const [existing] = await db.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, BigInt(actor.id)), isNull(tasks.deletedAt))).limit(1)
    if (!existing) {
      res.status(404).json({ error: 'Ukol nebyl nalezen.' })
      return
    }

    await db.update(tasks).set({ deletedAt: new Date() }).where(eq(tasks.id, taskId))
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

tasksRouter.put('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const parsed = bulkTasksSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const typedTasks = parsed.data.tasks

    const existingTasks = await db.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.userId, BigInt(actor.id)), isNull(tasks.deletedAt)))
    const incomingIdSet = new Set(typedTasks.map((task) => BigInt(task.id).toString()))

    await db.transaction(async (transaction) => {
      const subjectIds = Array.from(new Set(typedTasks.map((task) => task.subjectId).filter((id) => id !== null))) as number[]
      const validSubjects = subjectIds.length > 0
        ? await transaction.select({ id: subjects.id }).from(subjects).where(inArray(subjects.id, subjectIds.map((id) => BigInt(id))))
        : []
      const validSubjectIds = new Set(validSubjects.map((subject) => subject.id.toString()))

      for (const task of typedTasks) {
        const taskId = BigInt(task.id)
        let nextSubjectId = asBigInt(task.subjectId)

        if (nextSubjectId !== null && !validSubjectIds.has(nextSubjectId.toString())) {
          nextSubjectId = null
        }

        await transaction
          .insert(tasks)
          .values({
            id: taskId,
            title: task.title,
            done: task.done,
            subjectId: nextSubjectId,
            userId: BigInt(actor.id),
            favorite: false,
            tag: null,
            deletedAt: null,
          })
          .onConflictDoUpdate({
            target: tasks.id,
            set: {
              title: task.title,
              done: task.done,
              subjectId: nextSubjectId,
              userId: BigInt(actor.id),
              deletedAt: null,
            },
          })
      }

      const removedTasks = existingTasks.filter((task) => !incomingIdSet.has(task.id.toString()))
      if (removedTasks.length > 0) {
        await transaction.update(tasks).set({ deletedAt: new Date() }).where(inArray(tasks.id, removedTasks.map((task) => task.id)))
      }
    })

    const finalTasks = await db.select(taskSelect).from(tasks).where(and(eq(tasks.userId, BigInt(actor.id)), isNull(tasks.deletedAt))).orderBy(asc(tasks.createdAt))

    res.json({ success: true, tasks: finalTasks.map(mapTask) })
  } catch (error) {
    next(error)
  }
})