import { createFileRoute } from '@tanstack/react-router'
import { ProfileComponent } from '../../app/routeScreens'

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfileComponent,
})
