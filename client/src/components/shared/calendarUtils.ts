import { CalendarEvent } from '../../app/types'
import { formatDateIso } from '../../app/utils'

/**
 * Filters all calendar events by future/past relative to today.
 */
export function filterEventsByTime(
  eventsByDate: Record<string, CalendarEvent[]>,
  filter: 'future' | 'past',
): CalendarEvent[] {
  const today = formatDateIso(new Date())
  const allEvents = Object.values(eventsByDate).flat()

  return allEvents.filter((event) => {
    const eventDate =
      event.date ||
      Object.keys(eventsByDate).find((date) =>
        eventsByDate[date]?.some((item) => item.id === event.id),
      )
    const isInFuture = eventDate && eventDate >= today
    return filter === 'future' ? isInFuture : !isInFuture
  })
}

/**
 * Formats a date ISO string to a localized Czech date label.
 */
export function formatCzechDate(isoDate: string): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate))
}
