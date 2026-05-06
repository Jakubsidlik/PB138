import { createRoute } from '@tanstack/react-router'
import { useDashboardState } from '../../app/useDashboardState'
import { getDeadlineMeta, getRelativeDaysLabel } from '../../app/utils'
import { DashboardHomeContent } from './-components/DashboardHomeContent'
import { PendingComponent } from '../../components/shared/PendingComponent'
import { ErrorComponent } from '../../components/shared/ErrorComponent'
import { Route as AuthenticatedRoute } from '../_authenticated'
import { queryClient, queryKeys } from '../../app/queries'

async function dashboardLoader() {
  // Pre-fetch tasks and events data before route renders
  return Promise.all([
    queryClient.ensureQueryData({
      queryKey: queryKeys.tasks,
      queryFn: async () => {
        // Simulate fetch - replace with actual API call later
        await new Promise((resolve) => setTimeout(resolve, 100))
        const { readTasksFromStorage } = await import('../../app/storage')
        return readTasksFromStorage() ?? []
      },
    }),
    queryClient.ensureQueryData({
      queryKey: queryKeys.events,
      queryFn: async () => {
        // Simulate fetch - replace with actual API call later
        await new Promise((resolve) => setTimeout(resolve, 100))
        const { readEventsFromStorage } = await import('../../app/storage')
        return readEventsFromStorage() ?? []
      },
    }),
  ])
}

function DashboardComponent() {
  const state = useDashboardState()

  return (
    <DashboardHomeContent
      profileName={state.profile.fullName}
      tasksDone={state.tasksDone}
      tasks={state.tasks}
      upcomingEvents={state.upcomingEvents}
      getDeadlineMeta={getDeadlineMeta}
      getRelativeDaysLabel={getRelativeDaysLabel}
      toggleTask={state.toggleTask}
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
