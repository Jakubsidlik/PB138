import React from 'react'
import './App.css'
import './App-subject-modal.css'

import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './app/router'
import { queryClient } from './app/queries'

import { useUser, useAuth } from '@clerk/clerk-react'
import { useDashboardState } from './app/useDashboardState'
import { apiClients } from './app/api'

function App() {
  const state = useDashboardState()
  const { isLoaded, isSignedIn, user } = useUser()
  const { getToken } = useAuth()

  // Setup API client authentication with Clerk token
  React.useEffect(() => {
    if (!isSignedIn) return

    // Add interceptor to include auth token in all API requests
    const unsubscribe = apiClients.axios.interceptors.request.use(
      async (config: any) => {
        try {
          const token = await getToken()
          if (token) {
            config.headers = config.headers || {}
            config.headers.Authorization = `Bearer ${token}`
          }
        } catch {
          // Token not available, continue without auth
        }
        return config
      },
      (error: any) => Promise.reject(error),
    )

    return () => {
      unsubscribe && apiClients.axios.interceptors.request.handlers.pop()
    }
  }, [isSignedIn, getToken])

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