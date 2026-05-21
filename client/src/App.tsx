import React from 'react'
import './App.css'

import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './app/router'
import { queryClient } from './app/query-client'

import { useUser } from '@clerk/clerk-react'
import { Toaster } from './components/ui/sonner'

import { DashboardProvider, useDashboard } from './app/DashboardContext'

function DashboardSync() {
  const state = useDashboard()
  const { isSignedIn, user } = useUser()

  // Synchronizace Clerk stavu do lokálního Dashboard stavu aplikace
  React.useEffect(() => {
    if (!isSignedIn || !user) return

    const newUserId = user.id

    // Pokud přihlášený Clerk uživatel neodpovídá uloženému záznamu (nebo žádný uložený není),
    // okamžitě vyčistíme veškerá data z předchozí session a nastavíme novou
    if (!state.authSession || state.authSession.userId !== newUserId) {
      // Smažeme stará data z localStorage (i kdyby tam zbyla po smazaném účtu)
      localStorage.removeItem('pb138.profile')
      localStorage.removeItem('pb138-auth-session')
      // Okamžitě vyresetujeme React state (profil, tagy, předměty...) ať se stará data nezobrazí
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
    </>
  )
}

function App() {
  const { isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        Načítám...
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