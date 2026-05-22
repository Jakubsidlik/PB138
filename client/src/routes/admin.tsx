import { createFileRoute } from '@tanstack/react-router'
import { AdminDashboardScreen } from '../screen/AdminDashboardScreen'

export const Route = createFileRoute('/admin')({
  component: AdminDashboardScreen,
})
