import React from 'react'
import './App.css'
import './App-subject-modal.css'

import { RouterProvider } from '@tanstack/react-router'
import { router } from './app/router'

import { useUser } from '@clerk/clerk-react'
import { useDashboardState } from './app/useDashboardState'
import { AuthScreen } from './components/authentication/AuthScreen'

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

  // Zobrazí AuthScreen, pokud není přihlášen Clerk
  if (!isSignedIn) {
    return <AuthScreen />
  }

  return (
    <RouterProvider router={router} />
  )
}

export default App