import express from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { eventSchema, updateEventSchema, bulkEventsSchema } from './schemas.js'
import { asBigInt, parseCursorPagination, parseEventRecurrence, buildRecurringDates, mapEvent, toPaginatedPayload } from './utils.js'
import { getActorFromRequest, isPublicActor, requireRegisteredActor } from './auth.js'

export const eventsRouter = express.Router()

eventsRouter.get('/', async (req, res, next) => {
  try {
    const actor = await getActorFromRequest(req)
    const pagination = parseCursorPagination(req, { defaultLimit: 30, maxLimit: 200 })
    const subjectId = asBigInt(req.query.subjectId)
    const includeDeleted = req.query.includeDeleted === 'true'

    const findArgs: Prisma.EventFindManyArgs = {
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      where: isPublicActor(actor)
        ? {
            isShared: true,
            subjectId: subjectId ?? undefined,
            deletedAt: includeDeleted ? undefined : null,
          }
        : {
            subjectId: subjectId ?? undefined,
            deletedAt: includeDeleted ? undefined : null,
            OR: [{ userId: BigInt(actor.id) }, { isShared: true }],
          },
    }

    if (pagination.enabled) {
      findArgs.take = pagination.limit + 1
      findArgs.skip = pagination.cursor ? 1 : 0
      findArgs.cursor = pagination.cursor ? { id: pagination.cursor } : undefined
      findArgs.orderBy = { id: 'asc' }
    }

    const events = await prisma.event.findMany(findArgs)

    const mappedEvents = events.map(mapEvent)

    if (!pagination.enabled) {
      res.json(mappedEvents)
      return
    }

    const paginated = toPaginatedPayload(mappedEvents, pagination.limit)
    res.json({
      ...paginated,
      limit: pagination.limit,
    })
  } catch (error) {
    next(error)
  }
})

eventsRouter.post('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

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
    const recurrenceGroupId =
      parsedRecurrence === 'NONE' || dates.length <= 1
        ? null
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const created = await prisma.$transaction(async (transaction) => {
      const rows = []
      for (const eventDate of dates) {
        const row = await transaction.event.create({
          data: {
            userId: BigInt(actor.id),
            title: title.trim(),
            date: eventDate,
            time: typeof time === 'string' ? time : null,
            location: typeof location === 'string' ? location : null,
            isShared: typeof isShared === 'boolean' ? isShared : false,
            subjectId: asBigInt(subjectId),
            recurrence: parsedRecurrence,
            recurrenceGroupId,
          },
        })
        rows.push(row)
      }

      return rows
    })

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
    if (!actor) {
      return
    }

    const eventId = asBigInt(req.params.id)
    if (!eventId) {
      res.status(400).json({ error: 'Neplatne ID udalosti.' })
      return
    }

    const existing = await prisma.event.findFirst({ where: { id: eventId, userId: BigInt(actor.id) } })
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

    const parsedDate =
      typeof payload.date === 'string' ? new Date(payload.date) : undefined

    if (parsedDate && Number.isNaN(parsedDate.getTime())) {
      res.status(400).json({ error: 'Neplatny format data.' })
      return
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: typeof payload.title === 'string' ? payload.title.trim() : undefined,
        date: parsedDate,
        time: typeof payload.time === 'string' || payload.time === null ? payload.time : undefined,
        location:
          typeof payload.location === 'string' || payload.location === null
            ? payload.location
            : undefined,
        isShared: typeof payload.isShared === 'boolean' ? payload.isShared : undefined,
        subjectId: payload.subjectId !== undefined ? asBigInt(payload.subjectId) : undefined,
        recurrence:
          payload.recurrence !== undefined
            ? (parseEventRecurrence(payload.recurrence) ?? undefined)
            : undefined,
      },
    })

    res.json(mapEvent(updated))
  } catch (error) {
    next(error)
  }
})

eventsRouter.delete('/:id', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const eventId = asBigInt(req.params.id)
    if (!eventId) {
      res.status(400).json({ error: 'Neplatne ID udalosti.' })
      return
    }

    const existing = await prisma.event.findFirst({ where: { id: eventId, userId: BigInt(actor.id), deletedAt: null } })
    if (!existing) {
      res.status(404).json({ error: 'Udalost nebyla nalezena.' })
      return
    }

    await prisma.event.update({ where: { id: eventId }, data: { deletedAt: new Date() } })

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

eventsRouter.put('/', async (req, res, next) => {
  try {
    const actor = await requireRegisteredActor(req, res)
    if (!actor) {
      return
    }

    const parsed = bulkEventsSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }
    const typedEvents = parsed.data.events

    const existingEvents = await prisma.event.findMany({ where: { userId: BigInt(actor.id), deletedAt: null } })
    const existingById = new Map(existingEvents.map((event) => [event.id.toString(), event]))

    const incomingIdSet = new Set(typedEvents.map((event) => BigInt(event.id).toString()))

    await prisma.$transaction(async (transaction) => {
      // Zkontrolujeme existenci předmětů pro události
      const subjectIds = Array.from(new Set(typedEvents.map((e) => e.subjectId).filter((id) => id !== null))) as number[]
      const validSubjects = await transaction.subject.findMany({
        where: { id: { in: subjectIds.map((id) => BigInt(id)) } },
        select: { id: true }
      })
      const validSubjectIds = new Set(validSubjects.map((s) => s.id.toString()))

      for (const event of typedEvents) {
        const eventId = BigInt(event.id)
        const parsedDate = new Date(event.date)
        const existing = existingById.get(eventId.toString())
        let nextSubjectId = asBigInt(event.subjectId)

        if (nextSubjectId !== null && !validSubjectIds.has(nextSubjectId.toString())) {
          nextSubjectId = null
        }

        await transaction.event.upsert({
          where: { id: eventId },
          update: {
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
          create: {
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
          },
        })

        if (existing && existing.deletedAt) {
          await transaction.event.update({
            where: { id: eventId },
            data: { deletedAt: null },
          })
        }
      }

      const removedEvents = existingEvents.filter((event) => !incomingIdSet.has(event.id.toString()))

      if (removedEvents.length > 0) {
        await transaction.event.updateMany({
          where: {
            id: {
              in: removedEvents.map((event) => event.id),
            },
          },
          data: {
            deletedAt: new Date(),
          },
        })
      }
    })

    const finalEvents = await prisma.event.findMany({
      where: { userId: BigInt(actor.id), deletedAt: null },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    })

    res.json({ success: true, events: finalEvents.map(mapEvent) })
  } catch (error) {
    next(error)
  }
})