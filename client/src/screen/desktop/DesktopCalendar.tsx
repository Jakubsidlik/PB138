import React from 'react'
import { Button } from '../../components/ui/button'
import { CalendarCell, CalendarEvent, EventMeta } from '../../app/types'
import { formatDateIso } from '../../app/utils'

type DesktopCalendarScreenProps = {
  monthLabel: string
  calendarWeekDays: string[]
  calendarCells: CalendarCell[]
  eventsByDate: Record<string, CalendarEvent[]>
  selectedDateIso: string
  setSelectedDateIso: React.Dispatch<React.SetStateAction<string>>
  setDisplayMonth: React.Dispatch<React.SetStateAction<Date>>
  selectedDayEvents: CalendarEvent[]
  eventMetaById: Record<number, EventMeta>
  getDefaultMetaForTitle: (title: string) => EventMeta
  removeEvent: (eventId: number) => void
  goToToday: () => void
  addDesktopEvent: () => void
}

export function DesktopCalendarScreen({
  monthLabel,
  calendarWeekDays,
  calendarCells,
  eventsByDate,
  selectedDateIso,
  setSelectedDateIso,
  setDisplayMonth,
  selectedDayEvents,
  eventMetaById,
  getDefaultMetaForTitle,
  removeEvent,
  addDesktopEvent,
}: DesktopCalendarScreenProps) {
  const [eventFilter, setEventFilter] = React.useState<'future' | 'past'>('future')
  return (
    <section className="desktop-calendar-screen" id="desktop-calendar">
      <div className="desktop-calendar-head">
        <div>
          <h2>Kalendář</h2>
          <p>Správa studijních událostí a termínů.</p>
        </div>
        <div className="desktop-calendar-controls">
          <div className="month-switch">
            <Button
              type="button"
              onClick={() =>
                setDisplayMonth(
                  (prevMonth) =>
                    new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1),
                )
              }
            >
              ‹
            </Button>
            <span>{monthLabel}</span>
            <Button
              type="button"
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
          <Button type="button" className="primary" onClick={addDesktopEvent}>
            Přidat událost
          </Button>
        </div>
      </div>

      <div className="desktop-calendar-grid-wrap">
        <article className="desktop-month-grid">
          <div className="weekdays-row">
            {calendarWeekDays.map((dayLabel) => (
              <div key={dayLabel}>{dayLabel}</div>
            ))}
          </div>

          <div className="month-cells-grid">
            {calendarCells.map((cell) => {
              const dayEvents = eventsByDate[cell.iso] ?? []
              const isToday = cell.iso === formatDateIso(new Date())
              const isSelected = cell.iso === selectedDateIso

              return (
                <Button
                  key={cell.iso}
                  type="button"
                  className={`month-cell ${cell.inCurrentMonth ? '' : 'muted'} ${
                    isToday ? 'today' : ''
                  } ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedDateIso(cell.iso)
                    setDisplayMonth(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1))
                  }}
                >
                  <span className="day-number">{cell.date.getDate()}</span>
                  <div className="day-events-preview">
                    {dayEvents.slice(0, 2).map((dayEvent) => (
                      <span key={dayEvent.id} className="event-pill" title={dayEvent.title}>
                        {dayEvent.title}
                      </span>
                    ))}
                  </div>
                </Button>
              )
            })}
          </div>
        </article>

        <aside className="desktop-events-panel">
          <section className="events-card">
            <h3>
              Události pro{' '}
              {new Intl.DateTimeFormat('cs-CZ', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(new Date(selectedDateIso))}
            </h3>

            <div className="events-list-desktop">
              {selectedDayEvents.length === 0 ? (
                <p className="empty-events">Pro vybraný den nejsou žádné události.</p>
              ) : (
                selectedDayEvents.map((event) => {
                  const meta = eventMetaById[event.id] ?? getDefaultMetaForTitle(event.title)
                  return (
                    <article key={event.id} className={`desktop-event-item accent-${meta.accent}`}>
                      <div className="desktop-event-icon">{meta.icon}</div>
                      <div className="desktop-event-content">
                        <h4>
                          {event.title}
                          {event.priority && (
                            <span className={`event-priority-badge ${event.priority}`}>
                              {event.priority === 'high' ? '!' : event.priority === 'medium' ? '◆' : '○'}
                            </span>
                          )}
                        </h4>
                        <p>{meta.time}</p>
                        <small>{meta.location}</small>
                      </div>
                      <Button type="button" className="desktop-event-remove" onClick={() => removeEvent(event.id)}>
                        Odebrat
                      </Button>
                    </article>
                  )
                })
              )}
            </div>
          </section>

          <section className="events-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Události</h3>
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
            </div>

            <div className="events-list-desktop">
              {(() => {
                const today = formatDateIso(new Date())
                const allEvents = Object.values(eventsByDate).flat()
                const filteredEvents = allEvents.filter((event) => {
                  const eventDate = event.date || Object.keys(eventsByDate).find((date) => eventsByDate[date]?.some((e) => e.id === event.id))
                  const isInFuture = eventDate && eventDate >= today
                  return eventFilter === 'future' ? isInFuture : !isInFuture
                })

                return filteredEvents.length === 0 ? (
                  <p className="empty-events">
                    {eventFilter === 'future' ? 'Žádné budoucí události.' : 'Žádné minulé události.'}
                  </p>
                ) : (
                  filteredEvents.map((event) => {
                    const meta = eventMetaById[event.id] ?? getDefaultMetaForTitle(event.title)
                    return (
                      <article key={event.id} className={`desktop-event-item accent-${meta.accent}`}>
                        <div className="desktop-event-icon">{meta.icon}</div>
                        <div className="desktop-event-content">
                          <h4>
                            {event.title}
                            {event.priority && (
                              <span className={`event-priority-badge ${event.priority}`}>
                                {event.priority === 'high' ? '!' : event.priority === 'medium' ? '◆' : '○'}
                              </span>
                            )}
                          </h4>
                          <p>{meta.time}</p>
                          <small>{meta.location}</small>
                        </div>
                        <Button type="button" className="desktop-event-remove" onClick={() => removeEvent(event.id)}>
                          Odebrat
                        </Button>
                      </article>
                    )
                  })
                )
              })()}
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}


