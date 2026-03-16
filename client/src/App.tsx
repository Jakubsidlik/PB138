import React from 'react'
import './App.css'
<<<<<<< Updated upstream

type Subject = {
  id: number
  name: string
  teacher: string
  code: string
  files: number
  notes: number
}

type ScheduleItem = {
  id: number
  time: string
  subject: string
  type: string
  location: string
}

type StudyFile = {
  id: number
  subject: string
  name: string
  size: string
}

type FileCategory = 'folder' | 'pdf' | 'image' | 'document' | 'other'
type FileTab = 'all' | 'recent' | 'shared'

type ManagedFile = {
  id: number
  name: string
  size: string
  addedLabel: string
  category: FileCategory
  shared: boolean
}

type FileFolder = {
  id: number
  name: string
  filesCount: number
  color: 'amber' | 'emerald' | 'primary' | 'slate'
}

type Task = {
  id: number
  title: string
  done: boolean
}

type CalendarEvent = {
  id: number
  title: string
  date: string
}

type EventMeta = {
  time: string
  location: string
  icon: string
  accent: 'primary' | 'amber' | 'emerald'
}

type ThemeMode = 'light' | 'dark'
type AccentPalette = 'blue' | 'emerald' | 'violet' | 'rose'
type MobileNavItem = 'home' | 'calendar' | 'subjects' | 'files'

const TASKS_STORAGE_KEY = 'pb138.tasks'
const EVENTS_STORAGE_KEY = 'pb138.events'
const THEME_STORAGE_KEY = 'pb138.theme'
const PALETTE_STORAGE_KEY = 'pb138.palette'

const subjectsSeed: Subject[] = [
  {
    id: 1,
    name: 'Software Engineering',
    teacher: 'PROF. ANDERSON',
    code: 'SE',
    files: 12,
    notes: 48,
  },
  {
    id: 2,
    name: 'Artificial Intelligence',
    teacher: 'PROF. MILES',
    code: 'AI',
    files: 8,
    notes: 32,
  },
  {
    id: 3,
    name: 'Data Structures',
    teacher: 'PROF. SMITH',
    code: 'DS',
    files: 15,
    notes: 56,
  },
]

const scheduleSeed: ScheduleItem[] = [
  {
    id: 1,
    time: '09:00 - 10:30',
    subject: 'Software Engineering',
    type: 'Lecture',
    location: 'Hall B-12',
  },
  {
    id: 2,
    time: '11:00 - 12:30',
    subject: 'Artificial Intelligence',
    type: 'Live Now',
    location: 'Zoom',
  },
  {
    id: 3,
    time: '14:00 - 15:30',
    subject: 'Data Structures',
    type: 'Workshop',
    location: 'Lab 402',
  },
]

const filesSeed: StudyFile[] = [
  { id: 1, subject: 'SE', name: 'Lecture_05_Software_Design.pdf', size: '2.4 MB' },
  { id: 2, subject: 'AI', name: 'Neural_Networks_Notes.docx', size: '780 KB' },
  { id: 3, subject: 'DS', name: 'Heap_Exercises.zip', size: '1.1 MB' },
]

const foldersSeed: FileFolder[] = [
  { id: 1, name: 'Mathematics', filesCount: 12, color: 'amber' },
  { id: 2, name: 'Biology', filesCount: 8, color: 'emerald' },
  { id: 3, name: 'Study Group', filesCount: 24, color: 'primary' },
  { id: 4, name: 'Archives', filesCount: 105, color: 'slate' },
]

const managedFilesSeed: ManagedFile[] = [
  {
    id: 1,
    name: 'Assignment_v1.pdf',
    size: '2.4 MB',
    addedLabel: 'Added 2h ago',
    category: 'pdf',
    shared: true,
  },
  {
    id: 2,
    name: 'Project_Proposal.docx',
    size: '1.1 MB',
    addedLabel: 'Added yesterday',
    category: 'document',
    shared: false,
  },
]

const tasksSeed: Task[] = [
  { id: 1, title: 'Dokončit Data Structures essay', done: false },
  { id: 2, title: 'Přečíst materiály na AI cvičení', done: true },
  { id: 3, title: 'Nahrát zápisky z přednášky SE', done: false },
  { id: 4, title: 'Zkontrolovat termíny deadlinů', done: true },
]

const eventsSeed: CalendarEvent[] = [
  { id: 1, title: 'Data Structures Essay Deadline', date: '2026-03-18' },
  { id: 2, title: 'AI Lecture', date: '2026-03-19' },
  { id: 3, title: 'SE Exercise', date: '2026-03-20' },
]

const eventMetaSeed: Record<number, EventMeta> = {
  1: {
    time: '09:00 AM - 10:30 AM',
    location: 'Science Building, Room 402',
    icon: '🧮',
    accent: 'primary',
  },
  2: {
    time: '01:00 PM - 03:00 PM',
    location: 'Main Lab, Block C',
    icon: '🧪',
    accent: 'amber',
  },
  3: {
    time: '04:30 PM - 05:30 PM',
    location: 'Student Union Lounge',
    icon: '👥',
    accent: 'emerald',
  },
}

const isTask = (value: unknown): value is Task => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const task = value as Task
  return (
    typeof task.id === 'number' &&
    typeof task.title === 'string' &&
    typeof task.done === 'boolean'
  )
}

const isCalendarEvent = (value: unknown): value is CalendarEvent => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const event = value as CalendarEvent
  return (
    typeof event.id === 'number' &&
    typeof event.title === 'string' &&
    typeof event.date === 'string'
  )
}

const readTasksFromStorage = (): Task[] | null => {
  const raw = localStorage.getItem(TASKS_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every(isTask)) {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

const readEventsFromStorage = (): CalendarEvent[] | null => {
  const raw = localStorage.getItem(EVENTS_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every(isCalendarEvent)) {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

const readThemeFromStorage = (): ThemeMode => {
  const raw = localStorage.getItem(THEME_STORAGE_KEY)
  return raw === 'dark' ? 'dark' : 'light'
}

const readPaletteFromStorage = (): AccentPalette => {
  const raw = localStorage.getItem(PALETTE_STORAGE_KEY)

  if (raw === 'emerald' || raw === 'violet' || raw === 'rose') {
    return raw
  }

  return 'blue'
}

const getNavFromHash = (hash: string): MobileNavItem => {
  if (hash === '#calendar') {
    return 'calendar'
  }
  if (hash === '#subjects') {
    return 'subjects'
  }
  if (hash === '#files') {
    return 'files'
  }

  return 'home'
}

const formatDateIso = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDefaultMetaForTitle = (title: string): EventMeta => {
  const lower = title.toLowerCase()

  if (lower.includes('lab') || lower.includes('chem')) {
    return {
      time: '01:00 PM - 03:00 PM',
      location: 'Main Lab, Block C',
      icon: '🧪',
      accent: 'amber',
    }
  }

  if (lower.includes('meeting') || lower.includes('group') || lower.includes('org')) {
    return {
      time: '04:30 PM - 05:30 PM',
      location: 'Student Union Lounge',
      icon: '👥',
      accent: 'emerald',
    }
  }

  return {
    time: '09:00 AM - 10:30 AM',
    location: 'Science Building, Room 402',
    icon: '📘',
    accent: 'primary',
  }
}

const getManagedFileCategory = (fileName: string): FileCategory => {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') {
    return 'pdf'
  }

  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') {
    return 'image'
  }

  if (ext === 'doc' || ext === 'docx' || ext === 'txt' || ext === 'rtf' || ext === 'ppt') {
    return 'document'
  }

  return 'other'
}

const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
}
=======
import {
  calendarWeekDays,
  filesSeed,
  foldersSeed,
  scheduleSeed,
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
>>>>>>> Stashed changes

function App() {
  const [tasks, setTasks] = React.useState<Task[]>(tasksSeed)
  const [events, setEvents] = React.useState<CalendarEvent[]>(eventsSeed)
  const [eventTitle, setEventTitle] = React.useState('')
  const [eventDate, setEventDate] = React.useState('2026-03-16')
  const [themeMode, setThemeMode] = React.useState<ThemeMode>(() => readThemeFromStorage())
  const [accentPalette, setAccentPalette] = React.useState<AccentPalette>(() =>
    readPaletteFromStorage(),
  )
  const [activeMobileNav, setActiveMobileNav] = React.useState<MobileNavItem>(() =>
    getNavFromHash(window.location.hash),
  )
  const [displayMonth, setDisplayMonth] = React.useState(() => new Date())
  const [selectedDateIso, setSelectedDateIso] = React.useState(() => formatDateIso(new Date()))
  const [eventMetaById, setEventMetaById] = React.useState<Record<number, EventMeta>>(eventMetaSeed)
  const [fileTab, setFileTab] = React.useState<FileTab>('all')
  const [fileTypeFilter, setFileTypeFilter] = React.useState<'all' | 'folder' | 'pdf' | 'image'>('all')
  const [managedFiles, setManagedFiles] = React.useState<ManagedFile[]>(managedFilesSeed)
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
          if (Array.isArray(serverTasks) && serverTasks.every(isTask)) {
            loadedTasks = serverTasks
          }
        }
      } catch {
      }

      try {
        const eventsResponse = await fetch('/api/events')
        if (eventsResponse.ok) {
          const serverEvents: unknown = await eventsResponse.json()
          if (Array.isArray(serverEvents) && serverEvents.every(isCalendarEvent)) {
            loadedEvents = serverEvents
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

  const tasksDone = tasks.filter((task) => task.done).length
  const progress = tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0
  const isFilesScreen = activeMobileNav === 'files'

  const calendarWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(displayMonth)

  const toggleTask = (taskId: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    )
  }

  const addEvent = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = eventTitle.trim()
    if (!trimmedTitle || !eventDate) {
      return
    }

    setEvents((prevEvents) => [
      ...prevEvents,
      {
        id: Date.now(),
        title: trimmedTitle,
        date: eventDate,
      },
    ])
    setEventTitle('')
  }

  const removeEvent = (eventId: number) => {
    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId))
    setEventMetaById((prevMeta) => {
      const updatedMeta = { ...prevMeta }
      delete updatedMeta[eventId]
      return updatedMeta
    })
  }

  const calendarDays = Array.from({ length: 31 }, (_, index) => index + 1)
  const upcomingEvents = events.slice().sort((a, b) => a.date.localeCompare(b.date))

  const getDeadlineMeta = (index: number) => {
    if (index === 0) {
      return { label: 'High Priority', className: 'high', progress: 80 }
    }
    if (index === 1) {
      return { label: 'Medium Priority', className: 'medium', progress: 40 }
    }

    return { label: 'Low Priority', className: 'low', progress: 20 }
  }

  const getRelativeDaysLabel = (date: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const eventDate = new Date(date)
    eventDate.setHours(0, 0, 0, 0)

    const diffMs = eventDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) {
      return 'Today'
    }

    if (diffDays === 1) {
      return 'In 1 day'
    }

    return `In ${diffDays} days`
  }

  const eventsByDay = events.reduce<Record<number, CalendarEvent[]>>((acc, event) => {
    const day = new Date(event.date).getDate()
    if (!acc[day]) {
      acc[day] = []
    }
    acc[day].push(event)
    return acc
  }, {})

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = []
    }
    acc[event.date].push(event)
    return acc
  }, {})

  const calendarCells = React.useMemo(() => {
    const year = displayMonth.getFullYear()
    const month = displayMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const startOffset = firstDay.getDay()
    const startDate = new Date(year, month, 1 - startOffset)

    return Array.from({ length: 35 }, (_, index) => {
      const cellDate = new Date(startDate)
      cellDate.setDate(startDate.getDate() + index)

      return {
        date: cellDate,
        iso: formatDateIso(cellDate),
        inCurrentMonth: cellDate.getMonth() === month,
      }
    })
  }, [displayMonth])

  const selectedDayEvents = (eventsByDate[selectedDateIso] ?? []).slice().sort((a, b) =>
    a.title.localeCompare(b.title),
  )

  const goToToday = () => {
    const now = new Date()
    setDisplayMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDateIso(formatDateIso(now))
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

  const onDropToUpload = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragActive(false)
    onUploadFiles(e.dataTransfer.files)
  }

  const filesInCurrentTab = managedFiles.filter((file) => {
    if (fileTab === 'shared') {
      return file.shared
    }

    return true
  })

  const filteredManagedFiles = filesInCurrentTab.filter((file) => {
    if (fileTypeFilter === 'all' || fileTypeFilter === 'folder') {
      return true
    }

    return file.category === fileTypeFilter
  })

  const displayedRecentFiles =
    fileTab === 'recent'
      ? filteredManagedFiles
      : filteredManagedFiles.slice(0, 4)

  return (
    <div
      className={`dashboard-root theme-${themeMode} palette-${accentPalette} mobile-nav-${activeMobileNav} nav-${activeMobileNav}`}
    >
<<<<<<< Updated upstream
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🎓</div>
          <div>
            <h1>StudentHub</h1>
            <p>Academic v2.0</p>
          </div>
=======
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
            subjects={state.subjects}
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
>>>>>>> Stashed changes
        </div>

        <nav className="menu">
          <a
            className={`menu-item ${activeMobileNav === 'home' ? 'active' : ''}`}
            href="#"
            onClick={() => setActiveMobileNav('home')}
          >
            Dashboard
          </a>
          <a
            className={`menu-item ${activeMobileNav === 'calendar' ? 'active' : ''}`}
            href="#calendar"
            onClick={() => setActiveMobileNav('calendar')}
          >
            Kalendář
          </a>
          <a
            className={`menu-item ${activeMobileNav === 'subjects' ? 'active' : ''}`}
            href="#subjects"
            onClick={() => setActiveMobileNav('subjects')}
          >
            Předměty
          </a>
          <a
            className={`menu-item ${activeMobileNav === 'files' ? 'active' : ''}`}
            href="#files"
            onClick={() => setActiveMobileNav('files')}
          >
            Soubory
          </a>
        </nav>

        <div className="storage-card">
          <p className="storage-title">Storage Usage</p>
          <div className="storage-bar">
            <div className="storage-progress" />
          </div>
          <p className="storage-caption">6.5GB z 10GB použito</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-mobile">
            <div className="mobile-greeting">
              {isFilesScreen ? <div className="mobile-avatar files-avatar">📂</div> : <div className="mobile-avatar">JK</div>}
              <div>
                <p>{isFilesScreen ? 'File Manager' : 'Vítej zpět,'}</p>
                <h1>{isFilesScreen ? 'Organization Files' : 'Jakub Kowalski'}</h1>
              </div>
            </div>
            {isFilesScreen ? (
              <div className="mobile-files-actions">
                <button type="button" className="mobile-notification" aria-label="Hledat soubory">
                  🔎
                </button>
                <button
                  type="button"
                  className="mobile-notification mobile-notification-primary"
                  aria-label="Přidat soubor"
                  onClick={() => fileInputRef.current?.click()}
                >
                  ＋
                </button>
              </div>
            ) : (
              <button type="button" className="mobile-notification" aria-label="Notifikace">
                🔔
              </button>
            )}
          </div>

          <div className="topbar-desktop">
            <input
              className="search"
              placeholder="Hledat úkoly, poznámky nebo soubory..."
              type="text"
            />
            <div className="appearance-controls">
              <label htmlFor="palette-select">Paleta</label>
              <select
                id="palette-select"
                value={accentPalette}
                onChange={(e) => setAccentPalette(e.target.value as AccentPalette)}
              >
                <option value="blue">Modrá</option>
                <option value="emerald">Smaragdová</option>
                <option value="violet">Fialová</option>
                <option value="rose">Růžová</option>
              </select>
              <button
                type="button"
                className="theme-toggle"
                onClick={() => setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))}
              >
                {themeMode === 'light' ? 'Tmavý režim' : 'Světlý režim'}
              </button>
            </div>
            <div className="profile">
              <div>
                <p className="name">Jakub Kowalski</p>
                <p className="subtitle">Computer Science Major</p>
              </div>
              <div className="avatar">JK</div>
            </div>
          </div>
        </header>

        <div className="mobile-content-scroll">
          <section className="mobile-files-screen" id="files-mobile">
          <div className="file-tabs">
            <button
              type="button"
              className={fileTab === 'all' ? 'active' : ''}
              onClick={() => setFileTab('all')}
            >
              All Files
            </button>
            <button
              type="button"
              className={fileTab === 'recent' ? 'active' : ''}
              onClick={() => setFileTab('recent')}
            >
              Recent
            </button>
            <button
              type="button"
              className={fileTab === 'shared' ? 'active' : ''}
              onClick={() => setFileTab('shared')}
            >
              Shared
            </button>
          </div>

          <div className="file-filters no-scrollbar">
            <button
              type="button"
              className={fileTypeFilter === 'folder' ? 'active' : ''}
              onClick={() => setFileTypeFilter((prev) => (prev === 'folder' ? 'all' : 'folder'))}
            >
              Folders ▾
            </button>
            <button
              type="button"
              className={fileTypeFilter === 'pdf' ? 'active' : ''}
              onClick={() => setFileTypeFilter((prev) => (prev === 'pdf' ? 'all' : 'pdf'))}
            >
              PDFs ▾
            </button>
            <button
              type="button"
              className={fileTypeFilter === 'image' ? 'active' : ''}
              onClick={() => setFileTypeFilter((prev) => (prev === 'image' ? 'all' : 'image'))}
            >
              Images ▾
            </button>
          </div>

          <section className="files-section">
            <h3>
              Folders <span>({foldersSeed.length})</span>
            </h3>
            <div className="folders-grid">
              {foldersSeed.map((folder) => (
                <article key={folder.id} className="folder-card">
                  <span className={`folder-icon ${folder.color}`}>📁</span>
                  <p>{folder.name}</p>
                  <small>{folder.filesCount} files</small>
                </article>
              ))}
            </div>
          </section>

          <section className="files-section">
            <h3>
              Recent Files <span>({displayedRecentFiles.length})</span>
            </h3>
            <div className="recent-files-list">
              {displayedRecentFiles.map((file) => (
                <article key={file.id} className="recent-file-item">
                  <div className={`recent-file-icon ${file.category}`}>
                    {file.category === 'pdf' ? '📕' : file.category === 'image' ? '🖼️' : '📄'}
                  </div>
                  <div className="recent-file-content">
                    <p>{file.name}</p>
                    <small>
                      {file.addedLabel} • {file.size}
                    </small>
                  </div>
                  <button type="button" className="recent-file-more" aria-label="Více možností">
                    ⋮
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="upload-area-wrap">
            <div
              className={`upload-area ${isDragActive ? 'drag-active' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragActive(true)
              }}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={onDropToUpload}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <div className="upload-icon">☁️</div>
              <p>Přetáhněte soubory sem</p>
              <small>nebo klikněte pro výběr z počítače</small>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden-file-input"
              onChange={(e) => {
                onUploadFiles(e.target.files)
                e.currentTarget.value = ''
              }}
            />
          </section>
          </section>

          <div className="mobile-dashboard-content desktop-dashboard-content">
          <section className="welcome">
            <div>
              <h2>Dobré ráno, Jakube!</h2>
              <p>Dnes je pondělí. Máš před sebou nabitý studijní den.</p>
            </div>
          </section>

          <section className="stats-grid">
            <article className="progress-card">
              <div>
                <p className="eyebrow">Daily Progress</p>
                <h3>Tasks for Today</h3>
                <p>
                  Dokončeno {tasksDone} z {tasks.length} úkolů.
                </p>
              </div>
              <div className="progress-ring">{progress}%</div>
            </article>

            <article className="deadlines-card">
              <h3>Upcoming Deadlines</h3>
              <ul>
                {upcomingEvents
                  .slice(0, 3)
                  .map((event, index) => {
                    const meta = getDeadlineMeta(index)
                    return (
                      <li key={event.id}>
                        <div className="deadline-top">
                          <span className={`deadline-priority ${meta.className}`}>{meta.label}</span>
                          <small>{getRelativeDaysLabel(event.date)}</small>
                        </div>
                        <p>{event.title}</p>
                        <small>{event.date}</small>
                        <div className="deadline-progress-track">
                          <span
                            className={`deadline-progress-fill ${meta.className}`}
                            style={{ width: `${meta.progress}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
              </ul>
            </article>
          </section>

          <section className="main-grid">
          <div className="left-column">
            <article className="card" id="schedule">
              <div className="section-head">
                <h3>Today's Schedule</h3>
                <button type="button" className="text-button">See All</button>
              </div>
              <div className="mobile-schedule-list">
                {scheduleSeed.map((item) => (
                  <div key={item.id} className="mobile-schedule-item">
                    <div className="mobile-schedule-icon">{item.subject.slice(0, 2).toUpperCase()}</div>
                    <div className="mobile-schedule-content">
                      <h4>{item.subject}</h4>
                      <p>{item.time}</p>
                    </div>
                    <div className="mobile-schedule-location">{item.location}</div>
                  </div>
                ))}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleSeed.map((item) => (
                    <tr key={item.id} className={item.type === 'Live Now' ? 'live-row' : ''}>
                      <td>{item.time}</td>
                      <td>{item.subject}</td>
                      <td>{item.type}</td>
                      <td>{item.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>

            <article className="card" id="calendar">
              <h3>Kalendář</h3>
              <div className="calendar-grid">
                {calendarDays.map((day) => (
                  <div key={day} className="calendar-day">
                    <strong>{day}</strong>
                    {eventsByDay[day]?.slice(0, 2).map((event) => (
                      <div key={event.id} className="event-dot" title={event.title}>
                        {event.title}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <form className="event-form" onSubmit={addEvent}>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Název eventu"
                />
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
                <button type="submit">Přidat event</button>
              </form>

              <ul className="event-list">
                {upcomingEvents.map((event) => (
                    <li key={event.id}>
                      <div>
                        <p>{event.title}</p>
                        <small>{event.date}</small>
                      </div>
                      <button type="button" onClick={() => removeEvent(event.id)}>
                        Odebrat
                      </button>
                    </li>
                  ))}
              </ul>
            </article>

            <article className="card" id="files">
              <h3>Soubory</h3>
              <ul className="file-list">
                {managedFiles.slice(0, 3).map((file, index) => (
                  <li key={file.id}>
                    <span>{filesSeed[index]?.name ?? file.name}</span>
                    <small>
                      {filesSeed[index]?.subject ?? 'UP'} • {file.size}
                    </small>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="right-column">
            <article className="card" id="subjects">
              <h3>My Subjects</h3>
              <div className="subjects-grid">
                {subjectsSeed.map((subject) => (
                  <div key={subject.id} className="subject-item">
                    <div className="subject-head">
                      <span className="subject-code">{subject.code}</span>
                      <small>{subject.teacher}</small>
                    </div>
                    <h4>{subject.name}</h4>
                    <p>
                      {subject.files} files • {subject.notes} notes
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="card">
              <h3>Tasks for Today</h3>
              <ul className="task-list">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => toggleTask(task.id)}
                      />
                      <span className={task.done ? 'done' : ''}>{task.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          </section>
          </div>

          <section className="desktop-calendar-screen" id="desktop-calendar">
            <div className="desktop-calendar-head">
              <div>
                <h2>Calendar</h2>
                <p>Manage your academic schedule and deadlines</p>
              </div>
              <div className="desktop-calendar-controls">
                <button type="button" onClick={goToToday}>Today</button>
                <div className="month-switch">
                  <button
                    type="button"
                    onClick={() =>
                      setDisplayMonth(
                        (prevMonth) =>
                          new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1),
                      )
                    }
                  >
                    ‹
                  </button>
                  <span>{monthLabel}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDisplayMonth(
                        (prevMonth) =>
                          new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1),
                      )
                    }
                  >
                    ›
                  </button>
                </div>
                <button type="button" className="primary" onClick={addDesktopEvent}>
                  Add Event
                </button>
              </div>
            </div>

            <div className="desktop-calendar-grid-wrap">
              <article className="desktop-month-grid">
                <div className="weekdays-row">
                  {calendarWeekDays.map((dayLabel) => (
                    <div key={dayLabel}>{dayLabel}</div>
                  ))}
                </div>

                <div className="month-cells-grid">
                  {calendarCells.map((cell) => {
                    const dayEvents = eventsByDate[cell.iso] ?? []
                    const isToday = cell.iso === formatDateIso(new Date())
                    const isSelected = cell.iso === selectedDateIso

                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        className={`month-cell ${cell.inCurrentMonth ? '' : 'muted'} ${
                          isToday ? 'today' : ''
                        } ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedDateIso(cell.iso)
                          setDisplayMonth(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1))
                        }}
                      >
                        <span className="day-number">{cell.date.getDate()}</span>
                        <div className="day-events-preview">
                          {dayEvents.slice(0, 2).map((dayEvent) => (
                            <span key={dayEvent.id} className="event-pill" title={dayEvent.title}>
                              {dayEvent.title}
                            </span>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </article>

              <aside className="desktop-events-panel">
                <section className="events-card">
                  <h3>
                    Events for{' '}
                    {new Intl.DateTimeFormat('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }).format(new Date(selectedDateIso))}
                  </h3>

                  <div className="events-list-desktop">
                    {selectedDayEvents.length === 0 ? (
                      <p className="empty-events">No events for selected day.</p>
                    ) : (
                      selectedDayEvents.map((event) => {
                        const meta = eventMetaById[event.id] ?? getDefaultMetaForTitle(event.title)
                        return (
                          <article
                            key={event.id}
                            className={`desktop-event-item accent-${meta.accent}`}
                          >
                            <div className="desktop-event-icon">{meta.icon}</div>
                            <div className="desktop-event-content">
                              <h4>{event.title}</h4>
                              <p>{meta.time}</p>
                              <small>{meta.location}</small>
                            </div>
                          </article>
                        )
                      })
                    )}
                  </div>

                  <button type="button" className="outline-full-width">
                    View Full Day Schedule
                  </button>
                </section>

                <section className="exam-callout">
                  <h3>Exam Season is Coming</h3>
                  <p>Your finals start in 12 days. Don&apos;t forget to review your study plan.</p>
                  <button type="button">View Study Guide</button>
                </section>
              </aside>
            </div>
          </section>
        </div>

        <nav className="mobile-bottom-nav" aria-label="Mobilní navigace">
          <a
            className={activeMobileNav === 'home' ? 'active' : ''}
            href="#"
            onClick={() => setActiveMobileNav('home')}
          >
            <span className="nav-icon" aria-hidden="true">🏠</span>
            <span className="nav-label">Home</span>
          </a>
          <a
            className={activeMobileNav === 'calendar' ? 'active' : ''}
            href="#calendar"
            onClick={() => setActiveMobileNav('calendar')}
          >
            <span className="nav-icon" aria-hidden="true">📅</span>
            <span className="nav-label">Calendar</span>
          </a>
          <a
            className={activeMobileNav === 'subjects' ? 'active' : ''}
            href="#subjects"
            onClick={() => setActiveMobileNav('subjects')}
          >
            <span className="nav-icon" aria-hidden="true">📚</span>
            <span className="nav-label">Subjects</span>
          </a>
          <a
            className={activeMobileNav === 'files' ? 'active' : ''}
            href="#files"
            onClick={() => setActiveMobileNav('files')}
          >
            <span className="nav-icon" aria-hidden="true">📁</span>
            <span className="nav-label">Files</span>
          </a>
        </nav>
      </main>
    </div>
  )
}

export default App
