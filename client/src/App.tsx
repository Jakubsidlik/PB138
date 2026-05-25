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

  // Synchronizace Clerk stavu do lokálního Dashboard stavu aplikace
  React.useEffect(() => {
    if (!isSignedIn || !user || state.isBanned) return


    // Pokud přihlášený Clerk uživatel neodpovídá uloženému záznamu (nebo žádný uložený není),
    // okamžitě vyčistíme veškerá data z předchozí session a nastavíme novou
    if (!state.authSession || state.authSession.email !== user.primaryEmailAddress?.emailAddress) {
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
      <AuthRequiredDialog />
      <BannedAccountDialog />
    </>
  )
}

function App() {
  const { isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
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