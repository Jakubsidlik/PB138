import { createFileRoute } from '@tanstack/react-router'
import { useDashboardState } from '../../app/useDashboardState'
import { getDeadlineMeta, getRelativeDaysLabel } from '../../app/utils'
import { DashboardHomeContent } from './-components/DashboardHomeContent'

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

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardComponent,
})
