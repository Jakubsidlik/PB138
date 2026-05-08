import { Button } from '../ui/button'
import { CalendarEvent, EventMeta } from '../../app/types'
import { formatCzechDate } from './calendarUtils'

type CalendarEventListProps = {
  events: CalendarEvent[]
  eventMetaById: Record<number, EventMeta>
  getDefaultMetaForTitle: (title: string) => EventMeta
  emptyMessage: string
  listClassName: string
  itemClassName: string
  iconClassName: string
  contentClassName: string
  timeClassName?: string
  removeButtonClassName: string
  showTimeBadge?: boolean
  showDate?: boolean
  onRemoveEvent: (eventId: number) => void
}

export function CalendarEventList({
  events,
  eventMetaById,
  getDefaultMetaForTitle,
  emptyMessage,
  listClassName,
  itemClassName,
  iconClassName,
  contentClassName,
  timeClassName,
  removeButtonClassName,
  showTimeBadge,
  showDate,
  onRemoveEvent,
}: CalendarEventListProps) {
  if (events.length === 0) {
    return <p className={listClassName === 'events-list-desktop' ? 'empty-events' : 'mobile-calendar-empty'}>{emptyMessage}</p>
  }

  return (
    <div className={listClassName}>
      {events.map((event) => {
        const meta = eventMetaById[event.id] ?? getDefaultMetaForTitle(event.title)

        return (
          <article key={event.id} className={itemClassName}>
            <div className={iconClassName}>{meta.icon}</div>
            <div className={contentClassName}>
              <h4>
                {event.title}
                {event.priority && (
                  <span className={`event-priority-badge ${event.priority}`}>
                    {event.priority === 'high' ? 'vysoká' : event.priority === 'medium' ? 'střední' : 'nízká'}
                  </span>
                )}
              </h4>
              <p>
                {meta.time}
                {showDate && event.date ? `, ${formatCzechDate(event.date)}` : ''}
              </p>
              <p>{meta.location}</p>
            </div>
            {showTimeBadge ? <div className={timeClassName}>{meta.time.split(' - ')[0]}</div> : null}
            <Button
              type="button"
              className={removeButtonClassName}
              aria-label="Odstranit událost"
              onClick={() => onRemoveEvent(event.id)}
            >
              ×
            </Button>
          </article>
        )
      })}
    </div>
  )
}