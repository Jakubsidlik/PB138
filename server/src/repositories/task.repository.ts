import { and, asc, eq, gte, gt, ilike, inArray, isNull, lte } from 'drizzle-orm'
import { db } from '../db/client.js'
import { tasks, subjects } from '../db/schema.js'
import { asBigInt, parseCursorPagination, parseOptionalDate, parseTaskPriority, mapTask, toPaginatedPayload } from '../utils.js'
import type { Request } from 'express'

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

export class TaskRepository {
  async findAll(actorId: number, req: Request) {
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
      eq(tasks.userId, BigInt(actorId)),
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
      return mappedTasks
    }

    return {
      ...toPaginatedPayload(mappedTasks, pagination.limit),
      limit: pagination.limit,
    }
  }

  async create(actorId: number, data: {
    title: string
    done?: boolean
    subjectId?: number | null
    studyPlanId?: number | null
    favorite?: boolean
    tag?: string | null
    priority?: string
    deadline?: string | null
  }) {
    const parsedDeadline = parseOptionalDate(data.deadline)
    const parsedTag = data.tag !== undefined ? data.tag || null : data.priority !== undefined ? parseTaskPriority(data.priority) ?? null : null

    const [created] = await db.insert(tasks).values({
      userId: BigInt(actorId),
      title: data.title,
      done: data.done,
      subjectId: asBigInt(data.subjectId),
      studyPlanId: asBigInt(data.studyPlanId),
      favorite: data.favorite,
      tag: parsedTag,
      deadline: parsedDeadline ?? null,
    }).returning(taskSelect)

    return mapTask(created)
  }

  async findByIdForUser(taskId: bigint, actorId: number) {
    const [existing] = await db.select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, BigInt(actorId))))
      .limit(1)
    return existing || null
  }

  async update(taskId: bigint, data: {
    title?: string
    done?: boolean
    subjectId?: number | null
    studyPlanId?: number | null
    favorite?: boolean
    tag?: string | null
    priority?: string
    deadline?: string | null
  }) {
    const parsedDeadline = parseOptionalDate(data.deadline)
    const parsedTag = data.tag !== undefined ? data.tag || null : data.priority !== undefined ? parseTaskPriority(data.priority) ?? null : undefined

    const [updated] = await db
      .update(tasks)
      .set({
        title: data.title,
        done: data.done,
        subjectId: data.subjectId !== undefined ? asBigInt(data.subjectId) : undefined,
        studyPlanId: data.studyPlanId !== undefined ? asBigInt(data.studyPlanId) : undefined,
        favorite: data.favorite,
        tag: parsedTag,
        deadline: parsedDeadline,
      })
      .where(eq(tasks.id, taskId))
      .returning(taskSelect)

    return mapTask(updated)
  }

  async softDelete(taskId: bigint, actorId: number) {
    const [existing] = await db.select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, BigInt(actorId)), isNull(tasks.deletedAt)))
      .limit(1)

    if (!existing) return null

    await db.update(tasks).set({ deletedAt: new Date() }).where(eq(tasks.id, taskId))
    return { success: true }
  }

  async bulkSync(actorId: number, incomingTasks: Array<{ id: number; title: string; done: boolean; subjectId?: number | null }>) {
    const existingTasks = await db.select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.userId, BigInt(actorId)), isNull(tasks.deletedAt)))
    const incomingIdSet = new Set(incomingTasks.map((task) => BigInt(task.id).toString()))

    await db.transaction(async (transaction) => {
      const subjectIds = Array.from(new Set(incomingTasks.map((task) => task.subjectId).filter((id) => id !== null))) as number[]
      const validSubjects = subjectIds.length > 0
        ? await transaction.select({ id: subjects.id }).from(subjects).where(inArray(subjects.id, subjectIds.map((id) => BigInt(id))))
        : []
      const validSubjectIds = new Set(validSubjects.map((subject) => subject.id.toString()))

      for (const task of incomingTasks) {
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
            userId: BigInt(actorId),
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
              userId: BigInt(actorId),
              deletedAt: null,
            },
          })
      }

      const removedTasks = existingTasks.filter((task) => !incomingIdSet.has(task.id.toString()))
      if (removedTasks.length > 0) {
        await transaction.update(tasks).set({ deletedAt: new Date() }).where(inArray(tasks.id, removedTasks.map((task) => task.id)))
      }
    })

    const finalTasks = await db.select(taskSelect)
      .from(tasks)
      .where(and(eq(tasks.userId, BigInt(actorId)), isNull(tasks.deletedAt)))
      .orderBy(asc(tasks.createdAt))

    return finalTasks.map(mapTask)
  }
}

export const taskRepository = new TaskRepository()
