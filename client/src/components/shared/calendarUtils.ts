import { CalendarEvent } from '../../app/types'
import { formatDateIso } from '../../app/utils'

/**
 * Filters all calendar events by future/past relative to today.
 */
function parseEventDateTime(dateStr: string, timeStr?: string | null): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  let hours = 0
  let minutes = 0
  if (timeStr) {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/)
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10)
      minutes = parseInt(timeMatch[2], 10)
    }
  }
  return new Date(year, month - 1, day, hours, minutes).getTime()
}

export function filterEventsByTime(
  eventsByDate: Record<string, CalendarEvent[]>,
  filter: 'future' | 'past',
): CalendarEvent[] {
  const allEvents = Object.values(eventsByDate).flat()
  const now = new Date().getTime()

  const eventsWithTime = allEvents.map((event) => {
    const eventDate =
      event.date ||
      Object.keys(eventsByDate).find((date) =>
        eventsByDate[date]?.some((item) => item.id === event.id),
      ) ||
      formatDateIso(new Date())
    const eventTime = parseEventDateTime(eventDate, event.time)
    return { event, eventTime }
  })

  if (filter === 'future') {
    return eventsWithTime
      .filter((e) => e.eventTime >= now)
      .sort((a, b) => a.eventTime - b.eventTime)
      .slice(0, 5)
      .map((e) => e.event)
  } else {
    return eventsWithTime
      .filter((e) => e.eventTime < now)
      .sort((a, b) => b.eventTime - a.eventTime)
      .slice(0, 5)
      .map((e) => e.event)
  }
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
