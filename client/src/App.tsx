import React from 'react'
import './App.css'

import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './app/router'
import { queryClient } from './app/queries'

import { useUser } from '@clerk/clerk-react'
import { useDashboardState } from './app/useDashboardState'

function App() {
  const state = useDashboardState()
  const { isLoaded, isSignedIn, user } = useUser()

  // Synchronizace Clerk stavu do lokálního Dashboard stavu aplikace
  React.useEffect(() => {
    if (isSignedIn && user && !state.authSession) {
      state.setAuthSession({
        userId: user.id as any, // Clerk vrací textové ID
        role: 'REGISTERED',
        fullName: user.fullName || 'Uživatel',
        email: user.primaryEmailAddress?.emailAddress || '',
      })
    }
  }, [isSignedIn, user, state.authSession])

  if (!isLoaded) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        Načítám...
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App