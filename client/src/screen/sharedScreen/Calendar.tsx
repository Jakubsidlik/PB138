import React from 'react'
import { CalendarCell, CalendarEvent, EventMeta } from '../../app/types'
import { formatDateIso } from '../../app/utils'

type CalendarScreenProps = {
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
  addDesktopEvent: () => void
  goToToday?: () => void // Pokud byste chtěla využít později
}

export function UnifiedCalendarScreen({
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
}: CalendarScreenProps) {
  const [eventFilter, setEventFilter] = React.useState<'future' | 'past'>('future')

  // Filtrace událostí
  const filteredEvents = React.useMemo(() => {
    const today = formatDateIso(new Date())
    const allEvents = Object.values(eventsByDate).flat()
    return allEvents.filter((event) => {
      const eventDate = event.date || Object.keys(eventsByDate).find((date) => eventsByDate[date]?.some((e) => e.id === event.id))
      const isInFuture = eventDate && eventDate >= today
      return eventFilter === 'future' ? isInFuture : !isInFuture
    })
  }, [eventsByDate, eventFilter])

  return (
    // Hlavní část
    <section className="flex flex-col md:flex-row gap-6 p-4 max-w-7xl mx-auto w-full">
      
      {/* LEVÁ ČÁST: Samotný Kalendář */}
      <div className="flex-1 flex flex-col">
        {/* Hlavička kalendáře */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold hidden md:block">Kalendář</h2>
            <h3 className="text-xl font-bold md:hidden">{monthLabel}</h3>
            <p className="text-gray-500 hidden md:block">Správa studijních událostí a termínů.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button 
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
                onClick={() => setDisplayMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              >
                ‹
              </button>
              <span className="font-medium hidden md:block">{monthLabel}</span>
              <button 
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded"
                onClick={() => setDisplayMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              >
                ›
              </button>
            </div>
            {/* Tlačítko Přidat: Na mobilu skryté (řeší to FAB dole), na desktopu viditelné */}
            <button className="hidden md:block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={addDesktopEvent}>
              Přidat událost
            </button>
          </div>
        </div>

        {/* Mřížka kalendáře */}
        <div className="border rounded-lg overflow-hidden bg-white">
          {/* Dny v týdnu */}
          <div className="grid grid-cols-7 bg-gray-50 border-b text-center text-sm font-medium text-gray-500 py-2">
            {calendarWeekDays.map((dayLabel) => (
              <div key={dayLabel}>
                <span className="hidden md:inline">{dayLabel}</span>
                <span className="md:hidden">{dayLabel[0]}</span> {/* Na mobilu jen první písmeno */}
              </div>
            ))}
          </div>

          {/* Dny v měsíci */}
          <div className="grid grid-cols-7 auto-rows-[60px] md:auto-rows-[100px] border-l border-t">
            {calendarCells.map((cell) => {
              const dayEvents = eventsByDate[cell.iso] ?? []
              const isToday = cell.iso === formatDateIso(new Date())
              const isSelected = cell.iso === selectedDateIso

              return (
                <button
                  key={cell.iso}
                  className={`border-b border-r p-1 md:p-2 flex flex-col items-start transition-colors relative
                    ${cell.inCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                    ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : 'hover:bg-gray-50'}
                  `}
                  onClick={() => {
                    setSelectedDateIso(cell.iso)
                    setDisplayMonth(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1))
                  }}
                >
                  <span className={`text-sm md:text-base font-medium ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                    {cell.date.getDate()}
                  </span>
                  
                  {/* Indikátory událostí pro mobil (tečky) */}
                  <div className="md:hidden flex gap-1 mt-auto mx-auto pb-1">
                    {dayEvents.length > 0 && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                  </div>

                  {/* Štítky událostí pro desktop (texty) */}
                  <div className="hidden md:flex flex-col gap-1 w-full mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((dayEvent) => (
                      <span key={dayEvent.id} className="text-xs truncate bg-blue-100 text-blue-800 px-1 py-0.5 rounded w-full text-left">
                        {dayEvent.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-xs text-gray-500 text-left">+{dayEvents.length - 2} další</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* PRAVÁ ČÁST: Seznam událostí (Na mobilu se zařadí pod kalendář) */}
      <aside className="w-full md:w-80 flex flex-col gap-6">
        
        {/* Sekce: Události pro vybraný den */}
        <section className="bg-white p-4 rounded-lg border">
          <h3 className="font-bold mb-4 border-b pb-2">
            Události dne: {new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'short' }).format(new Date(selectedDateIso))}
          </h3>
          <div className="flex flex-col gap-3">
            {selectedDayEvents.length === 0 ? (
              <p className="text-sm text-gray-500">Pro vybraný den nejsou žádné události.</p>
            ) : (
              selectedDayEvents.map((event) => {
                const meta = eventMetaById[event.id] ?? getDefaultMetaForTitle(event.title)
                return (
                  <article key={event.id} className="flex gap-3 items-start p-3 bg-gray-50 rounded border">
                    <div className="text-xl">{meta.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{event.title}</h4>
                      <p className="text-xs text-gray-600">{meta.time}</p>
                      <p className="text-xs text-gray-500">{meta.location}</p>
                    </div>
                    <button className="text-gray-400 hover:text-red-500" onClick={() => removeEvent(event.id)}>✕</button>
                  </article>
                )
              })
            )}
          </div>
        </section>

        {/* Sekce: Všechny události */}
        <section className="bg-white p-4 rounded-lg border">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="font-bold">Přehled</h3>
            <div className="flex gap-2 text-sm">
              <button className={`px-2 py-1 rounded ${eventFilter === 'future' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`} onClick={() => setEventFilter('future')}>Budoucí</button>
              <button className={`px-2 py-1 rounded ${eventFilter === 'past' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`} onClick={() => setEventFilter('past')}>Minulé</button>
            </div>
          </div>
          <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <p className="text-sm text-gray-500">Žádné události.</p>
            ) : (
              filteredEvents.map((event) => {
                const meta = eventMetaById[event.id] ?? getDefaultMetaForTitle(event.title)
                return (
                  <article key={event.id} className="flex gap-3 items-start p-3 bg-gray-50 rounded border">
                    <div className="text-xl">{meta.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{event.title}</h4>
                      <p className="text-xs text-gray-600">{meta.time}</p>
                    </div>
                    <button className="text-gray-400 hover:text-red-500" onClick={() => removeEvent(event.id)}>✕</button>
                  </article>
                )
              })
            )}
          </div>
        </section>

      </aside>

      {/* FAB: Floating Action Button jen pro mobil */}
      <button 
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg text-2xl flex items-center justify-center hover:bg-blue-700 z-50"
        onClick={addDesktopEvent}
      >
        +
      </button>
    </section>
  )
}