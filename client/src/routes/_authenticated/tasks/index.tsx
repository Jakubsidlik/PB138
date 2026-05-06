import { createRoute } from '@tanstack/react-router'
import { useTasks, useToggleTask, useCreateTask, useDeleteTask } from '../../../app/api-hooks'
import { DesktopTasksScreen } from '../../../screen/desktop/DesktopTasks'
import { PendingComponent } from '../../../components/shared/PendingComponent'
import { ErrorComponent } from '../../../components/shared/ErrorComponent'
import { Route as AuthenticatedRoute } from '../../_authenticated'
import { queryClient, queryKeys } from '../../../app/queries'
import { apiClients } from '../../../app/api'

async function tasksLoader() {
  // Pre-fetch tasks data from API before route renders
  return queryClient.ensureQueryData({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      const result = await apiClients.tasks.list()
      // Ensure we always return an array
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
    // Simple task creation - you can enhance with a modal/form
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
    <DesktopTasksScreen
      tasks={tasks}
      tasksDone={tasksDone}
      toggleTask={handleToggle}
      addTask={handleAddTask}
      deleteTask={handleDelete}
    />
  )
}

export const Route = createRoute({
  getParentRoute: () => AuthenticatedRoute,
  path: '/tasks',
  component: TasksComponent,
  loader: tasksLoader,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})
