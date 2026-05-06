import { Task } from '../../app/types'
import { Button } from '../../components/ui/button'

type DesktopTasksScreenProps = {
    tasks: Task[]
    tasksDone: number
    toggleTask: (taskId: number) => void
    addTask: () => void
    deleteTask: (taskId: number) => void
}

export function DesktopTasksScreen({ tasks, tasksDone, toggleTask, addTask, deleteTask }: DesktopTasksScreenProps) {
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
    </div>

    <div className="desktop-tasks-controls">
        <Button onClick={addTask} className="btn btn-primary">+ Přidat úkol</Button>
    </div>

    <div className="desktop-tasks-list">
        {tasks.length > 0 ? (
        <ul>
            {tasks.map((task) => (
                        <li key={task.id} className={`desktop-tasks-item ${task.done ? 'done' : ''}`}>
                <label>
                <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
                <span>{task.title}</span>
                </label>
                                <Button
                                    onClick={() => deleteTask(task.id)}
                                    className="task-delete-btn"
                                    aria-label={`Odstranit úkol ${task.title}`}
                                    title="Odstranit úkol"
                                >
                                    ×
                                </Button>
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


