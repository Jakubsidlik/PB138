import express from 'express'
import { eventsService } from './events.services'
import { bulkEventsSchema, eventSchema, updateEventSchema } from '../../schemas'
import { asBigInt, parseCursorPagination } from '../../utils'
import { getActorFromRequest, requireRegisteredActor } from '../../auth'
import { asyncHandler, AppError } from '../../middleware/error-handler'

export const eventsRouter: express.Router = express.Router()

eventsRouter.get('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return
  const pagination = parseCursorPagination(req, { defaultLimit: 30, maxLimit: 200 })
  
  const filters = {
    pagination,
    includeDeleted: req.query.includeDeleted === 'true',
  }

  const result = await eventsService.getEvents(actor, filters)
  res.json(result)
}))

eventsRouter.post('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const parsed = eventSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await eventsService.createEvent(actor.id, parsed.data)
  res.status(201).json({
    event: result[0],
    occurrences: result,
  })
}))

eventsRouter.patch('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const eventId = asBigInt(req.params.id)
  if (!eventId) throw new AppError('Neplatne ID udalosti.', 400)

  const parsed = updateEventSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await eventsService.updateEvent(eventId, actor.id, parsed.data)
  res.json(result)
}))

eventsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const eventId = asBigInt(req.params.id)
  if (!eventId) throw new AppError('Neplatne ID udalosti.', 400)

  const result = await eventsService.deleteEvent(eventId, actor.id)
  res.json(result)
}))

eventsRouter.put('/', asyncHandler(async (req, res) => {
  const actor = await requireRegisteredActor(req, res)
  if (!actor) return

  const parsed = bulkEventsSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400)
  }

  const result = await eventsService.bulkSync(actor.id, parsed.data.events)
  res.json({ success: true, events: result })
}))
