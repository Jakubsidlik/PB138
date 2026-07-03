import { createFileRoute } from '@tanstack/react-router'
import { GroupComponent } from '../../app/routeScreens'

export const Route = createFileRoute('/_authenticated/group/$groupId')({
  component: GroupComponent,
})
