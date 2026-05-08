import { useState } from 'react'
import { Task } from '../app/types'
import { Button } from '../components/ui/button'
import { TaskList } from '../components/shared/TaskList'
import { TaskStats } from '../components/shared/TaskStats'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog'
import { Input } from '../components/ui/input'

type DesktopTasksScreenProps = {
    tasks: Task[]
    tasksDone: number
    toggleTask: (taskId: number) => void
    addTask: (title: string) => void
    deleteTask: (taskId: number) => void
}

export function DesktopTasksScreen({ tasks, tasksDone, toggleTask, addTask, deleteTask }: DesktopTasksScreenProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    addTask(newTaskTitle)
    setNewTaskTitle('')
    setIsDialogOpen(false)
  }
return (
    <section className="flex flex-col gap-6" id="desktop-tasks">
    <div className="flex flex-col gap-1">
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

    <div className="flex justify-end my-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>+ Přidat úkol</Button>
            </DialogTrigger>
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
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={!newTaskTitle.trim()}>Uložit</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>

    <TaskList
      tasks={tasks}
      onToggleTask={toggleTask}
      onDeleteTask={deleteTask}
      emptyMessage="Zatím nejsou evidovány žádné úkoly. Paráda! 🏖️"
      listClassName="flex flex-col gap-3"
      itemClassName="flex items-center justify-between p-4 rounded-xl border bg-card text-card-foreground shadow-sm transition-colors hover:bg-muted/50"
    />
    </section>
)
}
