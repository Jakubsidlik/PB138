import { Task } from '../../app/types'

type DesktopTasksScreenProps = {
    tasks: Task[]
    tasksDone: number
    toggleTask: (taskId: number) => void
}

export function DesktopTasksScreen({ tasks, tasksDone, toggleTask }: DesktopTasksScreenProps) {
  const completionPercentage = tasks.length > 0 ? (tasksDone / tasks.length) * 100 : 0

return (
    <section className="desktop-tasks-screen" id="desktop-tasks">
    <div className="desktop-tasks-head">
        <h2>Moje úkoly</h2>
        <p>Přehled všech úkolů a jejich stavu</p>
    </div>

    <div className="desktop-tasks-stats">
        <div className="task-stat">
        <span className="stat-label">Celkem úkolů</span>
        <span className="stat-value">{tasks.length}</span>
        </div>
        <div className="task-stat">
        <span className="stat-label">Splněno</span>
        <span className="stat-value">{tasksDone}</span>
        </div>
        <div className="task-stat">
        <span className="stat-label">Zbývá</span>
        <span className="stat-value">{tasks.length - tasksDone}</span>
        </div>
        <div className="task-stat progress">
        <span className="stat-label">Postup</span>
        <div className="progress-bar">
            <div
            className="progress-fill"
            style={{ width: `${completionPercentage}%` }}
            />
        </div>
        <span className="stat-value">{Math.round(completionPercentage)}%</span>
        </div>
    </div>

    <div className="desktop-tasks-list">
        {tasks.length > 0 ? (
        <ul>
            {tasks.map((task) => (
            <li key={task.id} className={task.done ? 'done' : ''}>
                <label>
                <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
                <span>{task.title}</span>
                </label>
            </li>
            ))}
        </ul>
        ) : (
        <p className="tasks-empty">Zatím nejsou evidované žádné úkoly. Paráda! 🎉</p>
        )}
    </div>
    </section>
)
}
