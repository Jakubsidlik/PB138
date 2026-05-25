import { and, asc, eq, gte, gt, ilike, inArray, isNull, lte } from 'drizzle-orm'
import { db } from '../../db/client'
import { tasks, subjects, type TaskPriority } from '../../db/schema'
import { asBigInt, mapTask, toPaginatedPayload } from '../../utils'
import { CursorPagination } from '../../types'

const taskSelect = {
  id: tasks.id,
  userId: tasks.userId,
  title: tasks.title,
  done: tasks.done,
  priority: tasks.priority,
  deletedAt: tasks.deletedAt,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
}

export class TaskRepository {
  async findAll(actorId: number, filters: {
    pagination: CursorPagination
    includeDeleted?: boolean
    done?: string | null
    search?: string
  }) {
    const { pagination, includeDeleted, done, search } = filters

    const whereParts = [
      eq(tasks.userId, BigInt(actorId)),
      done === 'true' ? eq(tasks.done, true) : done === 'false' ? eq(tasks.done, false) : undefined,
      search ? ilike(tasks.title, `%${search}%`) : undefined,
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
    priority?: string
  }) {
    const [created] = await db.insert(tasks).values({
      userId: BigInt(actorId),
      title: data.title,
      done: data.done,
      priority: (data.priority as TaskPriority) ?? 'NONE',
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
    priority?: string
  }) {
    const [updated] = await db
      .update(tasks)
      .set({
        title: data.title,
        done: data.done,
        priority: data.priority as TaskPriority | undefined,
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

  async bulkSync(actorId: number, incomingTasks: Array<{ id: number; title: string; done: boolean }>) {
    const existingTasks = await db.select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.userId, BigInt(actorId)), isNull(tasks.deletedAt)))
    const incomingIdSet = new Set(incomingTasks.map((task) => BigInt(task.id).toString()))

    await db.transaction(async (transaction) => {
      for (const task of incomingTasks) {
        const taskId = BigInt(task.id)

        await transaction
          .insert(tasks)
          .values({
            id: taskId,
            title: task.title,
            done: task.done,
            userId: BigInt(actorId),
            priority: 'NONE',
            deletedAt: null,
          })
          .onConflictDoUpdate({
            target: tasks.id,
            set: {
              title: task.title,
              done: task.done,
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
