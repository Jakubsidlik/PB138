import React from 'react'
import { useDashboardState } from '../../app/useDashboardState'

export function MobileTasks() {
  const state = useDashboardState()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className={`mobile-screen mobile-tasks-screen theme-${state.themeMode} palette-${state.accentPalette}`}>
      <div className="mobile-tasks-content">
        <div className="mobile-tasks-stats">
          <div className="mobile-task-stat">
            <span className="stat-label">Celkem</span>
            <span className="stat-value">{state.tasks.length}</span>
          </div>
          <div className="mobile-task-stat">
            <span className="stat-label">Splněno</span>
            <span className="stat-value">{state.tasksDone}</span>
          </div>
          <div className="mobile-task-stat">
            <span className="stat-label">Zbývá</span>
            <span className="stat-value">{state.tasks.length - state.tasksDone}</span>
          </div>
        </div>

        <div className="mobile-tasks-list">
          {state.tasks.length > 0 ? (
            <ul>
              {state.tasks.map((task) => (
                <li key={task.id} className={task.done ? 'done' : ''}>
                  <label>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => state.toggleTask(task.id)}
                    />
                    <span>{task.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tasks-empty">Zatím nejsou evidované žádné úkoly. Paráda! 🎉</p>
          )}
        </div>

        <button type="button" className="mobile-tasks-fab" aria-label="Přidat úkol" onClick={state.addTask}>
          +
        </button>
      </div>
    </div>
  )
}