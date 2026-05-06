import React from 'react'
import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { useDashboardState } from '../app/useDashboardState'
import { Sidebar } from '../components/shared/Sidebar'
import { Topbar } from '../components/shared/Topbar'
import { MobileBottomNav } from '../screen/mobile/MobileBottomNav'
import { QuerySuspense } from '../components/shared/QuerySuspense'
import { ErrorComponent } from '../components/shared/ErrorComponent'

function RootComponent() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  // For login page, show just the outlet without dashboard UI
  const isLoginPage = pathname === '/login'

  if (isLoginPage) {
    return (
      <QuerySuspense>
        <Outlet />
      </QuerySuspense>
    )
  }

  // For authenticated pages, show dashboard layout
  const state = useDashboardState()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    state.logout()
  }

  const isCalendarScreen = pathname === '/calendar'
  const isFilesScreen = pathname === '/files'
  const isTasksScreen = pathname === '/tasks' || pathname.startsWith('/tasks/')
  const isStudyPlanScreen = pathname === '/study'
  const isProfileScreen = pathname === '/profile'

  // Determine nav class for CSS styling
  let navClass = 'nav-home'
  if (isCalendarScreen) navClass = 'nav-calendar'
  else if (isTasksScreen) navClass = 'nav-tasks'
  else if (isFilesScreen) navClass = 'nav-files'
  else if (isStudyPlanScreen) navClass = 'nav-study-plan'
  else if (isProfileScreen) navClass = 'nav-profile'

  return (
    <div
      className={`dashboard-root theme-${state.themeMode} palette-${state.accentPalette} ${navClass}`}
    >
      <Sidebar onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          isCalendarScreen={isCalendarScreen}
          isFilesScreen={isFilesScreen}
          isTasksScreen={isTasksScreen}
          isStudyPlanScreen={isStudyPlanScreen}
          isProfileScreen={isProfileScreen}
          fileInputRef={fileInputRef}
          profileName={state.profile.fullName}
          profileAvatarDataUrl={state.profile.avatarDataUrl}
          onOpenProfile={() => window.location.href = '/profile'}
        />

        <QuerySuspense>
          <Outlet />
        </QuerySuspense>

        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => state.onUploadFiles(e.target.files)}
        />
      </main>

      <MobileBottomNav />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: ErrorComponent,
})
