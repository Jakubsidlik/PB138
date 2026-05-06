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
  Lesson,
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
  const [lessons, setLessons] = React.useState<Lesson[]>([])
  const [accentPalette, setAccentPalette] = React.useState<AccentPalette>(() => readPaletteFromStorage())
  const [activeMobileNav, setActiveMobileNav] = React.useState<MobileNavItem>('home')
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
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth()

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
        cache: 'no-store',
        ...init,
        headers,
      })
    },
    [getToken],
  )

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
    setIsHydrated(false)
  }, [authSession])

  React.useEffect(() => {
    if (!isLoaded || isHydrated) return

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
      let loadedLessons: Lesson[] = []
      let loadedProfile = localProfile

      try {
        const [
          tasksRes,
          eventsRes,
          subjectsRes,
          filesRes,
          lessonsRes,
          profileRes
        ] = await Promise.allSettled([
          apiFetch('/api/tasks'),
          apiFetch('/api/events'),
          apiFetch('/api/subjects'),
          apiFetch('/api/files'),
          apiFetch('/api/lessons'),
          apiFetch('/api/profile')
        ])

        if (tasksRes.status === 'fulfilled' && tasksRes.value.ok) {
          const serverTasks = await tasksRes.value.json()
          if (Array.isArray(serverTasks)) loadedTasks = serverTasks as Task[]
        }
        if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
          const serverEvents = await eventsRes.value.json()
          if (Array.isArray(serverEvents)) loadedEvents = serverEvents as CalendarEvent[]
        }
        if (subjectsRes.status === 'fulfilled' && subjectsRes.value.ok) {
          const serverSubjects = await subjectsRes.value.json()
          if (Array.isArray(serverSubjects)) loadedSubjects = serverSubjects as typeof subjectsSeed
        }
        if (filesRes.status === 'fulfilled' && filesRes.value.ok) {
          const serverFiles = await filesRes.value.json()
          if (Array.isArray(serverFiles)) loadedFiles = serverFiles as ManagedFile[]
        }
        if (lessonsRes.status === 'fulfilled' && lessonsRes.value.ok) {
          const serverLessons = await lessonsRes.value.json()
          if (Array.isArray(serverLessons)) loadedLessons = serverLessons as Lesson[]
        }
        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const serverProfile = await profileRes.value.json()
          if (typeof serverProfile === 'object' && serverProfile !== null) {
            loadedProfile = { ...userProfileSeed, ...(serverProfile as Partial<UserProfile>) }
          }
        }
      } catch (e) {
        console.error('Hydration error:', e)
      }

      const nextMetaById = loadedEvents.reduce<Record<number, EventMeta>>((acc, event) => {
        acc[event.id] = toEventMeta(event, event.title)
        return acc
      }, {})

      setTasks(loadedTasks)
      setEvents(loadedEvents)
      setSubjects(loadedSubjects)
      setManagedFiles(loadedFiles)
      setLessons(loadedLessons)
      setProfile(loadedProfile)
      setSavedProfile(loadedProfile)
      setEventMetaById(nextMetaById)
      setIsHydrated(true)
    }

    void hydrateData()
  }, [apiFetch, authSession, isLoaded, isSignedIn, isHydrated])

  // Save tasks/events to localStorage whenever they change (for offline fallback)
  React.useEffect(() => {
    if (!isHydrated || !authSession) return
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks, isHydrated, authSession])

  React.useEffect(() => {
    if (!isHydrated || !authSession) return
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
  }, [events, isHydrated, authSession])

  React.useEffect(() => {
    if (!isHydrated || !authSession) {
      return
    }

    // Inicializuj fullName z authSession pokud je prázdný
    if (!profile.fullName && authSession.fullName) {
      setProfile((prevProfile) => ({
        ...prevProfile,
        fullName: authSession.fullName,
      }))
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

  const refreshLessons = async () => {
    const response = await apiFetch('/api/lessons')
    if (!response.ok) {
      return
    }
    const payload: unknown = await response.json()
    if (Array.isArray(payload)) {
      setLessons(payload as Lesson[])
    }
  }

  const toggleTask = async (taskId: number) => {
    if (!ensureAuthenticated()) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const newDone = !task.done
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: newDone } : t)))

    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: newDone }),
      })
    } catch (e) {
      console.error('Failed to toggle task:', e)
      // Revert on failure
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: !newDone } : t)))
    }
  }

  const addTask = () => {
    if (!ensureAuthenticated()) return

    const title = window.prompt('Název nového úkolu')?.trim()
    if (!title) return

    // Show task immediately in UI
    const tempId = Date.now()
    const tempTask: Task = { id: tempId, title, done: false }
    console.log('[addTask] Adding temp task:', tempTask, 'current tasks count:', tasks.length)
    setTasks((prev) => {
      console.log('[addTask] setTasks called, prev count:', prev.length, 'new count:', prev.length + 1)
      return [...prev, tempTask]
    })

    // Persist to server in background (don't block render)
    apiFetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, done: false }),
    }).then((res) => {
      console.log('[addTask] Server response status:', res.status)
      if (res.ok) {
        return res.json().then((serverTask: Task) => {
          console.log('[addTask] Server task:', serverTask)
          setTasks((prev) => prev.map((t) => (t.id === tempId ? serverTask : t)))
        })
      }
      console.error('Failed to create task, status:', res.status)
    }).catch((e) => {
      console.error('Failed to create task:', e)
    })
  }

  const deleteTask = async (taskId: number) => {
    if (!ensureAuthenticated()) return

    const prev = tasks
    setTasks((p) => p.filter((t) => t.id !== taskId))

    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    } catch (e) {
      console.error('Failed to delete task:', e)
      setTasks(prev) // Revert on failure
    }
  }

  const removeEvent = async (eventId: number) => {
    if (!ensureAuthenticated()) return

    const prev = events
    setEvents((p) => p.filter((e) => e.id !== eventId))
    setEventMetaById((prevMeta) => {
      const updatedMeta = { ...prevMeta }
      delete updatedMeta[eventId]
      return updatedMeta
    })

    try {
      await apiFetch(`/api/events/${eventId}`, { method: 'DELETE' })
    } catch (e) {
      console.error('Failed to delete event:', e)
      setEvents(prev) // Revert on failure
    }
  }

  const addDesktopEvent = () => {
    if (!ensureAuthenticated()) return

    const title = window.prompt('Název události')?.trim()
    if (!title) return

    const time = window.prompt('Čas (např. 09:00 - 10:30)')
    const location = window.prompt('Místo')
    
    let priority: 'low' | 'medium' | 'high' = 'medium'
    const priorityInput = window.prompt('Priorita (nízká/střední/vysoká)')?.toLowerCase().trim()
    if (priorityInput === 'nízká' || priorityInput === 'low') {
      priority = 'low'
    } else if (priorityInput === 'střední' || priorityInput === 'medium') {
      priority = 'medium'
    } else if (priorityInput === 'vysoká' || priorityInput === 'high') {
      priority = 'high'
    }

    const tempId = Date.now()
    const defaultMeta = getDefaultMetaForTitle(title)
    const nextEvent: CalendarEvent = {
      id: tempId,
      title,
      date: selectedDateIso,
      time: time?.trim() || defaultMeta.time,
      location: location?.trim() || defaultMeta.location,
      subjectId: null,
      priority,
    }

    // Show event immediately in UI
    setEvents((prevEvents) => [...prevEvents, nextEvent])
    setEventMetaById((prevMeta) => ({
      ...prevMeta,
      [tempId]: {
        ...defaultMeta,
        time: time?.trim() || defaultMeta.time,
        location: location?.trim() || defaultMeta.location,
      },
    }))

    // Persist to server in background (don't block render)
    apiFetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        date: selectedDateIso,
        time: time?.trim() || null,
        location: location?.trim() || null,
      }),
    }).then((res) => {
      if (res.ok) {
        return res.json().then((body: any) => {
          const serverEvent: CalendarEvent = body.event ?? body
          setEvents((prev) => prev.map((e) => (e.id === tempId ? { ...serverEvent, priority } : e)))
          setEventMetaById((prevMeta) => {
            const updated = { ...prevMeta }
            const meta = updated[tempId]
            delete updated[tempId]
            if (meta) updated[serverEvent.id] = meta
            return updated
          })
        })
      }
      console.error('Failed to create event, status:', res.status)
    }).catch((e) => {
      console.error('Failed to create event:', e)
    })
  }

  const onUploadFiles = async (incomingFiles: FileList | File[] | null, options?: { subjectId?: number; lessonId?: number }) => {
    if (!ensureAuthenticated()) {
      return
    }

    if (!incomingFiles || incomingFiles.length === 0) {
      return
    }

    const filesArray = incomingFiles instanceof FileList ? Array.from(incomingFiles) : incomingFiles

    const tempFiles = filesArray.map((file) => ({
      id: Date.now() + Math.floor(Math.random() * 100000),
      name: file.name,
      size: formatFileSize(file.size),
      sizeBytes: file.size,
      addedLabel: 'Nahrávám na S3...',
      category: getManagedFileCategory(file.name),
      shared: false,
      subjectId: options?.subjectId ?? null,
      lessonId: options?.lessonId ?? null,
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
            subjectId: options?.subjectId,
            lessonId: options?.lessonId,
          }),
        })
      } catch (err) {
        console.error(`Chyba při nahrávání souboru ${file.name}:`, err)
      }
    }

    void refreshFiles()
  }

  const addSubjectNote = async (subjectId: number, note: string) => {
    if (!ensureAuthenticated()) {
      return
    }

    const title = note.length > 50 ? note.slice(0, 50) + '...' : note
    
    await apiFetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId, title, content: note }),
    })

    await refreshLessons()
    await refreshSubjects()
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
  }

  const onChangeProfile = (updates: Partial<UserProfile>) => {
    if (!ensureAuthenticated()) {
      return
    }

    setProfile((prevProfile) => ({
      ...prevProfile,
      ...updates,
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

  const logout = async () => {
    setAuthSession(null)
    setIsHydrated(false)
    setTasks([])
    setEvents([])
    setSubjects([])
    setManagedFiles([])
    setLessons([])
    setProfile(userProfileSeed)
    localStorage.removeItem(TASKS_STORAGE_KEY)
    localStorage.removeItem(EVENTS_STORAGE_KEY)
    localStorage.removeItem(PROFILE_STORAGE_KEY)
    await signOut()
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

  const toggleFileShared = async (fileId: number, email?: string) => {
    const file = managedFiles.find((item) => item.id === fileId)
    if (!file) {
      return
    }

    if (email) {
      try {
        const res = await apiFetch(`/api/files/${fileId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserEmail: email, permission: 'read' }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Nepodařilo se nasdílet soubor.')
        }
        alert(`Soubor úspěšně nasdílen uživateli ${email}`)
      } catch (err: any) {
        alert(err.message)
        throw err
      }
    } else {
      updateFile(fileId, { shared: !file.shared })
    }
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

  const monthLabel = new Intl.DateTimeFormat('cs-CZ', {
    month: 'long',
    year: 'numeric',
  }).format(displayMonth)

  const upcomingEvents = React.useMemo(
    () => {
      const today = formatDateIso(new Date())
      return events
        .filter((event) => event.date >= today)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
    },
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
    lessons,
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
    addTask,
    deleteTask,
    removeEvent,
    addDesktopEvent,
    addSubjectNote,
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
