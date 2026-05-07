import React from 'react'
import { Outlet, useRouterState } from '@tanstack/react-router'
import { useDashboardState } from '../../app/useDashboardState'
import { AppSidebar, SidebarProvider, SidebarInset, SidebarTrigger } from '../shared/Sidebar'
import { Topbar } from '../shared/Topbar'


export function RootLayout() {
  const state = useDashboardState()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  const handleLogout = async () => {
    await state.logout()
  }

  const isCalendarScreen = pathname === '/calendar'
  const isFilesScreen = pathname === '/files'
  const isTasksScreen = pathname === '/tasks' || pathname.startsWith('/tasks/')
  const isStudyPlanScreen = pathname === '/study'
  const isProfileScreen = pathname === '/profile'

  // Determine nav class for CSS styling
  let navClass = 'nav-home mobile-nav-home'
  if (isCalendarScreen) navClass = 'nav-calendar mobile-nav-calendar'
  else if (isTasksScreen) navClass = 'nav-tasks mobile-nav-tasks'
  else if (isFilesScreen) navClass = 'nav-files mobile-nav-files'
  else if (isStudyPlanScreen) navClass = 'nav-study-plan mobile-nav-study-plan'
  else if (isProfileScreen) navClass = 'nav-profile mobile-nav-profile'

  return (
    <div className={`dashboard-root theme-${state.themeMode} palette-${state.accentPalette} ${navClass}`}>
      <SidebarProvider>
        <AppSidebar onLogout={handleLogout} />

        <SidebarInset>
          <header className="flex items-center gap-2 px-4 py-2 md:hidden">
            <SidebarTrigger />
          </header>

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

          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>

          <input
            type="file"
            multiple
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => state.onUploadFiles(e.target.files)}
          />
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
