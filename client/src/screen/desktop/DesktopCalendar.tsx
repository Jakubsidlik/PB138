import React from 'react'
import { Button } from '../../components/ui/button'
import { CalendarCell, CalendarEvent, EventMeta } from '../../app/types'
import { formatDateIso } from '../../app/utils'
import { CalendarEventList } from '../../components/shared/CalendarEventList'
import { MonthSwitcher } from '../../components/shared/MonthSwitcher'
import { EventFilterButtons } from '../../components/shared/EventFilterButtons'
import { filterEventsByTime, formatCzechDate } from '../../components/shared/calendarUtils'

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
          <MonthSwitcher monthLabel={monthLabel} setDisplayMonth={setDisplayMonth} />
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
              {formatCzechDate(selectedDateIso)}
            </h3>

            <CalendarEventList
              events={selectedDayEvents}
              eventMetaById={eventMetaById}
              getDefaultMetaForTitle={getDefaultMetaForTitle}
              emptyMessage="Pro vybraný den nejsou žádné události."
              listClassName="events-list-desktop"
              itemClassName="desktop-event-item"
              iconClassName="desktop-event-icon"
              contentClassName="desktop-event-content"
              removeButtonClassName="desktop-event-remove"
              onRemoveEvent={removeEvent}
            />
          </section>

          <section className="events-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Události</h3>
              <EventFilterButtons eventFilter={eventFilter} onFilterChange={setEventFilter} />
            </div>

            <CalendarEventList
              events={filterEventsByTime(eventsByDate, eventFilter)}
              eventMetaById={eventMetaById}
              getDefaultMetaForTitle={getDefaultMetaForTitle}
              emptyMessage={eventFilter === 'future' ? 'Žádné budoucí události.' : 'Žádné minulé události.'}
              listClassName="events-list-desktop"
              itemClassName="desktop-event-item"
              iconClassName="desktop-event-icon"
              contentClassName="desktop-event-content"
              removeButtonClassName="desktop-event-remove"
              onRemoveEvent={removeEvent}
            />
          </section>
        </aside>
      </div>
    </section>
  )
}


