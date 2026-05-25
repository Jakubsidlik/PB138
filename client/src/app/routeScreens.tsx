import React, { useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useDashboard } from './DashboardContext'
import { getDeadlineMeta, getRelativeDaysLabel, getDefaultMetaForTitle } from './utils'
import { DashboardHomeContent } from '../components/shared/dashboard/DashboardHomeContent'
import { DesktopCalendarScreen } from '../screen/CalendarScreen'
import { DesktopFilesScreen } from '../screen/FilesScreen'
import { DesktopTasksScreen } from '../screen/TasksScreen'
import { DesktopStudyPlan } from '../screen/StudyPlanScreen'
import { DesktopProfileScreen } from '../screen/ProfileScreen'
import { calendarWeekDays } from './data'

// Home route component
export function HomeComponent() {
  const state = useDashboard()
  const navigate = useNavigate()

  const handleEventClick = (dateIso: string) => {
    navigate({ to: '/calendar', search: { date: dateIso } })
  }

  return (
    <DashboardHomeContent
      profileName={state.authSession?.fullName || state.profile.fullName}
      tasksDone={state.tasksDone}
      tasks={state.tasks}
      upcomingEvents={state.upcomingEvents}
      getDeadlineMeta={getDeadlineMeta}
      getRelativeDaysLabel={getRelativeDaysLabel}
      toggleTask={state.toggleTask}
      subjectsCount={state.subjects.length}
      filesCount={state.managedFiles.length}
      onEventClick={handleEventClick}
    />
  )
}

// Calendar route component
export function CalendarComponent() {
  const state = useDashboard()
  const search: any = useSearch({ strict: false })

  useEffect(() => {
    if (search.date && search.date !== state.selectedDateIso) {
      state.setSelectedDateIso(search.date)
      const newDate = new Date(search.date)
      state.setDisplayMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1))
    }
  }, [search.date])

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

// Files route component
export function FilesComponent() {
  const state = useDashboard()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <DesktopFilesScreen
      managedFiles={state.displayedRecentFiles}
      subjects={state.subjects}
      fileInputRef={fileInputRef}
      onUploadFiles={state.onUploadFiles}
      onRenameFile={state.renameFile}
      onDeleteFile={state.removeFile}
      onToggleFileShared={state.toggleFileShared}
      onChangeFileSubject={state.changeFileSubject}
    />
  )
}

// Tasks route component
export function TasksComponent() {
  const state = useDashboard()

  return (
    <DesktopTasksScreen
      tasks={state.tasks}
      tasksDone={state.tasksDone}
      toggleTask={state.toggleTask}
      addTask={state.addTask}
      updateTask={state.updateTask}
      deleteTask={state.deleteTask}
    />
  )
}

// Study plan route component
export function StudyComponent() {
  const state = useDashboard()

  return (
    <DesktopStudyPlan
      desktopSubjects={state.desktopSubjects}
      subjectFilter={state.subjectFilter}
      setSubjectFilter={state.setSubjectFilter}
      onCreateSubject={state.createSubject}
      onEditSubject={state.updateSubject}
      tags={state.tags}
      tagFilter={state.tagFilter}
      setTagFilter={state.setTagFilter}
      onCreateTag={state.createTag}
      onDeleteTag={state.deleteTag}
      onToggleArchiveSubject={state.toggleSubjectArchived}
      onDeleteSubject={state.deleteSubject}
      managedFiles={state.managedFiles}
      onUploadFiles={state.onUploadFiles}
      lessons={state.lessons}
      onAddNote={state.addSubjectNote}
      onDeleteNote={state.deleteSubjectNote}
      onUpdateNote={state.updateSubjectNote}
      studyPlans={state.studyPlans}
      activeStudyPlanId={state.activeStudyPlanId}
      setActiveStudyPlanId={state.setActiveStudyPlanId}
      onCreateStudyPlan={state.createStudyPlan}
      onEditStudyPlan={state.updateStudyPlan}
      onToggleArchiveStudyPlan={state.toggleStudyPlanArchived}
      onDeleteStudyPlan={state.deleteStudyPlan}
      onShareStudyPlan={state.shareStudyPlan}
      onShareSubject={state.shareSubject}
      onRateLesson={state.rateLesson}
      onRateFile={state.rateFile}
    />
  )
}

// Profile route component
export function ProfileComponent() {
  const state = useDashboard()

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

// Legacy exports for backward compatibility
export const HomeRouteScreen = HomeComponent
export const CalendarRouteScreen = CalendarComponent
export const FilesRouteScreen = FilesComponent
export const TasksRouteScreen = TasksComponent
export const StudyPlanRouteScreen = StudyComponent
export const ProfileRouteScreen = ProfileComponent
