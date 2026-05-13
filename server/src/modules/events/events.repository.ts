import { and, asc, eq, gt, inArray, isNull, or } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { events, subjects } from '../../db/schema.js'
import { asBigInt, mapEvent, toPaginatedPayload } from '../../utils.js'
import { CursorPagination } from '../../types.js'

const eventSelect = {
  id: events.id,
  userId: events.userId,
  subjectId: events.subjectId,
  title: events.title,
  date: events.date,
  time: events.time,
  location: events.location,
  isShared: events.isShared,
  recurrence: events.recurrence,
  recurrenceGroupId: events.recurrenceGroupId,
  deletedAt: events.deletedAt,
  createdAt: events.createdAt,
  updatedAt: events.updatedAt,
}

export class EventRepository {
  async findAll(actor: { id: number, role: string }, filters: {
    pagination: CursorPagination
    subjectId?: bigint | null
    includeDeleted?: boolean
  }) {
    const { pagination, subjectId, includeDeleted } = filters

    const whereParts = [
      subjectId ? eq(events.subjectId, subjectId) : undefined,
      includeDeleted ? undefined : isNull(events.deletedAt),
      actor.role === 'PUBLIC'
        ? eq(events.isShared, true)
        : or(eq(events.userId, BigInt(actor.id)), eq(events.isShared, true)),
      pagination.enabled && pagination.cursor ? gt(events.id, pagination.cursor) : undefined,
    ].filter(Boolean)

    const whereClause = whereParts.length > 0 ? and(...(whereParts as Parameters<typeof and>)) : undefined

    const query = db.select(eventSelect).from(events)
    const rows = pagination.enabled
      ? await query.where(whereClause).orderBy(asc(events.id)).limit(pagination.limit + 1).offset(pagination.cursor ? 1 : 0)
      : await query.where(whereClause).orderBy(asc(events.date), asc(events.createdAt))

    const mappedEvents = rows.map(mapEvent)

    if (!pagination.enabled) {
      return mappedEvents
    }

    return {
      ...toPaginatedPayload(mappedEvents, pagination.limit),
      limit: pagination.limit,
    }
  }

  async create(data: any[]) {
    const created = await db.insert(events).values(data).returning(eventSelect)
    return created.map(mapEvent)
  }

  async findByIdForUser(eventId: bigint, actorId: number) {
    const [existing] = await db.select({ id: events.id })
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.userId, BigInt(actorId))))
      .limit(1)
    return existing || null
  }

  async update(eventId: bigint, data: any) {
    const [updated] = await db
      .update(events)
      .set(data)
      .where(eq(events.id, eventId))
      .returning(eventSelect)
    return mapEvent(updated)
  }

  async softDelete(eventId: bigint) {
    await db.update(events).set({ deletedAt: new Date() }).where(eq(events.id, eventId))
    return { success: true }
  }

  async bulkSync(actorId: number, incomingEvents: any[]) {
    const existingEvents = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.userId, BigInt(actorId)), isNull(events.deletedAt)))

    const incomingIdSet = new Set(incomingEvents.map((event) => BigInt(event.id).toString()))

    await db.transaction(async (transaction) => {
      const subjectIds = Array.from(new Set(incomingEvents.map((event) => event.subjectId).filter((id) => id != null))) as number[]
      const validSubjects = subjectIds.length > 0
        ? await transaction.select({ id: subjects.id }).from(subjects).where(inArray(subjects.id, subjectIds.map((id) => BigInt(id))))
        : []
      const validSubjectIds = new Set(validSubjects.map((subject) => subject.id.toString()))

      for (const event of incomingEvents) {
        const eventId = BigInt(event.id)
        const parsedDate = new Date(event.date)
        let nextSubjectId = asBigInt(event.subjectId)

        if (nextSubjectId !== null && !validSubjectIds.has(nextSubjectId.toString())) {
          nextSubjectId = null
        }

        await transaction
          .insert(events)
          .values({
            id: eventId,
            userId: BigInt(actorId),
            title: event.title,
            date: parsedDate,
            time: event.time,
            location: event.location,
            isShared: typeof event.isShared === 'boolean' ? event.isShared : false,
            subjectId: nextSubjectId,
            recurrence: 'NONE',
            recurrenceGroupId: null,
            deletedAt: null,
          })
          .onConflictDoUpdate({
            target: events.id,
            set: {
              userId: BigInt(actorId),
              title: event.title,
              date: parsedDate,
              time: event.time,
              location: event.location,
              isShared: typeof event.isShared === 'boolean' ? event.isShared : false,
              subjectId: nextSubjectId,
              recurrence: 'NONE',
              recurrenceGroupId: null,
              deletedAt: null,
            },
          })
      }

      const removedEvents = existingEvents.filter((event) => !incomingIdSet.has(event.id.toString()))
      if (removedEvents.length > 0) {
        await transaction.update(events).set({ deletedAt: new Date() }).where(inArray(events.id, removedEvents.map((event) => event.id)))
      }
    })

    const finalEvents = await db.select(eventSelect).from(events).where(and(eq(events.userId, BigInt(actorId)), isNull(events.deletedAt))).orderBy(asc(events.date), asc(events.createdAt))

    return finalEvents.map(mapEvent)
  }
}

export const eventRepository = new EventRepository()
