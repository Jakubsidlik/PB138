import React from 'react'
import { useDashboardState } from './useDashboardState'
import { getDeadlineMeta, getRelativeDaysLabel, getDefaultMetaForTitle } from './utils'
import { DashboardHomeContent } from '../components/shared/DashboardHomeContent'
import { DesktopCalendarScreen } from '../screen/desktop/DesktopCalendar'
import { DesktopFilesScreen } from '../screen/desktop/DesktopFiles'
import { DesktopTasksScreen } from '../screen/desktop/DesktopTasks'
import { DesktopStudyPlan } from '../screen/desktop/DesktopStudyPlan'
import { DesktopProfileScreen } from '../screen/desktop/DesktopProfile'
import { calendarWeekDays } from './data'

// Wrapper for home route
export function HomeRouteScreen() {
  const state = useDashboardState()

  return (
    <DashboardHomeContent
      profileName={state.profile.fullName}
      tasksDone={state.tasksDone}
      tasks={state.tasks}
      upcomingEvents={state.upcomingEvents}
      getDeadlineMeta={getDeadlineMeta}
      getRelativeDaysLabel={getRelativeDaysLabel}
      toggleTask={state.toggleTask}
    />
  )
}

// Wrapper for calendar route
export function CalendarRouteScreen() {
  const state = useDashboardState()

  return (
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
      addDesktopEvent={state.addDesktopEvent}
      goToToday={state.goToToday}
    />
  )
}

// Wrapper for files route
export function FilesRouteScreen() {
  const state = useDashboardState()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <DesktopFilesScreen
      managedFiles={state.displayedRecentFiles}
      fileInputRef={fileInputRef}
      onUploadFiles={state.onUploadFiles}
      onManageFile={state.manageFile}
      onDeleteFile={state.removeFile}
      onToggleFileShared={state.toggleFileShared}
    />
  )
}

// Wrapper for tasks route
export function TasksRouteScreen() {
  const state = useDashboardState()

  return (
    <DesktopTasksScreen
      tasks={state.tasks}
      tasksDone={state.tasksDone}
      toggleTask={state.toggleTask}
      addTask={state.addTask}
      deleteTask={state.deleteTask}
    />
  )
}

// Wrapper for study plan route
export function StudyPlanRouteScreen() {
  const state = useDashboardState()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <DesktopStudyPlan
      desktopSubjects={state.desktopSubjects}
      subjectFilter={state.subjectFilter}
      setSubjectFilter={state.setSubjectFilter}
      onCreateSubject={state.createSubject}
      onEditSubject={state.updateSubject}
      onToggleArchiveSubject={state.toggleSubjectArchived}
      onDeleteSubject={state.deleteSubject}
      managedFiles={state.managedFiles}
      onUploadFiles={state.onUploadFiles}
      lessons={state.lessons}
      onAddNote={state.addSubjectNote}
    />
  )
}

// Wrapper for profile route
export function ProfileRouteScreen() {
  const state = useDashboardState()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <DesktopProfileScreen
      profile={state.profile}
      authSession={state.authSession}
      onChangeProfile={state.onChangeProfile}
      onUploadAvatar={state.onUploadProfileAvatar}
      onRemoveAvatar={state.onRemoveProfileAvatar}
      onResetProfile={state.resetProfile}
      themeMode={state.themeMode}
      onThemeChange={state.setThemeMode}
      accentPalette={state.accentPalette}
      onPaletteChange={state.setAccentPalette}
      hasUnsavedChanges={state.hasUnsavedProfileChanges}
      onSaveProfile={state.onSaveProfile}
      isSavingProfile={state.isSavingProfile}
    />
  )
}
