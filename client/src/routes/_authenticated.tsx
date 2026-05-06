import { createFileRoute, Outlet, Navigate } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
})

function RouteComponent() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return null

  if (!isSignedIn) {
    return <Navigate to="/login" />
  }

  return <Outlet />
}
