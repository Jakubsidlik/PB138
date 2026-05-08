import React, { useState } from 'react'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { CalendarCell, CalendarEvent, EventMeta } from '../app/types'
import { formatDateIso } from '../app/utils'
import { CalendarEventList } from '../components/shared/CalendarEventList'
import { MonthSwitcher } from '../components/shared/MonthSwitcher'
import { EventFilterButtons } from '../components/shared/EventFilterButtons'
import { filterEventsByTime, formatCzechDate } from '../components/shared/calendarUtils'

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
  addDesktopEvent: (eventData: { title: string, time: string, location: string, priority: 'low' | 'medium' | 'high' }) => void
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
  const [eventFilter, setEventFilter] = useState<'future' | 'past'>('future')
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', timeFrom: '', timeTo: '', isAllDay: false, location: '', priority: 'medium' as 'low' | 'medium' | 'high' })

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.title.trim()) return
    
    let time = ''
    if (newEvent.isAllDay) {
      time = '00:00 - 23:59'
    } else {
      time = (newEvent.timeFrom || newEvent.timeTo) 
        ? `${newEvent.timeFrom || '??:??'} - ${newEvent.timeTo || '??:??'}`
        : ''
    }

    addDesktopEvent({
      title: newEvent.title,
      time,
      location: newEvent.location,
      priority: newEvent.priority
    })
    setNewEvent({ title: '', timeFrom: '', timeTo: '', isAllDay: false, location: '', priority: 'medium' })
    setIsAddEventOpen(false)
  }
  return (
    <section className="flex flex-col gap-6" id="desktop-calendar">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Kalendář</h2>
          <p className="text-muted-foreground">Správa studijních událostí a termínů.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthSwitcher monthLabel={monthLabel} setDisplayMonth={setDisplayMonth} />
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button type="button">
                + Přidat událost
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddEvent}>
                <DialogHeader>
                  <DialogTitle>Nová událost</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Název</label>
                    <Input 
                      value={newEvent.title} 
                      onChange={e => setNewEvent({...newEvent, title: e.target.value})} 
                      autoFocus 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-sm font-medium">Čas od</label>
                        <Input 
                          type="time"
                          lang="cs-CZ"
                          value={newEvent.timeFrom} 
                          onChange={e => setNewEvent({...newEvent, timeFrom: e.target.value})} 
                          required={!newEvent.isAllDay}
                          disabled={newEvent.isAllDay}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-sm font-medium">Čas do</label>
                        <Input 
                          type="time"
                          lang="cs-CZ"
                          value={newEvent.timeTo} 
                          onChange={e => setNewEvent({...newEvent, timeTo: e.target.value})} 
                          required={!newEvent.isAllDay}
                          disabled={newEvent.isAllDay}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Checkbox 
                        id="isAllDay" 
                        checked={newEvent.isAllDay} 
                        onCheckedChange={(checked) => setNewEvent({...newEvent, isAllDay: checked === true})} 
                      />
                      <label htmlFor="isAllDay" className="text-sm cursor-pointer select-none">
                        Bez určení času (celý den)
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Místo</label>
                    <Input 
                      value={newEvent.location} 
                      onChange={e => setNewEvent({...newEvent, location: e.target.value})} 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Priorita</label>
                    <Select 
                      value={newEvent.priority} 
                      onValueChange={(val: 'low'|'medium'|'high') => setNewEvent({...newEvent, priority: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte prioritu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Nízká</SelectItem>
                        <SelectItem value="medium">Střední</SelectItem>
                        <SelectItem value="high">Vysoká</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={!newEvent.title.trim()}>Přidat</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <article className="rounded-xl border shadow-sm bg-card p-4 sm:p-6 flex flex-col gap-2">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {calendarWeekDays.map((dayLabel) => (
              <div key={dayLabel} className="text-center text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {dayLabel.slice(0, 2)}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell) => {
              const dayEvents = eventsByDate[cell.iso] ?? []
              const isToday = cell.iso === formatDateIso(new Date())
              const isSelected = cell.iso === selectedDateIso

              let cellClasses = "flex flex-col items-center sm:items-start p-1 sm:p-2 min-h-[60px] sm:min-h-[90px] rounded-lg border transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              if (!cell.inCurrentMonth) cellClasses += " opacity-40 bg-muted/30"
              else cellClasses += " bg-background"
              if (isSelected) cellClasses += " ring-2 ring-primary border-primary"
              
              let numberClasses = "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1"
              if (isToday) numberClasses += " bg-primary text-primary-foreground"

              return (
                <button
                  key={cell.iso}
                  type="button"
                  className={cellClasses}
                  onClick={() => {
                    setSelectedDateIso(cell.iso)
                    setDisplayMonth(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1))
                  }}
                >
                  <span className={numberClasses}>{cell.date.getDate()}</span>
                  <div className="flex flex-col gap-1 w-full overflow-hidden">
                    {dayEvents.slice(0, 2).map((dayEvent) => (
                      <span key={dayEvent.id} className="text-[10px] sm:text-xs truncate w-full px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium" title={dayEvent.title}>
                        {dayEvent.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[10px] text-muted-foreground font-medium pl-1">+{dayEvents.length - 2} další</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </article>

        <aside className="flex flex-col gap-6 w-full">
          <section className="rounded-xl border shadow-sm bg-card flex flex-col">
            <div className="p-4 sm:p-6 border-b">
              <h3 className="font-semibold text-lg">
                Události pro {formatCzechDate(selectedDateIso)}
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              <CalendarEventList
                events={selectedDayEvents}
                eventMetaById={eventMetaById}
                getDefaultMetaForTitle={getDefaultMetaForTitle}
                emptyMessage="Pro vybraný den nejsou žádné události."
                listClassName="flex flex-col gap-3"
                itemClassName="flex gap-3 items-start p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                iconClassName="mt-0.5"
                contentClassName="flex-1 min-w-0"
                removeButtonClassName="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                onRemoveEvent={removeEvent}
              />
            </div>
          </section>

          <section className="rounded-xl border shadow-sm bg-card flex flex-col">
            <div className="p-4 sm:p-6 border-b flex flex-wrap justify-between items-center gap-4">
              <h3 className="font-semibold text-lg">Všechny události</h3>
              <EventFilterButtons eventFilter={eventFilter} onFilterChange={setEventFilter} />
            </div>
            <div className="p-4 sm:p-6">
              <CalendarEventList
                events={filterEventsByTime(eventsByDate, eventFilter)}
                eventMetaById={eventMetaById}
                getDefaultMetaForTitle={getDefaultMetaForTitle}
                emptyMessage={eventFilter === 'future' ? 'Žádné budoucí události.' : 'Žádné minulé události.'}
                listClassName="flex flex-col gap-3"
                itemClassName="flex gap-3 items-start p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                iconClassName="mt-0.5"
                contentClassName="flex-1 min-w-0"
                removeButtonClassName="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                showDate={true}
                onRemoveEvent={removeEvent}
              />
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}


