import { createFileRoute, Navigate } from '@tanstack/react-router'
import { AuthScreen } from '../components/authentication/AuthScreen'
import { useAuth } from '@clerk/clerk-react'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return null

  if (isSignedIn) {
    return <Navigate to="/" />
  }

  return <AuthScreen />
}
