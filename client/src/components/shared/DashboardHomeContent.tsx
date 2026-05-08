import { Link } from '@tanstack/react-router'
import {
  CalendarEvent,
  Task,
} from '../../app/types'
import { CircularProgress } from './CircularProgress'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import { Button } from '../ui/button'

type DashboardHomeContentProps = {
  profileName: string
  tasksDone: number
  tasks: Task[]
  upcomingEvents: CalendarEvent[]
  getDeadlineMeta: (index: number) => { label: string; className: string; progress: number }
  getRelativeDaysLabel: (date: string) => string
  toggleTask: (taskId: number) => void
  onEventClick: (dateIso: string) => void
  subjectsCount?: number
  filesCount?: number
}

export function DashboardHomeContent({
  profileName,
  tasksDone,
  tasks,
  upcomingEvents,
  getDeadlineMeta,
  getRelativeDaysLabel,
  toggleTask,
  onEventClick,
  subjectsCount = 0,
  filesCount = 0,
}: DashboardHomeContentProps) {
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Dobré ráno' : now.getHours() < 18 ? 'Dobré odpoledne' : 'Dobrý večer'
  const dateLabel = new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)

  const taskPercentage = tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0

  return (
    <div className="dashboard-home">
      {/* Welcome header */}
      <header className="dashboard-home-header">
        <div>
          <h1 className="dashboard-home-greeting">
            {greeting}, <span className="dashboard-home-name">{profileName || 'studente'}</span>!
          </h1>
          <p className="dashboard-home-date">{dateLabel}</p>
        </div>
      </header>

      {/* Stat cards */}
      <section className="dashboard-stat-cards">
        <Link to="/study" className="dashboard-stat-card stat-subjects">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <span className="stat-value">{subjectsCount}</span>
            <span className="stat-label">Předměty</span>
          </div>
        </Link>
        <Link to="/tasks" className="dashboard-stat-card stat-tasks">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{tasksDone}/{tasks.length}</span>
            <span className="stat-label">Splněno úkolů</span>
          </div>
        </Link>
        <Link to="/calendar" className="dashboard-stat-card stat-events">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <span className="stat-value">{upcomingEvents.length}</span>
            <span className="stat-label">Nadcházející</span>
          </div>
        </Link>
        <Link to="/files" className="dashboard-stat-card stat-files">
          <div className="stat-icon">📁</div>
          <div className="stat-info">
            <span className="stat-value">{filesCount}</span>
            <span className="stat-label">Soubory</span>
          </div>
        </Link>
      </section>

      {/* Main content grid */}
      <section className="dashboard-content-grid">
        {/* Tasks card */}
        <Card className="dashboard-tasks-card border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">Moje úkoly</CardTitle>
            <CircularProgress
              percentage={taskPercentage}
              size={68}
              strokeWidth={5}
            />
          </CardHeader>
          <CardContent className="flex flex-col flex-1">
            <ul className="dashboard-task-list my-auto py-2 flex flex-col gap-2">
              {tasks.slice(0, 5).map((task) => (
                <li key={task.id} className={`group flex items-center gap-4 p-3 rounded-lg border border-transparent hover:border-border/60 hover:bg-muted/40 transition-all ${task.done ? 'opacity-60' : ''}`}>
                  <Checkbox
                    id={`dash-task-${task.id}`}
                    checked={task.done}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="scale-125 ml-1"
                  />
                  <label htmlFor={`dash-task-${task.id}`} className={`flex-1 cursor-pointer select-none text-base leading-tight transition-all ${task.done ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                    {task.title}
                  </label>
                </li>
              ))}
            </ul>
            {tasks.length === 0 && (
              <p className="text-base text-muted-foreground my-auto">Zatím žádné úkoly. Paráda! 🎉</p>
            )}
            <div className="mt-auto pt-4">
              {tasks.length > 5 && (
                <Button variant="link" asChild className="p-0 h-auto font-medium">
                  <Link to="/tasks">
                    Zobrazit všechny úkoly →
                  </Link>
                </Button>
              )}
              {tasks.length > 0 && tasks.length <= 5 && (
                <Button variant="link" asChild className="p-0 h-auto font-medium">
                  <Link to="/tasks">
                    Správa úkolů →
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Events card */}
        <Card className="dashboard-events-card border-none shadow-sm self-start">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">Nadcházející události</CardTitle>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">{upcomingEvents.length}</span>
          </CardHeader>
          <CardContent className="flex flex-col">
            <ul className="dashboard-event-list mt-4 flex flex-col gap-2">
              {upcomingEvents.slice(0, 4).map((event, index) => {
                const meta = getDeadlineMeta(index)
                const eventDate = new Date(event.date)
                const day = eventDate.getDate()
                const month = eventDate.toLocaleDateString('cs-CZ', { month: 'short' })
                
                const bgColorClass = meta.className === 'high' ? 'bg-destructive/10 text-destructive border-destructive/20' : meta.className === 'medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-primary/10 text-primary border-primary/20'
                
                return (
                  <li 
                    key={event.id} 
                    className="flex items-start gap-3 p-2.5 rounded-lg border border-transparent hover:border-border/60 hover:bg-muted/40 transition-all group cursor-pointer"
                    onClick={() => onEventClick(event.date)}
                  >
                    <div className={`flex flex-col items-center justify-center min-w-[3rem] h-12 rounded-md border ${bgColorClass}`}>
                      <span className="text-[0.65rem] uppercase font-bold leading-none">{month}</span>
                      <span className="text-lg font-black leading-tight mt-0.5">{day}</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`font-semibold text-sm truncate ${meta.className === 'high' ? 'text-destructive' : ''}`}>{event.title}</p>
                        <small className="text-muted-foreground text-sm font-medium whitespace-nowrap shrink-0 mt-0.5">
                          {getRelativeDaysLabel(event.date)}
                        </small>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        {event.time && <span className="font-medium text-foreground/80">{event.time.split(' - ')[0]}</span>}
                        {event.time && event.location && <span>•</span>}
                        {event.location && <span className="truncate">{event.location}</span>}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
            {upcomingEvents.length === 0 && (
              <p className="text-base text-muted-foreground my-auto">Žádné nadcházející události.</p>
            )}
            <div className="mt-auto pt-4">
              <Button variant="link" asChild className="p-0 h-auto font-medium">
                <Link to="/calendar">
                  Otevřít kalendář →
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
