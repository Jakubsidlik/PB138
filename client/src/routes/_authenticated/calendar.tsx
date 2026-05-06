import { createRoute } from '@tanstack/react-router'
import { useDashboardState } from '../../app/useDashboardState'
import { getDefaultMetaForTitle } from '../../app/utils'
import { calendarWeekDays } from '../../app/data'
import { DesktopCalendarScreen } from '../../screen/desktop/DesktopCalendar'
import { PendingComponent } from '../../components/shared/PendingComponent'
import { ErrorComponent } from '../../components/shared/ErrorComponent'
import { Route as AuthenticatedRoute } from '../_authenticated'
import { queryClient, queryKeys } from '../../app/queries'

async function calendarLoader() {
  // Pre-fetch calendar events data before route renders
  return Promise.all([
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

function CalendarComponent() {
  const state = useDashboardState()

  return (
    <DesktopCalendarScreen
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

export const Route = createRoute({
  getParentRoute: () => AuthenticatedRoute,
  path: '/calendar',
  component: CalendarComponent,
  loader: calendarLoader,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
})
