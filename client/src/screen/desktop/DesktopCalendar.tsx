import React from 'react'
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
  goToToday,
  addDesktopEvent,
}: DesktopCalendarScreenProps) {
  return (
    <section className="desktop-calendar-screen" id="desktop-calendar">
      <div className="desktop-calendar-head">
        <div>
          <h2>Kalendář</h2>
          <p>Správa studijních událostí a termínů.</p>
        </div>
        <div className="desktop-calendar-controls">
          <button type="button" onClick={goToToday}>Dnes</button>
          <div className="month-switch">
            <button
              type="button"
              onClick={() =>
                setDisplayMonth(
                  (prevMonth) =>
                    new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1),
                )
              }
            >
              ‹
            </button>
            <span>{monthLabel}</span>
            <button
              type="button"
              onClick={() =>
                setDisplayMonth(
                  (prevMonth) =>
                    new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1),
                )
              }
            >
              ›
            </button>
          </div>
          <button type="button" className="primary" onClick={addDesktopEvent}>
            Přidat událost
          </button>
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
                <button
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
                </button>
              )
            })}
          </div>
        </article>

        <aside className="desktop-events-panel">
          <section className="events-card">
            <h3>
              Události pro{' '}
              {new Intl.DateTimeFormat('cs-CZ', {
                month: 'short',
                day: 'numeric',
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
                        <h4>{event.title}</h4>
                        <p>{meta.time}</p>
                        <small>{meta.location}</small>
                      </div>
                      <button type="button" className="desktop-event-remove" onClick={() => removeEvent(event.id)}>
                        Odebrat
                      </button>
                    </article>
                  )
                })
              )}
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
