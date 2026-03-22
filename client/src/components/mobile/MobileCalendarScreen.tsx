import React from 'react'
import { CalendarCell, CalendarEvent, EventMeta } from '../../app/types'

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
  return (
    <section className="mobile-calendar-screen" id="calendar-mobile">
      <div className="mobile-calendar-panel">
        <div className="mobile-calendar-month-head">
          <button
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
          </button>
          <h3>{monthLabel}</h3>
          <button
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
          </button>
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
              <button
                key={cell.iso}
                type="button"
                className={`mobile-month-cell ${cell.inCurrentMonth ? '' : 'muted'} ${
                  isSelected ? 'selected' : ''
                }`}
                onClick={() => setSelectedDateIso(cell.iso)}
              >
                <span>{cell.date.getDate()}</span>
                {dayEvents.length > 0 ? <i /> : null}
              </button>
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
                    <h4>{event.title}</h4>
                    <p>{meta.location}</p>
                  </div>
                  <div className="mobile-calendar-event-time">{meta.time.split(' - ')[0]}</div>
                  <button
                    type="button"
                    className="recent-file-more"
                    aria-label="Odstranit událost"
                    onClick={() => removeEvent(event.id)}
                  >
                    ×
                  </button>
                </article>
              )
            })
          )}
        </div>
      </section>

      <button type="button" className="mobile-calendar-fab" aria-label="Přidat událost" onClick={addDesktopEvent}>
        +
      </button>
    </section>
  )
}
