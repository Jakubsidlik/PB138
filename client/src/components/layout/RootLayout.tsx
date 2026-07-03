
import { Outlet, useRouterState } from '@tanstack/react-router'
import { useDashboard } from '../../app/DashboardContext'
import { AppSidebar, SidebarProvider, SidebarInset } from '../shared/layout/Sidebar'
import { Topbar } from '../shared/layout/Topbar'
import { useClerk } from '@clerk/clerk-react'


export function RootLayout() {
  const state = useDashboard()
  const { signOut } = useClerk()
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  const handleLogout = async () => {
    state.clearUserData()
    state.setAuthSession(null)
    localStorage.removeItem('pb138-auth-session')
    localStorage.removeItem('pb138.profile')
    await signOut()
    window.location.href = '/login'
  }

  const isProfileScreen = pathname === '/profile'

  return (
    <div className={`dashboard-root theme-${state.themeMode} palette-${state.accentPalette}`}>
      <SidebarProvider className="h-svh">
        <AppSidebar onLogout={handleLogout} />

        <SidebarInset className="overflow-y-auto">

          <Topbar
            isProfileScreen={isProfileScreen}
            profileName={state.authSession?.fullName || state.profile.fullName}
            profileAvatarDataUrl={state.profile.avatarDataUrl}
            onOpenProfile={() => window.location.href = '/profile'}
          />

          <div className="flex-1">
            <Outlet />
          </div>

        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
