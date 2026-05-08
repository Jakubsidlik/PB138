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
  renderDeleteButton?: (task: Task) => ReactNode
}

export function TaskList({
  tasks,
  onToggleTask,
  onDeleteTask,
  emptyMessage,
  listClassName,
  itemClassName,
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
            <label htmlFor={`task-${task.id}`} className="cursor-pointer flex items-center gap-2">
              <Checkbox id={`task-${task.id}`} checked={task.done} onCheckedChange={() => onToggleTask(task.id)} />
              <span>{task.title}</span>
            </label>
            {renderDeleteButton ? (
              renderDeleteButton(task)
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteTask(task.id)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive size-8"
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