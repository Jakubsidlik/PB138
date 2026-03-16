import React from 'react'
import './App.css'
import {
  calendarWeekDays,
  desktopSubjectMetaByCode,
  eventMetaSeed,
  eventsSeed,
  EVENTS_STORAGE_KEY,
  filesSeed,
  foldersSeed,
  managedFilesSeed,
  PALETTE_STORAGE_KEY,
  scheduleSeed,
  subjectsSeed,
  subjectVisualByCode,
  tasksSeed,
  TASKS_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from './app/data'
import {
  AccentPalette,
  CalendarEvent,
  EventMeta,
  FileTab,
  ManagedFile,
  MobileNavItem,
  Task,
  ThemeMode,
} from './app/types'
import { readEventsFromStorage, readPaletteFromStorage, readTasksFromStorage, readThemeFromStorage } from './app/storage'
import {
  buildCalendarCells,
  formatDateIso,
  formatFileSize,
  getDeadlineMeta,
  getDefaultMetaForTitle,
  getManagedFileCategory,
  getNavFromHash,
  getRelativeDaysLabel,
} from './app/utils'
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

function App() {
  const [tasks, setTasks] = React.useState<Task[]>(tasksSeed)
  const [events, setEvents] = React.useState<CalendarEvent[]>(eventsSeed)
  const [themeMode, setThemeMode] = React.useState<ThemeMode>(() => readThemeFromStorage())
  const [accentPalette, setAccentPalette] = React.useState<AccentPalette>(() => readPaletteFromStorage())
  const [activeMobileNav, setActiveMobileNav] = React.useState<MobileNavItem>(() =>
    getNavFromHash(window.location.hash),
  )
  const [displayMonth, setDisplayMonth] = React.useState(() => new Date())
  const [selectedDateIso, setSelectedDateIso] = React.useState(() => formatDateIso(new Date()))
  const [eventMetaById, setEventMetaById] = React.useState<Record<number, EventMeta>>(eventMetaSeed)
  const [fileTab, setFileTab] = React.useState<FileTab>('all')
  const [fileTypeFilter, setFileTypeFilter] = React.useState<'all' | 'folder' | 'pdf' | 'image'>('all')
  const [managedFiles, setManagedFiles] = React.useState<ManagedFile[]>(managedFilesSeed)
  const [subjectSearch, setSubjectSearch] = React.useState('')
  const [isDragActive, setIsDragActive] = React.useState(false)
  const [isHydrated, setIsHydrated] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const onHashChange = () => {
      setActiveMobileNav(getNavFromHash(window.location.hash))
    }

    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  React.useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  React.useEffect(() => {
    localStorage.setItem(PALETTE_STORAGE_KEY, accentPalette)
  }, [accentPalette])

  React.useEffect(() => {
    const hydrateData = async () => {
      const localTasks = readTasksFromStorage() ?? tasksSeed
      const localEvents = readEventsFromStorage() ?? eventsSeed

      let loadedTasks = localTasks
      let loadedEvents = localEvents

      try {
        const tasksResponse = await fetch('/api/tasks')
        if (tasksResponse.ok) {
          const serverTasks: unknown = await tasksResponse.json()
          if (Array.isArray(serverTasks)) {
            loadedTasks = serverTasks as Task[]
          }
        }
      } catch {
      }

      try {
        const eventsResponse = await fetch('/api/events')
        if (eventsResponse.ok) {
          const serverEvents: unknown = await eventsResponse.json()
          if (Array.isArray(serverEvents)) {
            loadedEvents = serverEvents as CalendarEvent[]
          }
        }
      } catch {
      }

      setTasks(loadedTasks)
      setEvents(loadedEvents)
      setIsHydrated(true)
    }

    void hydrateData()
  }, [])

  React.useEffect(() => {
    if (!isHydrated) {
      return
    }

    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))

    void fetch('/api/tasks', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tasks }),
    })
  }, [tasks, isHydrated])

  React.useEffect(() => {
    if (!isHydrated) {
      return
    }

    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))

    void fetch('/api/events', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    })
  }, [events, isHydrated])

  const toggleTask = (taskId: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    )
  }

  const removeEvent = (eventId: number) => {
    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId))
    setEventMetaById((prevMeta) => {
      const updatedMeta = { ...prevMeta }
      delete updatedMeta[eventId]
      return updatedMeta
    })
  }

  const addDesktopEvent = () => {
    const title = window.prompt('Event title')?.trim()
    if (!title) {
      return
    }

    const time = window.prompt('Time range (e.g. 09:00 AM - 10:30 AM)', '09:00 AM - 10:30 AM')
    const location = window.prompt('Location', 'Science Building, Room 402')

    const newEventId = Date.now()
    const defaultMeta = getDefaultMetaForTitle(title)

    setEvents((prevEvents) => [
      ...prevEvents,
      {
        id: newEventId,
        title,
        date: selectedDateIso,
      },
    ])

    setEventMetaById((prevMeta) => ({
      ...prevMeta,
      [newEventId]: {
        ...defaultMeta,
        time: time?.trim() || defaultMeta.time,
        location: location?.trim() || defaultMeta.location,
      },
    }))
  }

  const onUploadFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) {
      return
    }

    const uploadedFiles = Array.from(incomingFiles).map((file) => ({
      id: Date.now() + Math.floor(Math.random() * 100000),
      name: file.name,
      size: formatFileSize(file.size),
      addedLabel: 'Added now',
      category: getManagedFileCategory(file.name),
      shared: false,
    }))

    setManagedFiles((prevFiles) => [...uploadedFiles, ...prevFiles])
  }

  const onDropToUpload = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragActive(false)
    onUploadFiles(event.dataTransfer.files)
  }

  const goToToday = () => {
    const now = new Date()
    setDisplayMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDateIso(formatDateIso(now))
  }

  const tasksDone = tasks.filter((task) => task.done).length
  const isCalendarScreen = activeMobileNav === 'calendar'
  const isFilesScreen = activeMobileNav === 'files'
  const isSubjectsScreen = activeMobileNav === 'subjects'

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(displayMonth)

  const upcomingEvents = React.useMemo(
    () => events.slice().sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  )

  const eventsByDate = React.useMemo(
    () =>
      events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
        if (!acc[event.date]) {
          acc[event.date] = []
        }
        acc[event.date].push(event)
        return acc
      }, {}),
    [events],
  )

  const calendarCells = React.useMemo(() => buildCalendarCells(displayMonth), [displayMonth])

  const selectedDayEvents = React.useMemo(
    () =>
      (eventsByDate[selectedDateIso] ?? [])
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title)),
    [eventsByDate, selectedDateIso],
  )

  const filesInCurrentTab = React.useMemo(
    () => managedFiles.filter((file) => (fileTab === 'shared' ? file.shared : true)),
    [managedFiles, fileTab],
  )

  const filteredManagedFiles = React.useMemo(
    () =>
      filesInCurrentTab.filter((file) => {
        if (fileTypeFilter === 'all' || fileTypeFilter === 'folder') {
          return true
        }

        return file.category === fileTypeFilter
      }),
    [filesInCurrentTab, fileTypeFilter],
  )

  const displayedRecentFiles = React.useMemo(
    () => (fileTab === 'recent' ? filteredManagedFiles : filteredManagedFiles.slice(0, 4)),
    [fileTab, filteredManagedFiles],
  )

  const filteredSubjects = React.useMemo(
    () =>
      subjectsSeed.filter((subject) =>
        subject.name.toLowerCase().includes(subjectSearch.trim().toLowerCase()),
      ),
    [subjectSearch],
  )

  const desktopSubjects = React.useMemo(
    () =>
      subjectsSeed.map((subject, index) => {
        const meta = desktopSubjectMetaByCode[subject.code] ?? {
          icon: '📘',
          tone: 'amber',
        }

        return {
          ...subject,
          meta,
          deadlineCount: Math.max(0, 3 - index),
        }
      }),
    [],
  )

  return (
    <div className={`dashboard-root theme-${themeMode} palette-${accentPalette} mobile-nav-${activeMobileNav} nav-${activeMobileNav}`}>
      <Sidebar activeMobileNav={activeMobileNav} setActiveMobileNav={setActiveMobileNav} />

      <main className="main-content">
        <Topbar
          isCalendarScreen={isCalendarScreen}
          isFilesScreen={isFilesScreen}
          isSubjectsScreen={isSubjectsScreen}
          fileInputRef={fileInputRef}
          setActiveMobileNav={setActiveMobileNav}
          accentPalette={accentPalette}
          setAccentPalette={setAccentPalette}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
        />

        <div className="mobile-content-scroll">
          <MobileFilesScreen
            fileTab={fileTab}
            setFileTab={setFileTab}
            fileTypeFilter={fileTypeFilter}
            setFileTypeFilter={setFileTypeFilter}
            folders={foldersSeed}
            displayedRecentFiles={displayedRecentFiles}
            isDragActive={isDragActive}
            setIsDragActive={setIsDragActive}
            onDropToUpload={onDropToUpload}
            onUploadFiles={onUploadFiles}
            fileInputRef={fileInputRef}
          />

          <MobileCalendarScreen
            monthLabel={monthLabel}
            calendarWeekDays={calendarWeekDays}
            calendarCells={calendarCells}
            eventsByDate={eventsByDate}
            selectedDateIso={selectedDateIso}
            setSelectedDateIso={setSelectedDateIso}
            selectedDayEvents={selectedDayEvents}
            eventMetaById={eventMetaById}
            getDefaultMetaForTitle={getDefaultMetaForTitle}
            setDisplayMonth={setDisplayMonth}
            addDesktopEvent={addDesktopEvent}
          />

          <MobileSubjectsScreen
            subjectSearch={subjectSearch}
            setSubjectSearch={setSubjectSearch}
            filteredSubjects={filteredSubjects}
            subjectVisualByCode={subjectVisualByCode}
          />

          <DashboardHomeContent
            tasksDone={tasksDone}
            tasks={tasks}
            upcomingEvents={upcomingEvents}
            getDeadlineMeta={getDeadlineMeta}
            getRelativeDaysLabel={getRelativeDaysLabel}
            schedule={scheduleSeed}
            managedFiles={managedFiles}
            filesSeed={filesSeed}
            subjects={subjectsSeed}
            toggleTask={toggleTask}
          />

          <DesktopCalendarScreen
            monthLabel={monthLabel}
            calendarWeekDays={calendarWeekDays}
            calendarCells={calendarCells}
            eventsByDate={eventsByDate}
            selectedDateIso={selectedDateIso}
            setSelectedDateIso={setSelectedDateIso}
            setDisplayMonth={setDisplayMonth}
            selectedDayEvents={selectedDayEvents}
            eventMetaById={eventMetaById}
            getDefaultMetaForTitle={getDefaultMetaForTitle}
            removeEvent={removeEvent}
            goToToday={goToToday}
            addDesktopEvent={addDesktopEvent}
          />

          <DesktopSubjectsScreen desktopSubjects={desktopSubjects} />

          <DesktopFilesScreen
            folders={foldersSeed}
            managedFiles={managedFiles}
            filesSeed={filesSeed}
            fileInputRef={fileInputRef}
            onUploadFiles={onUploadFiles}
          />
        </div>

        <MobileBottomNav activeMobileNav={activeMobileNav} setActiveMobileNav={setActiveMobileNav} />
      </main>
    </div>
  )
}

export default App
