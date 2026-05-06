import { createFileRoute } from '@tanstack/react-router'
import { useTasks, useToggleTask, useCreateTask, useDeleteTask } from '../../../app/api-hooks'
import { UnifiedTasksScreen } from '../../../screen/sharedScreen/Tasks' 
import { PendingComponent } from '../../../components/shared/PendingComponent'
import { ErrorComponent } from '../../../components/shared/ErrorComponent'
import { queryClient, queryKeys } from '../../../app/queries'
import { apiClients } from '../../../app/api'

async function tasksLoader() {
  return queryClient.ensureQueryData({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      const result = await apiClients.tasks.list()
      return Array.isArray(result) ? result : []
    },
  })
}

function TasksComponent() {
  const { data: tasks = [], error } = useTasks()
  const toggleMutation = useToggleTask()
  const deleteMutation = useDeleteTask()
  const createMutation = useCreateTask()

  const handleToggle = (taskId: number) => {
    toggleMutation.mutate(taskId)
  }

  const handleDelete = (taskId: number) => {
    deleteMutation.mutate(taskId)
  }

  const handleAddTask = () => {
    createMutation.mutate({
      title: 'Nový úkol',
      description: '',
      done: false,
    } as any)
  }

  if (error) {
    return <ErrorComponent error={error} />
  }

  const tasksDone = tasks.filter((t) => t.done).length

  return (
    <UnifiedTasksScreen
      tasks={tasks}
      tasksDone={tasksDone}
      toggleTask={handleToggle}
      addTask={handleAddTask}
      deleteTask={handleDelete}
    />
  )
}

export const Route = createFileRoute('/_authenticated/tasks/')({
  component: TasksComponent,
  loader: tasksLoader,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})