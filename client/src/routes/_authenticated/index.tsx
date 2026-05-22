import { createFileRoute } from '@tanstack/react-router'
import { HomeComponent } from '../../app/routeScreens'

export const Route = createFileRoute('/_authenticated/')({
  component: HomeComponent,
})
