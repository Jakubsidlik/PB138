import React from 'react'
import { Outlet, useRouterState } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { useDashboardState } from '../../app/useDashboardState'
import { Sidebar } from '../shared/Sidebar'
import { Topbar } from '../shared/Topbar'
import { MobileBottomNav } from './MobileBottomNav'

export function RootLayout() {
  const state = useDashboardState()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { signOut } = useAuth()
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  const handleLogout = async () => {
    await signOut()
    state.logout()
  }

  const isCalendarScreen = pathname === '/calendar'
  const isFilesScreen = pathname === '/files'
  const isTasksScreen = pathname === '/tasks'
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
    <div className={`flex h-screen w-full theme-${state.themeMode} palette-${state.accentPalette} ${navClass}`}>
    <Sidebar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
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

        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </div>
    </main>

      <div className="md:hidden">
      <MobileBottomNav />
    </div>
  </div>
);
}
