import { createFileRoute } from '@tanstack/react-router'
import { useDashboardState } from '../../app/useDashboardState'
import { getDefaultMetaForTitle } from '../../app/utils'
import { calendarWeekDays } from '../../app/data'
import { UnifiedCalendarScreen } from '../../components/shared/Calendar'
import { PendingComponent } from '../../components/shared/PendingComponent'
import { ErrorComponent } from '../../components/shared/ErrorComponent'
import { queryClient, queryKeys } from '../../app/queries'

async function calendarLoader() {
  return Promise.all([
    queryClient.ensureQueryData({
      queryKey: queryKeys.events,
      queryFn: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        const { readEventsFromStorage } = await import('../../app/storage')
        return readEventsFromStorage() ?? []
      },
    }),
  ])
}

function CalendarComponent() {
  const state = useDashboardState()

  return (
    <UnifiedCalendarScreen
      monthLabel={state.monthLabel}
      calendarWeekDays={calendarWeekDays}
      calendarCells={state.calendarCells}
      eventsByDate={state.eventsByDate}
      selectedDateIso={state.selectedDateIso}
      setSelectedDateIso={state.setSelectedDateIso}
      setDisplayMonth={state.setDisplayMonth}
      selectedDayEvents={state.selectedDayEvents}
      eventMetaById={state.eventMetaById}
      getDefaultMetaForTitle={getDefaultMetaForTitle}
      removeEvent={state.removeEvent}
      addDesktopEvent={state.addDesktopEvent}
      goToToday={state.goToToday}
    />
  )
}

export const Route = createFileRoute('/_authenticated/calendar')({
  component: CalendarComponent,
  loader: calendarLoader,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})