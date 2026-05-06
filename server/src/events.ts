import express from 'express'
import { and, asc, eq, gt, inArray, isNull, or } from 'drizzle-orm'

import { db } from './db/client.js'
import { events, subjects } from './db/schema.js'
import { bulkEventsSchema, eventSchema, updateEventSchema } from './schemas.js'
import { asBigInt, buildRecurringDates, mapEvent, parseCursorPagination, parseEventRecurrence, toPaginatedPayload } from './utils.js'
import { getActorFromRequest, isPublicActor, requireRegisteredActor } from './auth.js'

export const eventsRouter: express.Router = express.Router()

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

eventsRouter.get('/', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const pagination = parseCursorPagination(req, { defaultLimit: 30, maxLimit: 200 })
    const subjectId = asBigInt(req.query.subjectId)
    const includeDeleted = req.query.includeDeleted === 'true'

    const whereParts = [
      subjectId ? eq(events.subjectId, subjectId) : undefined,
      includeDeleted ? undefined : isNull(events.deletedAt),
      isPublicActor(actor)
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
      res.json(mappedEvents)
      return
    }

    res.json({
      ...toPaginatedPayload(mappedEvents, pagination.limit),
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

eventsRouter.post('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const parsed = eventSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const { title, date, time, location, subjectId, recurrence, repeatCount, isShared } = parsed.data

    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Neplatny format data.' })
      return
    }

    const parsedRecurrence = parseEventRecurrence(recurrence) ?? 'NONE'
    const safeRepeatCount = typeof repeatCount === 'number' ? Math.trunc(repeatCount) : 1
    const dates = buildRecurringDates(parsedDate, parsedRecurrence, safeRepeatCount)
    const recurrenceGroupId = parsedRecurrence === 'NONE' || dates.length <= 1 ? null : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const created = await db.insert(events).values(
      dates.map((eventDate) => ({
        userId: BigInt(actor.id),
        title: title.trim(),
        date: eventDate,
        time: typeof time === 'string' ? time : null,
        location: typeof location === 'string' ? location : null,
        isShared: typeof isShared === 'boolean' ? isShared : false,
        subjectId: asBigInt(subjectId),
        recurrence: parsedRecurrence,
        recurrenceGroupId,
      })),
    ).returning(eventSelect)

    res.status(201).json({
      event: mapEvent(created[0]),
      occurrences: created.map(mapEvent),
    })
  } catch (error) {
    next(error)
  }
})

eventsRouter.patch('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const eventId = asBigInt(req.params.id)
    if (!eventId) {
      res.status(400).json({ error: 'Neplatne ID udalosti.' })
      return
    }

    const [existing] = await db.select({ id: events.id }).from(events).where(and(eq(events.id, eventId), eq(events.userId, BigInt(actor.id)))).limit(1)
    if (!existing) {
      res.status(404).json({ error: 'Udalost nebyla nalezena.' })
      return
    }

    const parsed = updateEventSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const payload = parsed.data

    const parsedDate = typeof payload.date === 'string' ? new Date(payload.date) : undefined
    if (parsedDate && Number.isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Neplatny format data.' })
      return
    }

    const [updated] = await db
      .update(events)
      .set({
        title: typeof payload.title === 'string' ? payload.title.trim() : undefined,
        date: parsedDate,
        time: typeof payload.time === 'string' || payload.time === null ? payload.time : undefined,
        location: typeof payload.location === 'string' || payload.location === null ? payload.location : undefined,
        isShared: typeof payload.isShared === 'boolean' ? payload.isShared : undefined,
        subjectId: payload.subjectId !== undefined ? asBigInt(payload.subjectId) : undefined,
        recurrence: payload.recurrence !== undefined ? (parseEventRecurrence(payload.recurrence) ?? undefined) : undefined,
      })
      .where(eq(events.id, eventId))
      .returning(eventSelect)

    res.json(mapEvent(updated))
  } catch (error) {
    next(error)
  }
})

eventsRouter.delete('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const eventId = asBigInt(req.params.id)
    if (!eventId) {
      res.status(400).json({ error: 'Neplatne ID udalosti.' })
      return
    }

    const [existing] = await db.select({ id: events.id }).from(events).where(and(eq(events.id, eventId), eq(events.userId, BigInt(actor.id)), isNull(events.deletedAt))).limit(1)
    if (!existing) {
      res.status(404).json({ error: 'Udalost nebyla nalezena.' })
      return
    }

    await db.update(events).set({ deletedAt: new Date() }).where(eq(events.id, eventId))
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

eventsRouter.put('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) return

    const parsed = bulkEventsSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const typedEvents = parsed.data.events

    const existingEvents = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.userId, BigInt(actor.id)), isNull(events.deletedAt)))

    const incomingIdSet = new Set(typedEvents.map((event) => BigInt(event.id).toString()))

    await db.transaction(async (transaction) => {
      const subjectIds = Array.from(new Set(typedEvents.map((event) => event.subjectId).filter((id) => id != null))) as number[]
      const validSubjects = subjectIds.length > 0
        ? await transaction.select({ id: subjects.id }).from(subjects).where(inArray(subjects.id, subjectIds.map((id) => BigInt(id))))
        : []
      const validSubjectIds = new Set(validSubjects.map((subject) => subject.id.toString()))

      for (const event of typedEvents) {
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
            userId: BigInt(actor.id),
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
              userId: BigInt(actor.id),
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

    const finalEvents = await db.select(eventSelect).from(events).where(and(eq(events.userId, BigInt(actor.id)), isNull(events.deletedAt))).orderBy(asc(events.date), asc(events.createdAt))

    res.json({ success: true, events: finalEvents.map(mapEvent) })
  } catch (error) {
    next(error)
  }
})