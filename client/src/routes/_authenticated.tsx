import { createRoute, Outlet, useRouter } from '@tanstack/react-router'
import React from 'react'
import { useUser } from '@clerk/clerk-react'
import { ErrorComponent } from '../components/shared/ErrorComponent'
import { Route as RootRoute } from './__root'

function AuthenticatedLayout() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  
  React.useEffect(() => {
    // Check authentication and redirect if needed
    if (isLoaded && !isSignedIn) {
      router.navigate({ to: '/login' })
    }
  }, [isSignedIn, isLoaded, router])

  // Show nothing while loading or if not authenticated
  if (!isLoaded || !isSignedIn) {
    return null
  }

  return <Outlet />
}

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  id: '_authenticated',
  component: AuthenticatedLayout,
  errorComponent: ErrorComponent,
})
