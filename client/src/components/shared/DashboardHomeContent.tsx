import {
  CalendarEvent,
  ManagedFile,
  ScheduleItem,
  Subject,
  Task,
  StudyFile,
} from '../../app/types'

type DashboardHomeContentProps = {
  tasksDone: number
  tasks: Task[]
  upcomingEvents: CalendarEvent[]
  getDeadlineMeta: (index: number) => { label: string; className: string; progress: number }
  getRelativeDaysLabel: (date: string) => string
  schedule: ScheduleItem[]
  managedFiles: ManagedFile[]
  filesSeed: StudyFile[]
  subjects: Subject[]
  toggleTask: (taskId: number) => void
}

export function DashboardHomeContent({
  tasksDone,
  tasks,
  upcomingEvents,
  getDeadlineMeta,
  getRelativeDaysLabel,
  schedule,
  managedFiles,
  filesSeed,
  subjects,
  toggleTask,
}: DashboardHomeContentProps) {
  return (
    <div className="mobile-dashboard-content desktop-dashboard-content">
      <section className="welcome">
        <div>
          <h2>Dobré ráno, User!</h2>
          <p>Dnes je pondělí. Máš před sebou nabitý studijní den.</p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="progress-card">
          <div>
            <p className="eyebrow">Daily Progress</p>
            <h3>Tasks for Today</h3>
            <p>
              Dokončeno {tasksDone} z {tasks.length} úkolů.
            </p>
          </div>
          <div className="progress-ring">{tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0}%</div>
        </article>

        <article className="deadlines-card">
          <h3>Upcoming Deadlines</h3>
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
          <article className="card" id="schedule">
            <div className="section-head">
              <h3>Today's Schedule</h3>
              <button type="button" className="text-button">See All</button>
            </div>
            <div className="mobile-schedule-list">
              {schedule.map((item) => (
                <div key={item.id} className="mobile-schedule-item">
                  <div className="mobile-schedule-icon">{item.subject.slice(0, 2).toUpperCase()}</div>
                  <div className="mobile-schedule-content">
                    <h4>{item.subject}</h4>
                    <p>{item.time}</p>
                  </div>
                  <div className="mobile-schedule-location">{item.location}</div>
                </div>
              ))}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((item) => (
                  <tr key={item.id} className={item.type === 'Live Now' ? 'live-row' : ''}>
                    <td>{item.time}</td>
                    <td>{item.subject}</td>
                    <td>{item.type}</td>
                    <td>{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="card" id="files">
            <h3>Soubory</h3>
            <ul className="file-list">
              {managedFiles.slice(0, 3).map((file, index) => (
                <li key={file.id}>
                  <span>{filesSeed[index]?.name ?? file.name}</span>
                  <small>
                    {filesSeed[index]?.subject ?? 'UP'} • {file.size}
                  </small>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="right-column">
          <article className="card" id="subjects">
            <h3>My Subjects</h3>
            <div className="subjects-grid">
              {subjects.map((subject) => (
                <div key={subject.id} className="subject-item">
                  <div className="subject-head">
                    <span className="subject-code">{subject.code}</span>
                    <small>{subject.teacher}</small>
                  </div>
                  <h4>{subject.name}</h4>
                  <p>
                    {subject.files} files • {subject.notes} notes
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="card" id="tasks-card">
            <h3>Tasks for Today</h3>
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
          </article>
        </div>
      </section>
    </div>
  )
}
