import { Link } from '@tanstack/react-router'
import {
  CalendarEvent,
  Task,
} from '../../app/types'
import { CircularProgress } from './CircularProgress'
import { Checkbox } from '../ui/checkbox'

type DashboardHomeContentProps = {
  profileName: string
  tasksDone: number
  tasks: Task[]
  upcomingEvents: CalendarEvent[]
  getDeadlineMeta: (index: number) => { label: string; className: string; progress: number }
  getRelativeDaysLabel: (date: string) => string
  toggleTask: (taskId: number) => void
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
        <article className="dashboard-card dashboard-tasks-card">
          <div className="dashboard-card-header">
            <h2>Moje úkoly</h2>
            <CircularProgress
              percentage={taskPercentage}
              size={56}
              strokeWidth={5}
            />
          </div>
          <ul className="dashboard-task-list">
            {tasks.slice(0, 5).map((task) => (
              <li key={task.id} className={`dashboard-task-item ${task.done ? 'done' : ''}`}>
                <label className="dashboard-task-label">
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="size-5 shrink-0"
                  />
                  <span>{task.title}</span>
                </label>
              </li>
            ))}
          </ul>
          {tasks.length === 0 && (
            <p className="dashboard-empty">Zatím žádné úkoly. Paráda! 🎉</p>
          )}
          {tasks.length > 5 && (
            <Link to="/tasks" className="dashboard-card-link">
              Zobrazit všechny úkoly →
            </Link>
          )}
          {tasks.length > 0 && tasks.length <= 5 && (
            <Link to="/tasks" className="dashboard-card-link">
              Správa úkolů →
            </Link>
          )}
        </article>

        {/* Events card */}
        <article className="dashboard-card dashboard-events-card">
          <div className="dashboard-card-header">
            <h2>Nadcházející události</h2>
            <span className="dashboard-event-count">{upcomingEvents.length}</span>
          </div>
          <ul className="dashboard-event-list">
            {upcomingEvents.slice(0, 4).map((event, index) => {
              const meta = getDeadlineMeta(index)
              return (
                <li key={event.id} className="dashboard-event-item">
                  <div className="dashboard-event-top">
                    <span className={`dashboard-event-priority ${meta.className}`}>
                      {meta.label}
                    </span>
                    <small className="dashboard-event-date">
                      {getRelativeDaysLabel(event.date)}
                    </small>
                  </div>
                  <p className="dashboard-event-title">{event.title}</p>
                  <div className="dashboard-progress-track">
                    <span
                      className={`dashboard-progress-fill ${meta.className}`}
                      style={{ width: `${meta.progress}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
          {upcomingEvents.length === 0 && (
            <p className="dashboard-empty">Žádné nadcházející události.</p>
          )}
          <Link to="/calendar" className="dashboard-card-link">
            Otevřít kalendář →
          </Link>
        </article>
      </section>
    </div>
  )
}
