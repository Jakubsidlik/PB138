import React from 'react'
import { Button } from '../../components/ui/button'
import { CalendarCell, CalendarEvent, EventMeta } from '../../app/types'
import { formatDateIso } from '../../app/utils'
import { CalendarEventList } from '../../components/shared/CalendarEventList'

type MobileCalendarScreenProps = {
  monthLabel: string
  calendarWeekDays: string[]
  calendarCells: CalendarCell[]
  eventsByDate: Record<string, CalendarEvent[]>
  selectedDateIso: string
  setSelectedDateIso: React.Dispatch<React.SetStateAction<string>>
  selectedDayEvents: CalendarEvent[]
  eventMetaById: Record<number, EventMeta>
  getDefaultMetaForTitle: (title: string) => EventMeta
  setDisplayMonth: React.Dispatch<React.SetStateAction<Date>>
  addDesktopEvent: () => void
  removeEvent: (eventId: number) => void
}

export function MobileCalendarScreen({
  monthLabel,
  calendarWeekDays,
  calendarCells,
  eventsByDate,
  selectedDateIso,
  setSelectedDateIso,
  selectedDayEvents,
  eventMetaById,
  getDefaultMetaForTitle,
  setDisplayMonth,
  addDesktopEvent,
  removeEvent,
}: MobileCalendarScreenProps) {
  const [eventFilter, setEventFilter] = React.useState<'future' | 'past'>('future')
  return (
    <section className="mobile-calendar-screen" id="calendar-mobile">
      <div className="mobile-calendar-panel">
        <div className="mobile-calendar-month-head">
          <Button
            type="button"
            className="mobile-month-arrow"
            aria-label="Předchozí měsíc"
            onClick={() =>
              setDisplayMonth(
                (prevMonth) =>
                  new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1),
              )
            }
          >
            ‹
          </Button>
          <h3>{monthLabel}</h3>
          <Button
            type="button"
            className="mobile-month-arrow"
            aria-label="Další měsíc"
            onClick={() =>
              setDisplayMonth(
                (prevMonth) =>
                  new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1),
              )
            }
          >
            ›
          </Button>
        </div>

        <div className="mobile-month-grid">
          {calendarWeekDays.map((dayLabel) => (
            <span key={dayLabel} className="mobile-weekday-label">
              {dayLabel[0]}
            </span>
          ))}

          {calendarCells.map((cell) => {
            const dayEvents = eventsByDate[cell.iso] ?? []
            const isSelected = cell.iso === selectedDateIso

            return (
              <Button
                key={cell.iso}
                type="button"
                className={`mobile-month-cell ${cell.inCurrentMonth ? '' : 'muted'} ${
                  isSelected ? 'selected' : ''
                }`}
                onClick={() => setSelectedDateIso(cell.iso)}
              >
                <span>{cell.date.getDate()}</span>
                {dayEvents.length > 0 ? <i /> : null}
              </Button>
            )
          })}
        </div>
      </div>

      <section className="mobile-calendar-events">
        <div className="mobile-calendar-events-head">
          <h3>Události dne</h3>
          <span>
            {new Intl.DateTimeFormat('cs-CZ', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }).format(new Date(selectedDateIso))}
          </span>
        </div>

        <CalendarEventList
          events={selectedDayEvents}
          eventMetaById={eventMetaById}
          getDefaultMetaForTitle={getDefaultMetaForTitle}
          emptyMessage="Pro vybraný den nejsou žádné události."
          listClassName="mobile-calendar-events-list"
          itemClassName="mobile-calendar-event-card"
          iconClassName="mobile-calendar-event-icon"
          contentClassName="mobile-calendar-event-content"
          timeClassName="mobile-calendar-event-time"
          removeButtonClassName="recent-file-more"
          showTimeBadge
          onRemoveEvent={removeEvent}
        />
      </section>

      <section className="mobile-calendar-events">
        <div className="mobile-calendar-events-head">
          <h3>Všechny události</h3>
        </div>

        <div className="event-filter-buttons">
          <Button
            type="button"
            onClick={() => setEventFilter('future')}
            className={eventFilter === 'future' ? 'active' : ''}
          >
            Budoucí
          </Button>
          <Button
            type="button"
            onClick={() => setEventFilter('past')}
            className={eventFilter === 'past' ? 'active' : ''}
          >
            Minulé
          </Button>
        </div>

        <CalendarEventList
          events={(() => {
            const today = formatDateIso(new Date())
            const allEvents = Object.values(eventsByDate).flat()
            return allEvents.filter((event) => {
              const eventDate = event.date || Object.keys(eventsByDate).find((date) => eventsByDate[date]?.some((item) => item.id === event.id))
              const isInFuture = eventDate && eventDate >= today
              return eventFilter === 'future' ? isInFuture : !isInFuture
            })
          })()}
          eventMetaById={eventMetaById}
          getDefaultMetaForTitle={getDefaultMetaForTitle}
          emptyMessage={eventFilter === 'future' ? 'Žádné budoucí události.' : 'Žádné minulé události.'}
          listClassName="mobile-calendar-events-list"
          itemClassName="mobile-calendar-event-card"
          iconClassName="mobile-calendar-event-icon"
          contentClassName="mobile-calendar-event-content"
          timeClassName="mobile-calendar-event-time"
          removeButtonClassName="recent-file-more"
          showTimeBadge
          onRemoveEvent={removeEvent}
        />
      </section>

      <Button type="button" className="mobile-calendar-fab" aria-label="Přidat událost" onClick={addDesktopEvent}>
        +
      </Button>
    </section>
  )
}


