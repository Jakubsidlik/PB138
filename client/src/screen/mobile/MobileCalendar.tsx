import React from 'react'
import { Button } from '../../components/ui/button'
import { CalendarCell, CalendarEvent, EventMeta } from '../../app/types'
import { formatDateIso } from '../../app/utils'

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

        <div className="mobile-calendar-events-list">
          {selectedDayEvents.length === 0 ? (
            <p className="mobile-calendar-empty">Pro vybraný den nejsou žádné události.</p>
          ) : (
            selectedDayEvents.map((event) => {
              const meta = eventMetaById[event.id] ?? getDefaultMetaForTitle(event.title)

              return (
                <article key={event.id} className="mobile-calendar-event-card">
                  <div className="mobile-calendar-event-icon">{meta.icon}</div>
                  <div className="mobile-calendar-event-content">
                    <h4>
                      {event.title}
                      {event.priority && (
                        <span className={`event-priority-badge ${event.priority}`}>
                          {event.priority === 'high' ? '!' : event.priority === 'medium' ? '◆' : '○'}
                        </span>
                      )}
                    </h4>
                    <p>{meta.time}</p>
                    <p>{meta.location}</p>
                  </div>
                  <div className="mobile-calendar-event-time">{meta.time.split(' - ')[0]}</div>
                  <Button
                    type="button"
                    className="recent-file-more"
                    aria-label="Odstranit událost"
                    onClick={() => removeEvent(event.id)}
                  >
                    ×
                  </Button>
                </article>
              )
            })
          )}
        </div>
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

        <div className="mobile-calendar-events-list">
          {(() => {
            const today = formatDateIso(new Date())
            const allEvents = Object.values(eventsByDate).flat()
            const filteredEvents = allEvents.filter((event) => {
              const eventDate = event.date || Object.keys(eventsByDate).find((date) => eventsByDate[date]?.some((e) => e.id === event.id))
              const isInFuture = eventDate && eventDate >= today
              return eventFilter === 'future' ? isInFuture : !isInFuture
            })

            return filteredEvents.length === 0 ? (
              <p className="mobile-calendar-empty">
                {eventFilter === 'future' ? 'Žádné budoucí události.' : 'Žádné minulé události.'}
              </p>
            ) : (
              filteredEvents.map((event) => {
                const meta = eventMetaById[event.id] ?? getDefaultMetaForTitle(event.title)

                return (
                  <article key={event.id} className="mobile-calendar-event-card">
                    <div className="mobile-calendar-event-icon">{meta.icon}</div>
                    <div className="mobile-calendar-event-content">
                      <h4>
                        {event.title}
                        {event.priority && (
                          <span className={`event-priority-badge ${event.priority}`}>
                            {event.priority === 'high' ? '!' : event.priority === 'medium' ? '◆' : '○'}
                          </span>
                        )}
                      </h4>
                      <p>{meta.time}</p>
                      <p>{meta.location}</p>
                    </div>
                    <div className="mobile-calendar-event-time">{meta.time.split(' - ')[0]}</div>
                    <Button
                      type="button"
                      className="recent-file-more"
                      aria-label="Odstranit událost"
                      onClick={() => removeEvent(event.id)}
                    >
                      ×
                    </Button>
                  </article>
                )
              })
            )
          })()}
        </div>
      </section>

      <Button type="button" className="mobile-calendar-fab" aria-label="Přidat událost" onClick={addDesktopEvent}>
        +
      </Button>
    </section>
  )
}


