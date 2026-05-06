import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { cs } from 'date-fns/locale/cs'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { PlannerCalendarItem, UserRole } from '../../app/types'

type PlannerCalendarProps = {
  items: PlannerCalendarItem[]
  selectedItemId: number | null
  onSelectItem: (itemId: number) => void
  activeRole: UserRole
}

const locales = {
  cs,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const calendarMessages = {
  allDay: 'Celý den',
  previous: 'Předchozí',
  next: 'Další',
  today: 'Dnes',
  month: 'Měsíc',
  week: 'Týden',
  day: 'Den',
  agenda: 'Agenda',
  date: 'Datum',
  time: 'Čas',
  event: 'Událost',
  showMore: (total: number) => `+${total} další`,
}

const formatWindow = (start: Date, end: Date) =>
  `${format(start, 'd. M. yyyy HH:mm')} - ${format(end, 'HH:mm')}`

export function PlannerCalendar({ items, selectedItemId, onSelectItem, activeRole }: PlannerCalendarProps) {
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0] ?? null

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
        <div className="planner-calendar-grid lg:grid-cols-[minmax(0,1.4fr)_minmax(290px,0.6fr)]">
          <div className="planner-calendar-frame">
          <Calendar<PlannerCalendarItem, object>
            localizer={localizer}
            culture="cs"
            events={items}
            defaultView={Views.MONTH}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            messages={calendarMessages}
            startAccessor="start"
            endAccessor="end"
            selectable={false}
            onSelectEvent={(event: PlannerCalendarItem) => onSelectItem(event.id)}
            eventPropGetter={(event: PlannerCalendarItem) => ({
              className: `planner-event kind-${event.kind} tone-${event.color} ${event.shared ? 'is-shared' : 'is-private'}${
                event.id === selectedItemId ? ' is-selected' : ''
              }`,
            })}
            components={{
              event: ({ event }: { event: PlannerCalendarItem }) => (
                <span className="planner-event-label">
                  <strong>{event.title}</strong>
                  <small>{event.subjectCode}</small>
                </span>
              ),
            }}
            style={{ height: 640 }}
          />
          </div>

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
