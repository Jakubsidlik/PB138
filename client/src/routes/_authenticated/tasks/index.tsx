import { createFileRoute } from '@tanstack/react-router'
import { TasksComponent } from '../../../app/routeScreens'

export const Route = createFileRoute('/_authenticated/tasks/')({
  component: TasksComponent,
})
