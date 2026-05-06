import { Task } from '../app/types'
import { Button } from '../components/ui/button'
import { TaskList } from '../components/shared/TaskList'
import { TaskStats } from '../components/shared/TaskStats'

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

    <TaskStats
      wrapperClassName="desktop-tasks-stats"
      itemClassName="task-stat"
      totalLabel="Celkem úkolů"
      completedLabel="Splněno"
      remainingLabel="Zbývá"
      total={tasks.length}
      completed={tasksDone}
    />

    <div className="desktop-tasks-controls">
        <Button onClick={addTask} className="btn btn-primary">+ Přidat úkol</Button>
    </div>

    <TaskList
      tasks={tasks}
      onToggleTask={toggleTask}
      onDeleteTask={deleteTask}
      emptyMessage="Zatím nejsou evidované žádné úkoly. Paráda! 🎉"
      listClassName="desktop-tasks-list"
      itemClassName="desktop-tasks-item"
      deleteButtonClassName="task-delete-btn"
    />
    </section>
)
}


