import React from 'react'
import './App.css'
import {
  calendarWeekDays,
  subjectVisualByCode,
} from './app/data'
import { getDeadlineMeta, getDefaultMetaForTitle, getRelativeDaysLabel } from './app/utils'
import { useDashboardState } from './app/useDashboardState'
import { Sidebar } from './components/shared/Sidebar'
import { Topbar } from './components/shared/Topbar'
import { AuthScreen } from './components/shared/AuthScreen'

import { MobileFilesScreen } from './screen/mobile/MobileFilesScreen'
import { MobileCalendarScreen } from './screen/mobile/MobileCalendarScreen'
import { MobileSubjectsScreen } from './screen/mobile/MobileSubjectsScreen'
import { MobileBottomNav } from './screen/mobile/MobileBottomNav'
import { MobileProfileScreen } from './screen/mobile/MobileProfileScreen'
import { DashboardHomeContent } from './components/shared/DashboardHomeContent'
import { DesktopCalendarScreen } from './screen/desktop/DesktopCalendarScreen'
import { DesktopFilesScreen } from './screen/desktop/DesktopFilesScreen'
import { DesktopSubjectsScreen } from './screen/desktop/DesktopSubjectsScreen'
import { DesktopProfileScreen } from './screen/desktop/DesktopProfileScreen'

function App() {
  const state = useDashboardState()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleSkipAsAdmin = () => {
    // Nastaví mock admin session pro vývoj
    const mockAdminSession = {
      userId: 999,
      role: 'ADMIN' as const,
      fullName: 'Admin Vývojář',
      email: 'admin@dev.local',
    }
    state.setAuthSession(mockAdminSession)
  }

  // Pokud uživatel není přihlášený, zobraz AuthScreen
  if (!state.authSession) {
    return (
      <AuthScreen
        onLogin={state.login}
        onRegister={state.register}
        onSkipAsAdmin={handleSkipAsAdmin}
      />
    )
  }

  return (
    <div
      className={`dashboard-root theme-${state.themeMode} palette-${state.accentPalette} mobile-nav-${state.activeMobileNav} nav-${state.activeMobileNav}`}
    >
      <Sidebar
        activeMobileNav={state.activeMobileNav}
        setActiveMobileNav={state.setActiveMobileNav}
        themeMode={state.themeMode}
        onThemeChange={state.setThemeMode}
        accentPalette={state.accentPalette}
        onPaletteChange={state.setAccentPalette}
        onLogout={state.logout}
      />

      <main className="main-content">
        <Topbar
          isCalendarScreen={state.isCalendarScreen}
          isFilesScreen={state.isFilesScreen}
          isSubjectsScreen={state.isSubjectsScreen}
          isProfileScreen={state.isProfileScreen}
          fileInputRef={fileInputRef}
          setActiveMobileNav={state.setActiveMobileNav}
          profileName={state.profile.fullName}
          profileSubtitle={state.profile.studyYear}
          profileAvatarDataUrl={state.profile.avatarDataUrl}
          onOpenProfile={state.onOpenProfile}
        />

        <div className="mobile-content-scroll">
          <MobileFilesScreen
            fileTab={state.fileTab}
            setFileTab={state.setFileTab}
            displayedRecentFiles={state.displayedRecentFiles}
            isDragActive={state.isDragActive}
            setIsDragActive={state.setIsDragActive}
            onDropToUpload={state.onDropToUpload}
            onUploadFiles={state.onUploadFiles}
            onManageFile={state.manageFile}
            fileInputRef={fileInputRef}
          />

          <MobileCalendarScreen
            monthLabel={state.monthLabel}
            calendarWeekDays={calendarWeekDays}
            calendarCells={state.calendarCells}
            eventsByDate={state.eventsByDate}
            selectedDateIso={state.selectedDateIso}
            setSelectedDateIso={state.setSelectedDateIso}
            selectedDayEvents={state.selectedDayEvents}
            eventMetaById={state.eventMetaById}
            getDefaultMetaForTitle={getDefaultMetaForTitle}
            setDisplayMonth={state.setDisplayMonth}
            addDesktopEvent={state.addDesktopEvent}
            removeEvent={state.removeEvent}
          />

          <MobileSubjectsScreen
            subjectSearch={state.subjectSearch}
            setSubjectSearch={state.setSubjectSearch}
            filteredSubjects={state.filteredSubjects}
            subjectVisualByCode={subjectVisualByCode}
            onCreateSubject={state.createSubject}
            onEditSubject={state.updateSubject}
            onToggleArchiveSubject={state.toggleSubjectArchived}
            onDeleteSubject={state.deleteSubject}
          />

          <MobileProfileScreen
            profile={state.profile}
            authSession={state.authSession}
            onChangeProfile={state.onChangeProfile}
            onUploadAvatar={state.onUploadProfileAvatar}
            onRemoveAvatar={state.onRemoveProfileAvatar}
            onLogin={state.login}
            onRegister={state.register}
            onLogout={state.logout}
            themeMode={state.themeMode}
            onThemeChange={state.setThemeMode}
            accentPalette={state.accentPalette}
            onPaletteChange={state.setAccentPalette}
          />

          <DashboardHomeContent
            profileName={state.profile.fullName}
            tasksDone={state.tasksDone}
            tasks={state.tasks}
            upcomingEvents={state.upcomingEvents}
            getDeadlineMeta={getDeadlineMeta}
            getRelativeDaysLabel={getRelativeDaysLabel}
            managedFiles={state.managedFiles}
            subjects={state.subjects}
            toggleTask={state.toggleTask}
          />

          <DesktopFilesScreen
            managedFiles={state.managedFiles}
            fileInputRef={fileInputRef}
            onUploadFiles={state.onUploadFiles}
            onManageFile={state.manageFile}
            onDeleteFile={state.removeFile}
            onToggleFileShared={state.toggleFileShared}
          />

          <DesktopCalendarScreen
            monthLabel={state.monthLabel}
            calendarWeekDays={calendarWeekDays}
            calendarCells={state.calendarCells}
            eventsByDate={state.eventsByDate}
            selectedDateIso={state.selectedDateIso}
            setSelectedDateIso={state.setSelectedDateIso}
            setDisplayMonth={state.setDisplayMonth}
            selectedDayEvents={state.selectedDayEvents}
            eventMetaById={state.eventMetaById}
            getDefaultMetaForTitle={getDefaultMetaForTitle}
            removeEvent={state.removeEvent}
            goToToday={state.goToToday}
            addDesktopEvent={state.addDesktopEvent}
          />

          <DesktopSubjectsScreen
            desktopSubjects={state.desktopSubjects}
            subjectFilter={state.subjectFilter}
            setSubjectFilter={state.setSubjectFilter}
            onCreateSubject={state.createSubject}
            onEditSubject={state.updateSubject}
            onToggleArchiveSubject={state.toggleSubjectArchived}
            onDeleteSubject={state.deleteSubject}
          />

          <DesktopProfileScreen
            profile={state.profile}
            authSession={state.authSession}
            onChangeProfile={state.onChangeProfile}
            onUploadAvatar={state.onUploadProfileAvatar}
            onRemoveAvatar={state.onRemoveProfileAvatar}
            onResetProfile={state.resetProfile}
            onLogin={state.login}
            onRegister={state.register}
            onLogout={state.logout}
            themeMode={state.themeMode}
            onThemeChange={state.setThemeMode}
            accentPalette={state.accentPalette}
            onPaletteChange={state.setAccentPalette}
          />
        </div>

        <MobileBottomNav
          activeMobileNav={state.activeMobileNav}
          setActiveMobileNav={state.setActiveMobileNav}
        />
      </main>
    </div>
  )
}

export default App
