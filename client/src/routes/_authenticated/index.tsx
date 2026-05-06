import { createRoute } from '@tanstack/react-router'
import { useTasks, useToggleTask } from '../../app/api-hooks'
import { useDashboardState } from '../../app/useDashboardState'
import { getDeadlineMeta, getRelativeDaysLabel } from '../../app/utils'
import { DashboardHomeContent } from './-components/DashboardHomeContent'
import { PendingComponent } from '../../components/shared/PendingComponent'
import { ErrorComponent } from '../../components/shared/ErrorComponent'
import { Route as AuthenticatedRoute } from '../_authenticated'
import { queryClient, queryKeys } from '../../app/queries'
import { apiClients } from '../../app/api'

async function dashboardLoader() {
  // Pre-fetch tasks and events data from API before route renders
  return Promise.all([
    queryClient.ensureQueryData({
      queryKey: queryKeys.tasks,
      queryFn: async () => {
        const result = await apiClients.tasks.list()
        return Array.isArray(result) ? result : []
      },
    }),
    queryClient.ensureQueryData({
      queryKey: queryKeys.events,
      queryFn: async () => {
        // Still using storage for events until API is available
        await new Promise((resolve) => setTimeout(resolve, 100))
        const { readEventsFromStorage } = await import('../../app/storage')
        return readEventsFromStorage() ?? []
      },
    }),
  ])
}

function DashboardComponent() {
  const state = useDashboardState()
  const { data: tasks = [] } = useTasks()
  const toggleMutation = useToggleTask()

  const handleToggleTask = (taskId: number) => {
    toggleMutation.mutate(taskId)
  }

  const tasksDone = tasks.filter((t) => t.done).length

  return (
    <DashboardHomeContent
      profileName={state.profile.fullName}
      tasksDone={tasksDone}
      tasks={tasks}
      upcomingEvents={state.upcomingEvents}
      getDeadlineMeta={getDeadlineMeta}
      getRelativeDaysLabel={getRelativeDaysLabel}
      toggleTask={handleToggleTask}
    />
  )
}

export const Route = createRoute({
  getParentRoute: () => AuthenticatedRoute,
  path: '/',
  component: DashboardComponent,
  loader: dashboardLoader,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})
