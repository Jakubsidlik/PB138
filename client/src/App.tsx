import React from 'react'

import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './app/router'
import { queryClient } from './app/query-client'

import { useUser } from '@clerk/clerk-react'
import { Toaster } from './components/ui/sonner'

import { DashboardProvider, useDashboard } from './app/DashboardContext'
import { AuthRequiredDialog } from './components/shared/dashboard/AuthRequiredDialog'
import { BannedAccountDialog } from './components/shared/dashboard/BannedAccountDialog'

function DashboardSync() {
  const state = useDashboard()
  const { isSignedIn, user } = useUser()

  React.useEffect(() => {
    if (!isSignedIn || !user || state.isBanned) return

    if (!state.authSession || state.authSession.email !== user.primaryEmailAddress?.emailAddress) {
      localStorage.removeItem('pb138.profile')
      localStorage.removeItem('pb138-auth-session')
      state.clearUserData()
      state.setAuthSession({
        userId: user.id as any,
        role: 'REGISTROVANÝ UŽIVATEL',
        fullName: user.fullName || 'Uživatel',
        email: user.primaryEmailAddress?.emailAddress || '',
      })
    }
  }, [isSignedIn, user?.id])

  return null
}

function AppContent() {
  const state = useDashboard()
  
  return (
    <>
      <DashboardSync />
      <RouterProvider router={router} />
      <Toaster theme={state.themeMode} />
      <AuthRequiredDialog />
      <BannedAccountDialog />
    </>
  )
}

function App() {
  const { isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center text-white" style={{ background: '#0f0f1a' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' }}>
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-gray-400">Načítám Car-Y-list...</span>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardProvider>
        <AppContent />
      </DashboardProvider>
    </QueryClientProvider>
  )
}

export default App