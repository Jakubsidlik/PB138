import { createFileRoute } from '@tanstack/react-router'
import { StudyComponent } from '../../app/routeScreens'

export const Route = createFileRoute('/_authenticated/study')({
  component: StudyComponent,
})
