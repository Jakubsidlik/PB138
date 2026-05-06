import { createFileRoute } from '@tanstack/react-router'
import { CalendarComponent } from '../../app/routeScreens'

export const Route = createFileRoute('/_authenticated/calendar')({
  component: CalendarComponent,
})
