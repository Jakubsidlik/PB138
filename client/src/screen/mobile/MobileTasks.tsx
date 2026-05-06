import { Button } from '../../components/ui/button'
import { useDashboardState } from '../../app/useDashboardState'
import { TaskList } from '../../components/shared/TaskList'
import { TaskStats } from '../../components/shared/TaskStats'

export function MobileTasks() {
  const state = useDashboardState()

  return (
    <div className={`mobile-screen mobile-tasks-screen theme-${state.themeMode} palette-${state.accentPalette}`}>
      <div className="mobile-tasks-content">
        <TaskStats
          wrapperClassName="mobile-tasks-stats"
          itemClassName="mobile-task-stat"
          totalLabel="Celkem"
          completedLabel="Splněno"
          remainingLabel="Zbývá"
          total={state.tasks.length}
          completed={state.tasksDone}
        />

        <TaskList
          tasks={state.tasks}
          onToggleTask={state.toggleTask}
          onDeleteTask={state.deleteTask}
          emptyMessage="Zatím nejsou evidované žádné úkoly. Paráda! 🎉"
          listClassName="mobile-tasks-list"
          itemClassName={undefined}
          renderDeleteButton={(task) => (
            <Button
              onClick={() => state.deleteTask(task.id)}
              className="btn btn-danger btn-sm"
              aria-label="Odstranit úkol"
            >
              Odstranit
            </Button>
          )}
        />

        <Button type="button" className="mobile-tasks-fab" aria-label="Přidat úkol" onClick={state.addTask}>
          +
        </Button>
      </div>
    </div>
  )
}

