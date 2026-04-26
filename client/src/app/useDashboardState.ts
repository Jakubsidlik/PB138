import React from 'react'
import {
  desktopSubjectMetaByCode,
  eventMetaSeed,
  eventsSeed,
  EVENTS_STORAGE_KEY,
  managedFilesSeed,
  PALETTE_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  subjectsSeed,
  tasksSeed,
  TASKS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  userProfileSeed,
} from './data'
import {
  AccentPalette,
  AuthSession,
  CalendarEvent,
  EventMeta,
  FileTab,
  ManagedFile,
  MobileNavItem,
  Task,
  ThemeMode,
  UserProfile,
} from './types'
import {
  readEventsFromStorage,
  readPaletteFromStorage,
  readProfileFromStorage,
  readTasksFromStorage,
  readThemeFromStorage,
} from './storage'
import {
  buildCalendarCells,
  formatDateIso,
  formatFileSize,
  getDefaultMetaForTitle,
  getManagedFileCategory,
  getNavFromHash,
} from './utils'

type SubjectFilter = 'all' | 'active' | 'archived'
const AUTH_SESSION_STORAGE_KEY = 'pb138-auth-session'

const readAuthSessionFromStorage = (): AuthSession | null => {
  const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }

    const session = parsed as Partial<AuthSession>
    if (
      typeof session.userId !== 'number' ||
      (session.role !== 'REGISTERED' && session.role !== 'ADMIN') ||
      typeof session.fullName !== 'string' ||
      typeof session.email !== 'string'
    ) {
      return null
    }

    return {
      userId: session.userId,
      role: session.role,
      fullName: session.fullName,
      email: session.email,
    }
  } catch {
    return null
  }
}

const toEventMeta = (event: CalendarEvent, fallbackTitle: string): EventMeta => {
  const fallback = getDefaultMetaForTitle(fallbackTitle)

  return {
    time: event.time ?? fallback.time,
    location: event.location ?? fallback.location,
    icon: event.icon ?? fallback.icon,
    accent: event.accent ?? fallback.accent,
  }
}

export function useDashboardState() {
  const [tasks, setTasks] = React.useState<Task[]>(tasksSeed)
  const [events, setEvents] = React.useState<CalendarEvent[]>(eventsSeed)
  const [subjects, setSubjects] = React.useState(subjectsSeed)
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
  const [subjectFilter, setSubjectFilter] = React.useState<SubjectFilter>('all')
  const [isDragActive, setIsDragActive] = React.useState(false)
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [profile, setProfile] = React.useState<UserProfile>(() =>
    readProfileFromStorage() ?? userProfileSeed,
  )
  const [authSession, setAuthSession] = React.useState<AuthSession | null>(() =>
    readAuthSessionFromStorage(),
  )

  const apiFetch = React.useCallback(
    (input: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      if (authSession?.userId) {
        headers.set('x-user-id', String(authSession.userId))
      }

      return fetch(input, {
        ...init,
        headers,
      })
    },
    [authSession?.userId],
  )

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
    if (authSession) {
      localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(authSession))
      return
    }

    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
  }, [authSession])

  React.useEffect(() => {
    const hydrateData = async () => {
      const localTasks = authSession ? (readTasksFromStorage() ?? tasksSeed) : []
      const localEvents = authSession ? (readEventsFromStorage() ?? eventsSeed) : []
      const localProfile = readProfileFromStorage() ?? userProfileSeed

      let loadedTasks = localTasks
      let loadedEvents = localEvents
      let loadedSubjects = authSession ? subjectsSeed : []
      let loadedFiles = authSession ? managedFilesSeed : []
      let loadedProfile = localProfile

      try {
        const tasksResponse = await apiFetch('/api/tasks')
        if (tasksResponse.ok) {
          const serverTasks: unknown = await tasksResponse.json()
          if (Array.isArray(serverTasks)) {
            loadedTasks = serverTasks as Task[]
          }
        }
      } catch {
      }

      try {
        const eventsResponse = await apiFetch('/api/events')
        if (eventsResponse.ok) {
          const serverEvents: unknown = await eventsResponse.json()
          if (Array.isArray(serverEvents)) {
            loadedEvents = serverEvents as CalendarEvent[]
          }
        }
      } catch {
      }

      try {
        const subjectsResponse = await apiFetch('/api/subjects')
        if (subjectsResponse.ok) {
          const serverSubjects: unknown = await subjectsResponse.json()
          if (Array.isArray(serverSubjects)) {
            loadedSubjects = serverSubjects as typeof subjectsSeed
          }
        }
      } catch {
      }

      try {
        const filesResponse = await apiFetch('/api/files')
        if (filesResponse.ok) {
          const serverFiles: unknown = await filesResponse.json()
          if (Array.isArray(serverFiles)) {
            loadedFiles = serverFiles as ManagedFile[]
          }
        }
      } catch {
      }

      try {
        const profileResponse = await apiFetch('/api/profile')
        if (profileResponse.ok) {
          const serverProfile: unknown = await profileResponse.json()
          if (typeof serverProfile === 'object' && serverProfile !== null) {
            loadedProfile = {
              ...userProfileSeed,
              ...(serverProfile as Partial<UserProfile>),
            }
          }
        }
      } catch {
      }

      const nextMetaById = loadedEvents.reduce<Record<number, EventMeta>>((acc, event) => {
        acc[event.id] = toEventMeta(event, event.title)
        return acc
      }, {})

      setTasks(loadedTasks)
      setEvents(loadedEvents)
      setSubjects(loadedSubjects)
      setManagedFiles(loadedFiles)
      setProfile(loadedProfile)
      setEventMetaById(Object.keys(nextMetaById).length > 0 ? nextMetaById : eventMetaSeed)
      setIsHydrated(true)
    }

    void hydrateData()
  }, [apiFetch, authSession])

  React.useEffect(() => {
    if (!isHydrated || !authSession) {
      return
    }

    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))

    void apiFetch('/api/tasks', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tasks }),
    })
  }, [tasks, isHydrated, apiFetch, authSession])

  React.useEffect(() => {
    if (!isHydrated || !authSession) {
      return
    }

    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))

    void apiFetch('/api/events', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    })
  }, [events, isHydrated, apiFetch, authSession])

  React.useEffect(() => {
    if (!isHydrated || !authSession) {
      return
    }

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))

    void apiFetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    })
  }, [profile, isHydrated, apiFetch, authSession])

  const ensureAuthenticated = () => {
    if (authSession) {
      return true
    }

    window.alert('Tato akce vyzaduje prihlaseni.')
    return false
  }

  const refreshSubjects = async () => {
    const response = await apiFetch('/api/subjects')
    if (!response.ok) {
      return
    }

    const payload: unknown = await response.json()
    if (Array.isArray(payload)) {
      setSubjects(payload as typeof subjectsSeed)
    }
  }

  const refreshFiles = async () => {
    const response = await apiFetch('/api/files')
    if (!response.ok) {
      return
    }

    const payload: unknown = await response.json()
    if (Array.isArray(payload)) {
      setManagedFiles(payload as ManagedFile[])
    }
  }

  const toggleTask = (taskId: number) => {
    if (!ensureAuthenticated()) {
      return
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    )
  }

  const removeEvent = (eventId: number) => {
    if (!ensureAuthenticated()) {
      return
    }

    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId))
    setEventMetaById((prevMeta) => {
      const updatedMeta = { ...prevMeta }
      delete updatedMeta[eventId]
      return updatedMeta
    })

    void apiFetch(`/api/events/${eventId}`, { method: 'DELETE' })
  }

  const addDesktopEvent = () => {
    if (!ensureAuthenticated()) {
      return
    }

    const title = window.prompt('Event title')?.trim()
    if (!title) {
      return
    }

    const time = window.prompt('Time range (e.g. 09:00 AM - 10:30 AM)', '09:00 AM - 10:30 AM')
    const location = window.prompt('Location', 'Science Building, Room 402')

    const newEventId = Date.now()
    const defaultMeta = getDefaultMetaForTitle(title)
    const nextEvent: CalendarEvent = {
      id: newEventId,
      title,
      date: selectedDateIso,
      time: time?.trim() || defaultMeta.time,
      location: location?.trim() || defaultMeta.location,
      icon: defaultMeta.icon,
      accent: defaultMeta.accent,
      subjectId: null,
    }

    setEvents((prevEvents) => [...prevEvents, nextEvent])

    setEventMetaById((prevMeta) => ({
      ...prevMeta,
      [newEventId]: {
        ...defaultMeta,
        time: time?.trim() || defaultMeta.time,
        location: location?.trim() || defaultMeta.location,
      },
    }))

    void apiFetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nextEvent),
    })
  }

  const onUploadFiles = (incomingFiles: FileList | null) => {
    if (!ensureAuthenticated()) {
      return
    }

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

    uploadedFiles.forEach((file) => {
      void apiFetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(file),
      })
    })
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

  const onOpenProfile = () => {
    setActiveMobileNav('profile')
    window.location.hash = 'profile'
  }

  const onChangeProfile = (field: keyof Omit<UserProfile, 'avatarDataUrl'>, value: string) => {
    if (!ensureAuthenticated()) {
      return
    }

    setProfile((prevProfile) => ({
      ...prevProfile,
      [field]: value,
    }))
  }

  const onUploadProfileAvatar = (files: FileList | null) => {
    if (!ensureAuthenticated()) {
      return
    }

    const file = files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      setProfile((prevProfile) => ({
        ...prevProfile,
        avatarDataUrl: result,
      }))
    }

    reader.readAsDataURL(file)
  }

  const onRemoveProfileAvatar = () => {
    if (!ensureAuthenticated()) {
      return
    }

    setProfile((prevProfile) => ({
      ...prevProfile,
      avatarDataUrl: null,
    }))
  }

  const resetProfile = () => {
    if (!ensureAuthenticated()) {
      return
    }

    setProfile(userProfileSeed)
  }

  const applyAuthPayload = (payload: unknown): string | null => {
    if (typeof payload !== 'object' || payload === null || !('user' in payload)) {
      return 'Neplatna odpoved serveru.'
    }

    const user = (payload as { user?: unknown }).user
    if (typeof user !== 'object' || user === null) {
      return 'Neplatna odpoved serveru.'
    }

    const candidate = user as Partial<AuthSession> & Partial<UserProfile>
    if (
      typeof candidate.userId !== 'number' ||
      (candidate.role !== 'REGISTERED' && candidate.role !== 'ADMIN') ||
      typeof candidate.fullName !== 'string' ||
      typeof candidate.email !== 'string'
    ) {
      return 'Neplatna odpoved serveru.'
    }

    const authUserId = candidate.userId
    const authRole = candidate.role
    const authFullName = candidate.fullName
    const authEmail = candidate.email

    setAuthSession({
      userId: authUserId,
      role: authRole,
      fullName: authFullName,
      email: authEmail,
    })

    setProfile((prevProfile) => ({
      ...prevProfile,
      fullName: authFullName,
      email: authEmail,
      school: typeof candidate.school === 'string' ? candidate.school : prevProfile.school,
      studyMajor: typeof candidate.studyMajor === 'string' ? candidate.studyMajor : prevProfile.studyMajor,
      studyYear: typeof candidate.studyYear === 'string' ? candidate.studyYear : prevProfile.studyYear,
      studyType: typeof candidate.studyType === 'string' ? candidate.studyType : prevProfile.studyType,
      avatarDataUrl:
        typeof candidate.avatarDataUrl === 'string' || candidate.avatarDataUrl === null
          ? candidate.avatarDataUrl
          : prevProfile.avatarDataUrl,
    }))

    return null
  }

  const login = async (email: string, password: string): Promise<string | null> => {
    if (!email.trim() || !password.trim()) {
      return 'Vypln e-mail i heslo.'
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        if (typeof payload === 'object' && payload !== null && 'error' in payload) {
          const message = (payload as { error?: unknown }).error
          if (typeof message === 'string') {
            return message
          }
        }

        return 'Prihlaseni selhalo.'
      }

      return applyAuthPayload(payload)
    } catch {
      return 'Nepodarilo se spojit se serverem.'
    }
  }

  const register = async (
    fullName: string,
    email: string,
    password: string,
  ): Promise<string | null> => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      return 'Vypln jmeno, e-mail i heslo.'
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        }),
      })

      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        if (typeof payload === 'object' && payload !== null && 'error' in payload) {
          const message = (payload as { error?: unknown }).error
          if (typeof message === 'string') {
            return message
          }
        }

        return 'Registrace selhala.'
      }

      return applyAuthPayload(payload)
    } catch {
      return 'Nepodarilo se spojit se serverem.'
    }
  }

  const logout = () => {
    setAuthSession(null)
  }

  const createSubject = () => {
    if (!ensureAuthenticated()) {
      return
    }

    const name = window.prompt('Název předmětu')?.trim()
    if (!name) {
      return
    }

    const teacher = window.prompt('Vyučující')?.trim()
    if (!teacher) {
      return
    }

    const code = window.prompt('Kód předmětu (např. PB138)')?.trim().toUpperCase()
    if (!code) {
      return
    }

    void apiFetch('/api/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, teacher, code }),
    }).then(() => {
      void refreshSubjects()
    })
  }

  const updateSubject = (subjectId: number) => {
    if (!ensureAuthenticated()) {
      return
    }

    const subject = subjects.find((item) => item.id === subjectId)
    if (!subject) {
      return
    }

    const name = window.prompt('Název předmětu', subject.name)?.trim()
    if (!name) {
      return
    }

    const teacher = window.prompt('Vyučující', subject.teacher)?.trim()
    if (!teacher) {
      return
    }

    const code = window.prompt('Kód předmětu', subject.code)?.trim().toUpperCase()
    if (!code) {
      return
    }

    void apiFetch(`/api/subjects/${subjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, teacher, code }),
    }).then(() => {
      void refreshSubjects()
    })
  }

  const toggleSubjectArchived = (subjectId: number) => {
    if (!ensureAuthenticated()) {
      return
    }

    const subject = subjects.find((item) => item.id === subjectId)
    if (!subject) {
      return
    }

    void apiFetch(`/api/subjects/${subjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ archived: !subject.archived }),
    }).then(() => {
      void refreshSubjects()
    })
  }

  const deleteSubject = (subjectId: number) => {
    if (!ensureAuthenticated()) {
      return
    }

    const subject = subjects.find((item) => item.id === subjectId)
    if (!subject) {
      return
    }

    if (!window.confirm(`Opravdu smazat předmět "${subject.name}"?`)) {
      return
    }

    void apiFetch(`/api/subjects/${subjectId}`, { method: 'DELETE' }).then(() => {
      void refreshSubjects()
    })
  }

  const updateFile = (fileId: number, patch: Partial<ManagedFile>) => {
    if (!ensureAuthenticated()) {
      return
    }

    void apiFetch(`/api/files/${fileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    }).then(() => {
      void refreshFiles()
    })
  }

  const removeFile = (fileId: number) => {
    if (!ensureAuthenticated()) {
      return
    }

    const file = managedFiles.find((item) => item.id === fileId)
    if (!file) {
      return
    }

    if (!window.confirm(`Opravdu smazat soubor \"${file.name}\"?`)) {
      return
    }

    void apiFetch(`/api/files/${fileId}`, { method: 'DELETE' }).then(() => {
      void refreshFiles()
    })
  }

  const renameFile = (fileId: number) => {
    const file = managedFiles.find((item) => item.id === fileId)
    if (!file) {
      return
    }

    const nextName = window.prompt('Nový název souboru', file.name)?.trim()
    if (!nextName || nextName === file.name) {
      return
    }

    updateFile(fileId, { name: nextName })
  }

  const toggleFileShared = (fileId: number) => {
    const file = managedFiles.find((item) => item.id === fileId)
    if (!file) {
      return
    }

    updateFile(fileId, { shared: !file.shared })
  }

  const manageFile = (fileId: number) => {
    const file = managedFiles.find((item) => item.id === fileId)
    if (!file) {
      return
    }

    const action = window
      .prompt(
        `Správa souboru: ${file.name}\nZadej akci: rename | share | delete`,
        'rename',
      )
      ?.trim()
      .toLowerCase()

    if (action === 'rename') {
      renameFile(fileId)
      return
    }

    if (action === 'share') {
      toggleFileShared(fileId)
      return
    }

    if (action === 'delete') {
      removeFile(fileId)
    }
  }

  const tasksDone = tasks.filter((task) => task.done).length
  const isCalendarScreen = activeMobileNav === 'calendar'
  const isFilesScreen = activeMobileNav === 'files'
  const isTasksScreen = activeMobileNav === 'tasks'
  const isStudyPlanScreen = activeMobileNav === 'study-plan'
  const isProfileScreen = activeMobileNav === 'profile'

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
    () => (eventsByDate[selectedDateIso] ?? []).slice().sort((a, b) => a.title.localeCompare(b.title)),
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
      subjects.filter((subject) => {
        const matchesSearch = subject.name
          .toLowerCase()
          .includes(subjectSearch.trim().toLowerCase())

        if (!matchesSearch) {
          return false
        }

        if (subjectFilter === 'active') {
          return !subject.archived
        }

        if (subjectFilter === 'archived') {
          return Boolean(subject.archived)
        }

        return true
      }),
    [subjects, subjectSearch, subjectFilter],
  )

  const desktopSubjects = React.useMemo(
    () =>
      filteredSubjects.map((subject, index) => {
        const meta = desktopSubjectMetaByCode[subject.code] ?? {
          icon: '📘',
          tone: 'amber',
        }

        return {
          ...subject,
          meta,
          deadlineCount: Math.max(0, (subject.events ?? 3) - index),
        }
      }),
    [filteredSubjects],
  )

  return {
    tasks,
    themeMode,
    setThemeMode,
    accentPalette,
    setAccentPalette,
    activeMobileNav,
    setActiveMobileNav,
    displayMonth,
    setDisplayMonth,
    selectedDateIso,
    setSelectedDateIso,
    eventMetaById,
    fileTab,
    setFileTab,
    fileTypeFilter,
    setFileTypeFilter,
    managedFiles,
    subjects,
    subjectSearch,
    setSubjectSearch,
    subjectFilter,
    setSubjectFilter,
    isDragActive,
    setIsDragActive,
    profile,
    authSession,
    tasksDone,
    isCalendarScreen,
    isFilesScreen,
    isTasksScreen,
    isStudyPlanScreen,
    isProfileScreen,
    monthLabel,
    upcomingEvents,
    eventsByDate,
    calendarCells,
    selectedDayEvents,
    displayedRecentFiles,
    filteredSubjects,
    desktopSubjects,
    toggleTask,
    removeEvent,
    addDesktopEvent,
    onUploadFiles,
    onDropToUpload,
    goToToday,
    onOpenProfile,
    onChangeProfile,
    onUploadProfileAvatar,
    onRemoveProfileAvatar,
    resetProfile,
    login,
    register,
    logout,
    setAuthSession,
    createSubject,
    updateSubject,
    toggleSubjectArchived,
    deleteSubject,
    manageFile,
    removeFile,
    toggleFileShared,
  }
}
