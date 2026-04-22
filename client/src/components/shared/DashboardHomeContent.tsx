import {
  CalendarEvent,
  ManagedFile,
  Subject,
  Task,
} from '../../app/types'
import { CircularProgress } from './CircularProgress'

type DashboardHomeContentProps = {
  profileName: string
  tasksDone: number
  tasks: Task[]
  upcomingEvents: CalendarEvent[]
  getDeadlineMeta: (index: number) => { label: string; className: string; progress: number }
  getRelativeDaysLabel: (date: string) => string
  managedFiles: ManagedFile[]
  subjects: Subject[]
  toggleTask: (taskId: number) => void
}

export function DashboardHomeContent({
  profileName,
  tasksDone,
  tasks,
  upcomingEvents,
  getDeadlineMeta,
  getRelativeDaysLabel,
  managedFiles,
  subjects,
  toggleTask,
}: DashboardHomeContentProps) {
  return (
    <div className="mobile-dashboard-content desktop-dashboard-content">
      <section className="welcome">
        <div>
          <h2>Ahoj, {profileName || 'studente'}!</h2>
          <p>Přehled studijních dat podle předmětů, úkolů, kalendáře a souborů.</p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="progress-card">
          <div>
            <p className="eyebrow">Postup</p>
            <h3>Úkoly</h3>
            <p>
              Dokončeno {tasksDone} z {tasks.length} úkolů.
            </p>
          </div>
          <CircularProgress 
            percentage={tasks.length > 0 ? (tasksDone / tasks.length) * 100 : 0}
            size={140}
            strokeWidth={10}
          />
        </article>

        <article className="deadlines-card">
          <h3>Nadcházející termíny</h3>
          <ul>
            {upcomingEvents.slice(0, 3).map((event, index) => {
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
        </article>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <article className="card" id="calendar-overview">
            <h3>Kalendář</h3>
            <ul className="file-list">
              {upcomingEvents.slice(0, 4).map((event) => (
                <li key={event.id}>
                  <span>{event.title}</span>
                  <small>
                    {new Intl.DateTimeFormat('cs-CZ', {
                      day: 'numeric',
                      month: 'short',
                    }).format(new Date(event.date))}
                    {' • '}
                    {getRelativeDaysLabel(event.date)}
                  </small>
                </li>
              ))}
            </ul>
            {upcomingEvents.length === 0 ? <p>Zatím nejsou naplánované žádné události.</p> : null}
          </article>

          <article className="card" id="files">
            <h3>Soubory</h3>
            <ul className="file-list">
              {managedFiles.slice(0, 4).map((file) => (
                <li key={file.id}>
                  <span>{file.name}</span>
                  <small>
                    {file.shared ? 'Sdílený' : 'Soukromý'} • {file.size}
                  </small>
                </li>
              ))}
            </ul>
            {managedFiles.length === 0 ? <p>Zatím nejsou nahrané žádné soubory.</p> : null}
          </article>
        </div>

        <div className="right-column">
          <article className="card" id="subjects">
            <h3>Můj studijní plán</h3>
            <div className="subjects-grid">
              {subjects.map((subject) => (
                <div key={subject.id} className="subject-item">
                  <div className="subject-head">
                    <span className="subject-code">{subject.code}</span>
                    <small>{subject.teacher}</small>
                  </div>
                  <h4>{subject.name}</h4>
                  <p>
                    {subject.files} souborů • {subject.notes} poznámek
                  </p>
                </div>
              ))}
            </div>
            {subjects.length === 0 ? <p>Zatím nejsou evidované žádné předměty.</p> : null}
          </article>

          <article className="card" id="tasks-card">
            <h3>Úkoly</h3>
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
        </div>
      </section>
    </div>
  )
}
