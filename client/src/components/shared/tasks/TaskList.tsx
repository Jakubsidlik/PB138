import { ReactNode, useState, useRef, useEffect } from 'react'

import { Button } from '../../ui/button'
import { Checkbox } from '../../ui/checkbox'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { Task, TaskPriority } from '../../../app/types'

const priorityMap: Record<TaskPriority, { label: string, color: string }> = {
  NONE: { label: '', color: '' },
  LOW: { label: 'Nízká', color: 'bg-green-300 text-black dark:bg-green-400 dark:text-black' },
  MEDIUM: { label: 'Střední', color: 'bg-yellow-300 text-black dark:bg-yellow-400 dark:text-black' },
  HIGH: { label: 'Vysoká', color: 'bg-orange-400 text-black dark:bg-orange-500 dark:text-black' },
  URGENT: { label: 'Urgentní', color: 'bg-red-400 text-black dark:bg-red-500 dark:text-black' }
}

type TaskListProps = {
  tasks: Task[]
  onToggleTask: (taskId: number) => void
  onUpdateTask?: (taskId: number, title: string) => void
  onDeleteTask: (taskId: number) => void
  emptyMessage: string
  listClassName?: string
  itemClassName?: string
  renderDeleteButton?: (task: Task) => ReactNode
}

function TaskListItem({
  task,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  itemClassName,
  renderDeleteButton,
}: {
  task: Task
  onToggleTask: (taskId: number) => void
  onUpdateTask?: (taskId: number, title: string) => void
  onDeleteTask: (taskId: number) => void
  itemClassName?: string
  renderDeleteButton?: (task: Task) => ReactNode
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== task.title) {
      onUpdateTask?.(task.id, trimmed)
    } else {
      setEditTitle(task.title)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setEditTitle(task.title)
      setIsEditing(false)
    }
  }

  return (
    <li className={itemClassName}>
      <label htmlFor={`task-${task.id}`} className="cursor-pointer flex items-center gap-2 flex-1 min-w-0">
        <Checkbox id={`task-${task.id}`} checked={task.done} onCheckedChange={() => onToggleTask(task.id)} />
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 h-8 px-2 min-w-0"
          />
        ) : (
          <div className="flex items-center gap-3 truncate">
            <span className="truncate">{task.title}</span>
            {task.priority && task.priority !== 'NONE' && (
              <Badge variant="secondary" className={`px-3 py-1 text-sm font-semibold ${priorityMap[task.priority].color}`}>
                {priorityMap[task.priority].label}
              </Badge>
            )}
          </div>
        )}
      </label>
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isEditing && onUpdateTask && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="size-10 rounded-md"
            title="Upravit úkol"
          >
            ✎
          </Button>
        )}
        {renderDeleteButton ? (
          renderDeleteButton(task)
        ) : (
          <Button
            variant="ghost"
            onClick={() => onDeleteTask(task.id)}
            className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 size-10 text-3xl pb-1 rounded-md flex items-center justify-center"
            aria-label={`Odstranit úkol ${task.title}`}
            title="Odstranit úkol"
          >
            &times;
          </Button>
        )}
      </div>
    </li>
  )
}

export function TaskList({
  tasks,
  onToggleTask,
  onUpdateTask,
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
      <ul className="flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskListItem
            key={task.id}
            task={task}
            onToggleTask={onToggleTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            itemClassName={itemClassName}
            renderDeleteButton={renderDeleteButton}
          />
        ))}
      </ul>
    </div>
  )
}
