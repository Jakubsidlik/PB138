import { useState } from 'react'
import { Task, TaskPriority } from '../app/types'

const priorityMap: Record<TaskPriority, string> = {
  NONE: 'Bez priority',
  LOW: 'Nízká',
  MEDIUM: 'Střední',
  HIGH: 'Vysoká',
  URGENT: 'Urgentní'
}
import { Button } from '../components/ui/button'
import { TaskList } from '../components/shared/tasks/TaskList'
import { TaskStats } from '../components/shared/dashboard/TaskStats'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

type DesktopTasksScreenProps = {
    tasks: Task[]
    tasksDone: number
    toggleTask: (taskId: number) => void
    addTask: (title: string, priority: TaskPriority) => void
    updateTask: (taskId: number, title: string, priority?: TaskPriority) => void
    deleteTask: (taskId: number) => void
}

export function DesktopTasksScreen({ tasks, tasksDone, toggleTask, addTask, updateTask, deleteTask }: DesktopTasksScreenProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('NONE')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL')

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    addTask(newTaskTitle, newTaskPriority)
    setNewTaskTitle('')
    setNewTaskPriority('NONE')
    setIsDialogOpen(false)
  }
return (
    <section className="flex flex-col gap-6 w-full px-8 pt-6 pb-10" id="desktop-tasks">
    <div className="flex flex-col gap-1 pl-2 md:pl-4">
        <h2 className="text-2xl font-bold tracking-tight">Moje úkoly</h2>
        <p className="text-muted-foreground">Přehled všech úkolů a jejich stavu</p>
    </div>

    <TaskStats
      wrapperClassName="grid gap-4 grid-cols-1 md:grid-cols-3"
      totalLabel="Celkem úkolů"
      completedLabel="Splněno"
      remainingLabel="Zbývá"
      total={tasks.length}
      completed={tasksDone}
    />

    <div className="flex items-center justify-end gap-3 my-2">
        <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val as TaskPriority | 'ALL')}>
            <SelectTrigger className="w-auto min-w-[160px]">
                <SelectValue placeholder="Filtrovat podle priority">
                    {priorityFilter === 'ALL' ? 'Všechny priority' : priorityMap[priorityFilter as TaskPriority]}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">Všechny priority</SelectItem>
                <SelectItem value="NONE">Bez priority</SelectItem>
                <SelectItem value="LOW">Nízká</SelectItem>
                <SelectItem value="MEDIUM">Střední</SelectItem>
                <SelectItem value="HIGH">Vysoká</SelectItem>
                <SelectItem value="URGENT">Urgentní</SelectItem>
            </SelectContent>
        </Select>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button size="lg" className="h-10 px-5 text-sm font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--text-contrast)] shadow-sm" />}>+ Přidat úkol</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleAddTask}>
                    <DialogHeader>
                        <DialogTitle>Nový úkol</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input
                            placeholder="Název úkolu"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            autoFocus
                        />
                        <Select value={newTaskPriority} onValueChange={(val) => setNewTaskPriority(val as TaskPriority)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Priorita">
                                    {priorityMap[newTaskPriority]}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NONE">Bez priority</SelectItem>
                                <SelectItem value="LOW">Nízká</SelectItem>
                                <SelectItem value="MEDIUM">Střední</SelectItem>
                                <SelectItem value="HIGH">Vysoká</SelectItem>
                                <SelectItem value="URGENT">Urgentní</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={!newTaskTitle.trim()}>Uložit</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>

    <TaskList
      tasks={tasks.filter(t => priorityFilter === 'ALL' ? true : (t.priority || 'NONE') === priorityFilter)}
      onToggleTask={toggleTask}
      onUpdateTask={updateTask}
      onDeleteTask={deleteTask}
      emptyMessage="Zatím nejsou evidovány žádné úkoly. Paráda! 🏖️"
      listClassName="flex flex-col gap-3"
      itemClassName="flex items-center justify-between p-4 rounded-xl border bg-card text-card-foreground shadow-sm transition-colors hover:bg-muted/50"
    />
    </section>
)
}
