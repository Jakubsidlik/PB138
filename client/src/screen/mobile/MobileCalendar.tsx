import React from 'react'
import { Button } from '../../components/ui/button'
import { CalendarCell, CalendarEvent, EventMeta } from '../../app/types'
import { CalendarEventList } from '../../components/shared/CalendarEventList'
import { MonthSwitcher } from '../../components/shared/MonthSwitcher'
import { EventFilterButtons } from '../../components/shared/EventFilterButtons'
import { filterEventsByTime, formatCzechDate } from '../../components/shared/calendarUtils'

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
          <MonthSwitcher
            monthLabel={monthLabel}
            setDisplayMonth={setDisplayMonth}
            className="mobile-calendar-month-head"
            prevClassName="mobile-month-arrow"
            nextClassName="mobile-month-arrow"
          />

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
          <span>{formatCzechDate(selectedDateIso)}</span>
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

        <EventFilterButtons eventFilter={eventFilter} onFilterChange={setEventFilter} />

        <CalendarEventList
          events={filterEventsByTime(eventsByDate, eventFilter)}
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


