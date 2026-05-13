import { eventRepository } from './events.repository.js'
import { CursorPagination } from '../../types.js'
import { AppError } from '../../middleware/error-handler.js'
import { buildRecurringDates, parseEventRecurrence } from '../../utils.js'

export class EventsService {
  async getEvents(actor: { id: number, role: string }, filters: {
    pagination: CursorPagination
    subjectId?: bigint | null
    includeDeleted?: boolean
  }) {
    return eventRepository.findAll(actor, filters)
  }

  async createEvent(actorId: number, data: {
    title: string
    date: string
    time?: string | null
    location?: string | null
    subjectId?: number | null
    recurrence?: string
    repeatCount?: number
    isShared?: boolean
  }) {
    const parsedDate = new Date(data.date)
    if (Number.isNaN(parsedDate.getTime())) {
      throw new AppError('Neplatny format data.', 400)
    }

    const parsedRecurrence = parseEventRecurrence(data.recurrence) ?? 'NONE'
    const safeRepeatCount = typeof data.repeatCount === 'number' ? Math.trunc(data.repeatCount) : 1
    const dates = buildRecurringDates(parsedDate, parsedRecurrence, safeRepeatCount)
    const recurrenceGroupId = parsedRecurrence === 'NONE' || dates.length <= 1 ? null : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const eventsToCreate = dates.map((eventDate) => ({
      userId: BigInt(actorId),
      title: data.title.trim(),
      date: eventDate,
      time: typeof data.time === 'string' ? data.time : null,
      location: typeof data.location === 'string' ? data.location : null,
      isShared: typeof data.isShared === 'boolean' ? data.isShared : false,
      subjectId: data.subjectId ? BigInt(data.subjectId) : null,
      recurrence: parsedRecurrence,
      recurrenceGroupId,
    }))

    return eventRepository.create(eventsToCreate)
  }

  async updateEvent(eventId: bigint, actorId: number, data: any) {
    const existing = await eventRepository.findByIdForUser(eventId, actorId)
    if (!existing) throw new AppError('Udalost nebyla nalezena.', 404)

    const updateData: any = { ...data }
    if (typeof data.date === 'string') {
      const parsedDate = new Date(data.date)
      if (Number.isNaN(parsedDate.getTime())) {
        throw new AppError('Neplatny format data.', 400)
      }
      updateData.date = parsedDate
    }
    if (data.subjectId !== undefined) {
      updateData.subjectId = data.subjectId ? BigInt(data.subjectId) : null
    }

    return eventRepository.update(eventId, updateData)
  }

  async deleteEvent(eventId: bigint, actorId: number) {
    const existing = await eventRepository.findByIdForUser(eventId, actorId)
    if (!existing) throw new AppError('Udalost nebyla nalezena.', 404)

    return eventRepository.softDelete(eventId)
  }

  async bulkSync(actorId: number, events: any[]) {
    return eventRepository.bulkSync(actorId, events)
  }
}

export const eventsService = new EventsService()
