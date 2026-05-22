import { eventRepository } from './events.repository.js'
import { CursorPagination } from '../../types.js'
import { AppError } from '../../middleware/error-handler.js'

export class EventsService {
  async getEvents(actor: { id: number, role: string }, filters: {
    pagination: CursorPagination
    includeDeleted?: boolean
  }) {
    return eventRepository.findAll(actor, filters)
  }

  async createEvent(actorId: number, data: {
    title: string
    date: string
    time?: string | null
    location?: string | null
    isShared?: boolean
  }) {
    const parsedDate = new Date(data.date)
    if (Number.isNaN(parsedDate.getTime())) {
      throw new AppError('Neplatny format data.', 400)
    }

    const eventToCreate = {
      userId: BigInt(actorId),
      title: data.title.trim(),
      date: parsedDate,
      time: typeof data.time === 'string' ? data.time : null,
      location: typeof data.location === 'string' ? data.location : null,
      isShared: typeof data.isShared === 'boolean' ? data.isShared : false,
    }

    return eventRepository.create([eventToCreate])
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
