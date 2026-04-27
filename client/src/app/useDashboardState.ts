import React from 'react'
import {
  desktopSubjectMetaByCode,
  EVENTS_STORAGE_KEY,
  PALETTE_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  subjectsSeed,
  TASKS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  userProfileSeed,
} from './data'
import { useAuth } from '@clerk/clerk-react'
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
      (typeof session.userId !== 'number' && typeof session.userId !== 'string') ||
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
    icon: fallback.icon,
    accent: fallback.accent,
  }
}

export function useDashboardState() {
  const [tasks, setTasks] = React.useState<Task[]>(() => readTasksFromStorage() ?? [])
  const [events, setEvents] = React.useState<CalendarEvent[]>(() => readEventsFromStorage() ?? [])
  const [subjects, setSubjects] = React.useState<typeof subjectsSeed>([])
  const [themeMode, setThemeMode] = React.useState<ThemeMode>(() => readThemeFromStorage())
  const [accentPalette, setAccentPalette] = React.useState<AccentPalette>(() => readPaletteFromStorage())
  const [activeMobileNav, setActiveMobileNav] = React.useState<MobileNavItem>(() =>
    getNavFromHash(window.location.hash),
  )
  const [displayMonth, setDisplayMonth] = React.useState(() => new Date())
  const [selectedDateIso, setSelectedDateIso] = React.useState(() => formatDateIso(new Date()))
  const [eventMetaById, setEventMetaById] = React.useState<Record<number, EventMeta>>({})
  const [fileTab, setFileTab] = React.useState<FileTab>('all')
  const [fileTypeFilter, setFileTypeFilter] = React.useState<'all' | 'folder' | 'pdf' | 'image'>('all')
  const [managedFiles, setManagedFiles] = React.useState<ManagedFile[]>([])
  const [subjectSearch, setSubjectSearch] = React.useState('')
  const [subjectFilter, setSubjectFilter] = React.useState<SubjectFilter>('all')
  const [isDragActive, setIsDragActive] = React.useState(false)
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [profile, setProfile] = React.useState<UserProfile>(() =>
    readProfileFromStorage() ?? userProfileSeed,
  )
  const [savedProfile, setSavedProfile] = React.useState<UserProfile>(() =>
    readProfileFromStorage() ?? userProfileSeed,
  )
  const [authSession, setAuthSession] = React.useState<AuthSession | null>(() =>
    readAuthSessionFromStorage(),
  )
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)
  const { getToken, isLoaded, isSignedIn } = useAuth()

  const apiFetch = React.useCallback(
    async (input: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      
      let token = null
      try {
        token = await getToken()
      } catch {
        // Ignorujeme případné chyby získání tokenu
      }

      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      } else {
        // Zabráníme zbytečnému síťovému spamu a chybám 401 v konzoli
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          statusText: 'Unauthorized',
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return fetch(input, {
        ...init,
        headers,
      })
    },
    [getToken],
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
    if (!isLoaded) return

    const hydrateData = async () => {
      if (!authSession && !isSignedIn) {
        setIsHydrated(true)
        return
      }

    const localTasks = authSession ? (readTasksFromStorage() ?? []) : []
    const localEvents = authSession ? (readEventsFromStorage() ?? []) : []
      const localProfile = readProfileFromStorage() ?? userProfileSeed

      let loadedTasks = localTasks
      let loadedEvents = localEvents
    let loadedSubjects: typeof subjectsSeed = []
    let loadedFiles: ManagedFile[] = []
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
      setSavedProfile(loadedProfile)
      setEventMetaById(nextMetaById)
      setIsHydrated(true)
    }

    void hydrateData()
  }, [apiFetch, authSession, isLoaded, isSignedIn])

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
  }, [profile, isHydrated, authSession])

  const onSaveProfile = async () => {
    if (!ensureAuthenticated() || isSavingProfile) {
      return
    }

    setIsSavingProfile(true)
    try {
      const response = await apiFetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        setSavedProfile(profile)
      }
    } catch (error) {
      console.error('Chyba při ukládání profilu:', error)
    } finally {
      setIsSavingProfile(false)
    }
  }

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
  }

  const onUploadFiles = async (incomingFiles: FileList | null) => {
    if (!ensureAuthenticated()) {
      return
    }

    if (!incomingFiles || incomingFiles.length === 0) {
      return
    }

    const filesArray = Array.from(incomingFiles)

    const tempFiles = filesArray.map((file) => ({
      id: Date.now() + Math.floor(Math.random() * 100000),
      name: file.name,
      size: formatFileSize(file.size),
      sizeBytes: file.size,
      addedLabel: 'Nahrávám na S3...',
      category: getManagedFileCategory(file.name),
      shared: false,
    }))

    setManagedFiles((prevFiles) => [...tempFiles, ...prevFiles])

    for (const file of filesArray) {
      try {
        const urlRes = await apiFetch('/api/files/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type || 'application/octet-stream' }),
        })

        if (!urlRes.ok) {
          const errData = await urlRes.json().catch(() => null)
          throw new Error(errData?.error || `Chyba ze serveru: ${urlRes.status} ${urlRes.statusText}`)
        }
        const { uploadUrl, fileKey, fileUrl } = await urlRes.json()

        const s3Res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        })

        if (!s3Res.ok) throw new Error('Chyba při nahrávání na S3')

        await apiFetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            addedLabel: 'Přidáno právě teď',
            shared: false,
            fileKey,
            fileUrl,
          }),
        })
      } catch (err) {
        console.error(`Chyba při nahrávání souboru ${file.name}:`, err)
      }
    }

    void refreshFiles()
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
  const hasUnsavedProfileChanges = JSON.stringify(profile) !== JSON.stringify(savedProfile)

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
    () => (fileTab === 'recent' ? filteredManagedFiles.slice(0, 4) : filteredManagedFiles),
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
    onSaveProfile,
    hasUnsavedProfileChanges,
    isSavingProfile,
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
