import { createFileRoute } from '@tanstack/react-router'
import { AdminDashboardScreen } from '../screen/AdminDashboardScreen'
import { DashboardProvider } from '../app/DashboardContext'

function AdminRoute() {
  return (
    <DashboardProvider>
      <AdminDashboardScreen />
    </DashboardProvider>
  )
}

export const Route = createFileRoute('/admin')({
  component: AdminRoute,
})
