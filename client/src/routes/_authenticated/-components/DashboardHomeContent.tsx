import React from 'react'
import {
  CalendarEvent,
  Task,
} from '../../../app/types'
import { CircularProgress } from './CircularProgress'

type DashboardHomeContentProps = {
  profileName: string
  tasksDone: number
  tasks: Task[]
  upcomingEvents: CalendarEvent[]
  getDeadlineMeta: (index: number) => { label: string; className: string; progress: number }
  getRelativeDaysLabel: (date: string) => string
  toggleTask: (taskId: number) => void
}

export function DashboardHomeContent({
  profileName,
  tasksDone,
  tasks,
  upcomingEvents,
  getDeadlineMeta,
  getRelativeDaysLabel,
  toggleTask,
}: DashboardHomeContentProps) {
  return (
    <div className="mobile-dashboard-content desktop-dashboard-content">
      <section className="welcome">
        <div>
          <h2>Ahoj, {profileName || 'studente'}!</h2>
        </div>
      </section>

      <section className="stats-grid">
        <article className="card" id="tasks-card">
          <div className="tasks-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Úkoly</h3>
              <p>
                Dokončeno {tasksDone} z {tasks.length} úkolů.
              </p>
            </div>
            <CircularProgress 
              percentage={tasks.length > 0 ? (tasksDone / tasks.length) * 100 : 0}
              size={100}
              strokeWidth={8}
            />
          </div>
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id}>
                <label>
                  <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
                  <span className={task.done ? 'done' : ''}>{task.title}</span>
                </label>
              </li>
            ))}
          </ul>
          {tasks.length === 0 ? <p>Zatím nejsou evidované žádné úkoly.</p> : null}
        </article>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="deadlines-card">
            <h3>Kalendář - Nadcházející termíny</h3>
            <ul>
              {upcomingEvents.slice(0, 4).map((event, index) => {
                const meta = getDeadlineMeta(index)
                return (
                  <li key={event.id}>
                    <div className="deadline-top">
                      <span className={`deadline-priority ${meta.className}`}>{meta.label}</span>
                      <small>{getRelativeDaysLabel(event.date)}</small>
                    </div>
                    <p>{event.title}</p>
                    <small>{event.date}</small>
                    <div className="deadline-progress-track">
                      <span className={`deadline-progress-fill ${meta.className}`} style={{ width: `${meta.progress}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
            {upcomingEvents.length === 0 ? <p>Zatím nejsou naplánované žádné události.</p> : null}
          </section>
        </div>

      </section>
    </div>
  )
}
