import React from 'react'
import './App.css'
import {
  calendarWeekDays,
  filesSeed,
  foldersSeed,
  scheduleSeed,
  subjectsSeed,
  subjectVisualByCode,
} from './app/data'
import { getDeadlineMeta, getDefaultMetaForTitle, getRelativeDaysLabel } from './app/utils'
import { useDashboardState } from './app/useDashboardState'
import { Sidebar } from './components/shared/Sidebar'
import { Topbar } from './components/shared/Topbar'
import { MobileFilesScreen } from './components/mobile/MobileFilesScreen'
import { MobileCalendarScreen } from './components/mobile/MobileCalendarScreen'
import { MobileSubjectsScreen } from './components/mobile/MobileSubjectsScreen'
import { DashboardHomeContent } from './components/shared/DashboardHomeContent'
import { DesktopCalendarScreen } from './components/desktop/DesktopCalendarScreen'
import { DesktopSubjectsScreen } from './components/desktop/DesktopSubjectsScreen'
import { MobileBottomNav } from './components/mobile/MobileBottomNav'
import { DesktopFilesScreen } from './components/desktop/DesktopFilesScreen'
import { DesktopProfileScreen } from './components/desktop/DesktopProfileScreen'
import { MobileProfileScreen } from './components/mobile/MobileProfileScreen'

function App() {
  const state = useDashboardState()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div
      className={`dashboard-root theme-${state.themeMode} palette-${state.accentPalette} mobile-nav-${state.activeMobileNav} nav-${state.activeMobileNav}`}
    >
      <Sidebar
        activeMobileNav={state.activeMobileNav}
        setActiveMobileNav={state.setActiveMobileNav}
        accentPalette={state.accentPalette}
        setAccentPalette={state.setAccentPalette}
        themeMode={state.themeMode}
        setThemeMode={state.setThemeMode}
      />

      <main className="main-content">
        <Topbar
          isCalendarScreen={state.isCalendarScreen}
          isFilesScreen={state.isFilesScreen}
          isSubjectsScreen={state.isSubjectsScreen}
          isProfileScreen={state.isProfileScreen}
          fileInputRef={fileInputRef}
          setActiveMobileNav={state.setActiveMobileNav}
          accentPalette={state.accentPalette}
          setAccentPalette={state.setAccentPalette}
          themeMode={state.themeMode}
          setThemeMode={state.setThemeMode}
          profileName={state.profile.fullName}
          profileSubtitle={state.profile.studyYear}
          profileAvatarDataUrl={state.profile.avatarDataUrl}
          onOpenProfile={state.onOpenProfile}
        />

        <div className="mobile-content-scroll">
          <MobileFilesScreen
            fileTab={state.fileTab}
            setFileTab={state.setFileTab}
            fileTypeFilter={state.fileTypeFilter}
            setFileTypeFilter={state.setFileTypeFilter}
            folders={foldersSeed}
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
            onChangeProfile={state.onChangeProfile}
            onUploadAvatar={state.onUploadProfileAvatar}
            onRemoveAvatar={state.onRemoveProfileAvatar}
          />

          <DashboardHomeContent
            tasksDone={state.tasksDone}
            tasks={state.tasks}
            upcomingEvents={state.upcomingEvents}
            getDeadlineMeta={getDeadlineMeta}
            getRelativeDaysLabel={getRelativeDaysLabel}
            schedule={scheduleSeed}
            managedFiles={state.managedFiles}
            filesSeed={filesSeed}
            subjects={subjectsSeed}
            toggleTask={state.toggleTask}
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

          <DesktopFilesScreen
            folders={foldersSeed}
            managedFiles={state.managedFiles}
            filesSeed={filesSeed}
            fileInputRef={fileInputRef}
            onUploadFiles={state.onUploadFiles}
            onManageFile={state.manageFile}
            onDeleteFile={state.removeFile}
            onToggleFileShared={state.toggleFileShared}
          />

          <DesktopProfileScreen
            profile={state.profile}
            onChangeProfile={state.onChangeProfile}
            onUploadAvatar={state.onUploadProfileAvatar}
            onRemoveAvatar={state.onRemoveProfileAvatar}
            onResetProfile={state.resetProfile}
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
