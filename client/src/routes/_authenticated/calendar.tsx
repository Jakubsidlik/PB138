import { createFileRoute } from '@tanstack/react-router'
import { useDashboardState } from '../../app/useDashboardState'
import { getDefaultMetaForTitle } from '../../app/utils'
import { calendarWeekDays } from '../../app/data'
import { DesktopCalendarScreen } from '../../screen/desktop/DesktopCalendar'

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

export const Route = createFileRoute('/_authenticated/calendar')({
  component: CalendarComponent,
})
