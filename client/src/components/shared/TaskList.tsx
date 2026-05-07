import { ReactNode } from 'react'

import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Task } from '../../app/types'

type TaskListProps = {
  tasks: Task[]
  onToggleTask: (taskId: number) => void
  onDeleteTask: (taskId: number) => void
  emptyMessage: string
  listClassName?: string
  itemClassName?: string
  deleteButtonClassName?: string
  renderDeleteButton?: (task: Task) => ReactNode
}

export function TaskList({
  tasks,
  onToggleTask,
  onDeleteTask,
  emptyMessage,
  listClassName,
  itemClassName,
  deleteButtonClassName,
  renderDeleteButton,
}: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="tasks-empty">{emptyMessage}</p>
  }

  return (
    <div className={listClassName}>
      <ul>
        {tasks.map((task) => (
          <li key={task.id} className={itemClassName}>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={task.done}
                onCheckedChange={() => onToggleTask(task.id)}
              />
              <span>{task.title}</span>
            </label>
            {renderDeleteButton ? (
              renderDeleteButton(task)
            ) : (
              <Button
                onClick={() => onDeleteTask(task.id)}
                className={deleteButtonClassName}
                aria-label={`Odstranit úkol ${task.title}`}
                title="Odstranit úkol"
              >
                ×
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}