import { createRoute } from '@tanstack/react-router'
import { useDashboardState } from '../../../app/useDashboardState'
import { PendingComponent } from '../../../components/shared/PendingComponent'
import { ErrorComponent } from '../../../components/shared/ErrorComponent'
import { Route as TasksRoute } from './index'
import { queryClient, queryKeys } from '../../../app/queries'

interface TaskDetailParams {
  taskId: string
}

async function taskDetailLoader({ params }: { params: TaskDetailParams }) {
  // Pre-fetch tasks data before route renders
  await queryClient.ensureQueryData({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      // Simulate fetch - replace with actual API call later
      await new Promise((resolve) => setTimeout(resolve, 100))
      const { readTasksFromStorage } = await import('../../../app/storage')
      return readTasksFromStorage() ?? []
    },
  })
  return params
}

function TaskDetailComponent() {
  const { taskId } = Route.useParams() as TaskDetailParams
  const state = useDashboardState()

  // Find the specific task (taskId is a string from URL, but task.id is a number)
  const task = state.tasks.find((t) => t.id === parseInt(taskId, 10))

  if (!task) {
    return <div className="p-4">Úkol nebyl nalezen</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{task.title}</h1>
      <p className="mb-2">Deadline: {task.deadline || 'Není nastaven'}</p>
      <p className="mb-2">Předmět: {task.subjectId ? `ID: ${task.subjectId}` : 'Bez předmětu'}</p>
      <p className="mb-4">Status: {task.done ? 'Hotovo' : 'Nevyřešeno'}</p>
      <button
        onClick={() => state.toggleTask(task.id)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {task.done ? 'Označit jako nevyřešené' : 'Označit jako hotovo'}
      </button>
    </div>
  )
}

export const Route = createRoute({
  getParentRoute: () => TasksRoute,
  path: '$taskId',
  component: TaskDetailComponent,
  loader: taskDetailLoader,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})
