import * as React from 'react'
import { Calendar } from 'react-day-picker'
import { cs } from 'date-fns/locale'
import { format, isSameMonth, isSameDay } from 'date-fns'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Calendar as CalendarUI } from '../ui/calendar'
import { PlannerCalendarItem, UserRole } from '../../app/types'

type PlannerCalendarProps = {
  items: PlannerCalendarItem[]
  selectedItemId: number | null
  onSelectItem: (itemId: number) => void
  activeRole: UserRole
}

const formatWindow = (start: Date, end: Date) =>
  `${format(start, 'd. M. yyyy HH:mm', { locale: cs })} - ${format(end, 'HH:mm', { locale: cs })}`

export function PlannerCalendar({ items, selectedItemId, onSelectItem, activeRole }: PlannerCalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0] ?? null

  // Get events for the selected month
  const monthEvents = items.filter((item) => isSameMonth(item.start, selectedDate))
  
  // Get events for the selected day
  const dayEvents = items.filter((item) => isSameDay(item.start, selectedDate))

  // Get unique dates that have events for highlighting
  const eventDates = new Set(items.map((item) => format(item.start, 'yyyy-MM-dd')))

  return (
    <Card className="planner-calendar-panel border-0 bg-white/80 shadow-[0_20px_60px_rgba(31,24,18,0.12)] backdrop-blur-xl">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Kalendář</p>
            <CardTitle className="mt-1 text-3xl">Lekce a události</CardTitle>
          </div>
          <Badge variant={activeRole === 'student' ? 'default' : activeRole === 'registered' ? 'secondary' : 'outline'}>
            {activeRole === 'student' ? 'Správce' : activeRole === 'registered' ? 'Registrovaný' : 'Veřejnost'}
          </Badge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {activeRole === 'student'
            ? 'Student vidí všechny položky včetně privátních.'
            : activeRole === 'registered'
              ? 'Registrovaný uživatel vidí jen sdílený obsah.'
              : 'Veřejnost vidí pouze veřejně sdílené lekce a události.'}
        </p>
      </CardHeader>

      <CardContent>
        <div className="planner-calendar-grid lg:grid-cols-[minmax(0,1.4fr)_minmax(290px,0.6fr)] gap-6">
          <div className="planner-calendar-frame space-y-4">
            {/* Calendar */}
            <CalendarUI
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={cs}
              disabled={(date) => false}
              modifiers={{
                hasEvent: (date) => eventDates.has(format(date, 'yyyy-MM-dd')),
              }}
              modifiersStyles={{
                hasEvent: {
                  fontWeight: 'bold',
                  backgroundColor: 'var(--accent)',
                },
              }}
              className="w-full rounded-lg border"
            />

            {/* Month Events List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Všechny události v {format(selectedDate, 'LLLL yyyy', { locale: cs })}
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {monthEvents.length > 0 ? (
                  monthEvents.map((item) => (
                    <Button
                      key={item.id}
                      variant={selectedItemId === item.id ? 'default' : 'outline'}
                      className={`w-full justify-start text-left kind-${item.kind} tone-${item.color} ${
                        item.shared ? 'is-shared' : 'is-private'
                      }`}
                      onClick={() => onSelectItem(item.id)}
                    >
                      <div className="flex flex-col gap-1 text-xs">
                        <strong className="text-sm">{item.title}</strong>
                        <span className="opacity-75">{format(item.start, 'd. M. HH:mm', { locale: cs })}</span>
                      </div>
                    </Button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Žádné události v tomto měsíci.</p>
                )}
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          <aside className="planner-calendar-detail space-y-4">
            {selectedItem ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={selectedItem.kind === 'lesson' ? 'secondary' : 'outline'}>
                    {selectedItem.kind === 'lesson' ? 'Lekce' : 'Událost'}
                  </Badge>
                  <Badge variant={selectedItem.shared ? 'outline' : 'default'}>
                    {selectedItem.shared ? 'Sdílené' : 'Soukromé'}
                  </Badge>
                </div>
                <h4 className="text-xl font-semibold">{selectedItem.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedItem.subjectCode} · {selectedItem.subjectTitle}
                </p>
                <p className="text-sm">{formatWindow(selectedItem.start, selectedItem.end)}</p>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="text-sm font-semibold">{selectedItem.location}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedItem.description}</p>
                </div>

                {/* Day Events */}
                {dayEvents.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <h5 className="font-semibold text-sm">Další od {format(selectedDate, 'P', { locale: cs })}</h5>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {dayEvents.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onSelectItem(item.id)}
                          className={`w-full text-left px-2 py-1 rounded text-xs hover:bg-muted transition-colors ${
                            selectedItemId === item.id ? 'bg-muted font-semibold' : ''
                          }`}
                        >
                          <div>{item.title}</div>
                          <div className="text-muted-foreground">
                            {format(item.start, 'HH:mm')} - {format(item.end, 'HH:mm')}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Žádná položka není vybraná.</p>
            )}
          </aside>
        </div>
      </CardContent>
    </Card>
  )
}
