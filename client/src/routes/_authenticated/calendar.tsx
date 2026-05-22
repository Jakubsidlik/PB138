import { createFileRoute } from '@tanstack/react-router'
import { CalendarComponent } from '../../app/routeScreens'

export const Route = createFileRoute('/_authenticated/calendar')({
  component: CalendarComponent,
  validateSearch: (search: Record<string, unknown>): { date?: string } => {
    return {
      date: typeof search.date === 'string' ? search.date : undefined,
    }
  },
})
