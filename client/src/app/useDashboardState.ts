import { Subject } from "./types"
import React from 'react'
import { toast } from 'sonner'
import {
  desktopSubjectMetaByCode,
  EVENTS_STORAGE_KEY,
  PALETTE_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
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
  StudyPlan,
  Task,
  Tag,
  TaskPriority,
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
      (session.role !== 'REGISTROVANÝ UŽIVATEL' && session.role !== 'ADMIN') ||
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

export function useDashboardState(fetchAll = false) {
  const [tasks, setTasks] = React.useState<Task[]>(() => readTasksFromStorage() ?? [])
  const [events, setEvents] = React.useState<CalendarEvent[]>(() => readEventsFromStorage() ?? [])
  const [subjects, setSubjects] = React.useState<Subject[]>([])
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
  const [studyPlans, setStudyPlans] = React.useState<StudyPlan[]>([])
  const [activeStudyPlanId, setActiveStudyPlanId] = React.useState<number | null>(null)
  const [subjectSearch, setSubjectSearch] = React.useState('')
  const [subjectFilter, setSubjectFilter] = React.useState<SubjectFilter>('all')
  const [tagFilter, setTagFilter] = React.useState<number | null>(null)
  const [isDragActive, setIsDragActive] = React.useState(false)
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [tags, setTags] = React.useState<Tag[]>([])
  const [profile, setProfile] = React.useState<UserProfile>(userProfileSeed)
  const [savedProfile, setSavedProfile] = React.useState<UserProfile>(userProfileSeed)
  const [authSession, setAuthSession] = React.useState<AuthSession | null>(null)
  const [authAlertOpen, setAuthAlertOpen] = React.useState(false)
  const [isBanned, setIsBanned] = React.useState(false)
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
        console.warn('apiFetch: Přístupový token nenalezen, přesto odesílám požadavek.');
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
    if (themeMode === 'dark') {
      document.documentElement.classList.add('theme-dark', 'dark')
      document.body.style.backgroundColor = '#161e2f'
    } else {
      document.documentElement.classList.remove('theme-dark', 'dark')
      document.body.style.backgroundColor = '#fffdf6'
    }
    
    // Force update the root element so we don't have to refresh the page
    const rootEl = document.querySelector('.dashboard-root')
    if (rootEl) {
      rootEl.classList.remove('theme-light', 'theme-dark')
      rootEl.classList.add(`theme-${themeMode}`)
    }
  }, [themeMode])

  React.useEffect(() => {
    localStorage.setItem(PALETTE_STORAGE_KEY, accentPalette)
    
    // Force update the root element so we don't have to refresh the page
    const rootEl = document.querySelector('.dashboard-root')
    if (rootEl) {
      rootEl.classList.forEach((cls) => {
        if (cls.startsWith('palette-')) {
          rootEl.classList.remove(cls)
        }
      })
      rootEl.classList.add(`palette-${accentPalette}`)
    }
    
    // Also apply to body so that portals (modals, popovers) inherit the variables
    document.body.classList.forEach((cls) => {
      if (cls.startsWith('palette-')) {
        document.body.classList.remove(cls)
      }
    })
    document.body.classList.add(`palette-${accentPalette}`)
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
    if (!isLoaded || isHydrated || !fetchAll) return

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
      let loadedSubjects: Subject[] = []
      let loadedFiles: ManagedFile[] = []
      let loadedLessons: Lesson[] = []
      let loadedStudyPlans: StudyPlan[] = []
      let loadedProfile = localProfile

      try {
        const [
          tasksRes,
          eventsRes,
          subjectsRes,
          filesRes,
          lessonsRes,
          studyPlansRes,
          profileRes,
          tagsRes
        ] = await Promise.allSettled([
          apiFetch('/api/tasks'),
          apiFetch('/api/events'),
          apiFetch('/api/subjects'),
          apiFetch('/api/files'),
          apiFetch('/api/lessons'),
          apiFetch('/api/study-plans?includeInactive=true'),
          apiFetch('/api/profile'),
          apiFetch('/api/tags')
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
          if (Array.isArray(serverSubjects)) loadedSubjects = serverSubjects as Subject[]
        }
        if (studyPlansRes.status === 'fulfilled' && studyPlansRes.value.ok) {
          const serverStudyPlans = await studyPlansRes.value.json()
          if (Array.isArray(serverStudyPlans)) loadedStudyPlans = serverStudyPlans as StudyPlan[]
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
          setAuthSession({
            userId: serverProfile.id,
            fullName: serverProfile.fullName,
            email: serverProfile.email,
            role: serverProfile.role
          })
          loadedProfile = serverProfile
        } else if (profileRes.status === 'fulfilled' && profileRes.value.status === 401) {
            setAuthSession(null)
            if (isSignedIn) {
              setIsBanned(true)
              localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
              localStorage.removeItem(PROFILE_STORAGE_KEY)
              localStorage.removeItem(TASKS_STORAGE_KEY)
            }
        }
        if (tagsRes.status === 'fulfilled' && tagsRes.value.ok) {
          const serverTags = await tagsRes.value.json()
          if (Array.isArray(serverTags)) setTags(serverTags)
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
      setStudyPlans(loadedStudyPlans)
      setProfile(loadedProfile)
      setSavedProfile(loadedProfile)
      setEventMetaById(nextMetaById)
      setIsHydrated(true)
    }

    void hydrateData()
  }, [apiFetch, authSession, isLoaded, isSignedIn, isHydrated, signOut])

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

    // Inicializuj fullName a email z authSession pokud jsou prázdné
    if (authSession && (!profile.fullName || !profile.email)) {
      setProfile((prevProfile) => ({
        ...prevProfile,
        fullName: prevProfile.fullName || authSession.fullName || '',
        email: prevProfile.email || authSession.email || '',
      }))
      return
    }

    const { avatarDataUrl: _, ...profileWithoutAvatar } = profile
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileWithoutAvatar))
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
    if (!authSession) {
      setAuthAlertOpen(true)
      return false
    }
    return true
  }

  const refreshSubjects = async () => {
    const response = await apiFetch('/api/subjects')
    if (!response.ok) {
      return
    }

    const payload: unknown = await response.json()
    if (Array.isArray(payload)) {
      setSubjects(payload as Subject[])
    }
  }

  const refreshStudyPlans = async () => {
    const response = await apiFetch('/api/study-plans?includeInactive=true')
    if (!response.ok) {
      return
    }

    const payload: unknown = await response.json()
    if (Array.isArray(payload)) {
      setStudyPlans(payload as StudyPlan[])
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

    const payload = await response.json()
    if (Array.isArray(payload)) {
      setLessons(payload)
    }
  }

  const refreshTags = async () => {
    const response = await apiFetch('/api/tags')
    if (!response.ok) return
    const payload = await response.json()
    if (Array.isArray(payload)) {
      setTags(payload)
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

  const addTask = (title: string, priority: TaskPriority = 'NONE') => {
    if (!ensureAuthenticated()) return

    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    // Show task immediately in UI
    const tempId = Date.now()
    const tempTask: Task = { id: tempId, title: trimmedTitle, done: false, priority }
    setTasks((prev) => [...prev, tempTask])

    // Persist to server in background (don't block render)
    apiFetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, done: false, priority }),
    }).then((res) => {
      if (res.ok) {
        return res.json().then((serverTask: Task) => {
          setTasks((prev) => prev.map((t) => (t.id === tempId ? serverTask : t)))
        })
      }
      console.error('Failed to create task, status:', res.status)
      setTasks((prev) => prev.filter((t) => t.id !== tempId))
    }).catch((e) => {
      console.error('Failed to create task:', e)
      setTasks((prev) => prev.filter((t) => t.id !== tempId))
    })
  }

  const updateTask = async (taskId: number, title: string, priority?: TaskPriority) => {
    if (!ensureAuthenticated()) return

    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, title: trimmedTitle, ...(priority !== undefined && { priority }) } : t)))

    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle, ...(priority !== undefined && { priority }) }),
      })
    } catch (e) {
      console.error('Failed to update task:', e)
    }
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

  const addDesktopEvent = (eventData: { title: string, time: string, location: string, priority: 'low' | 'medium' | 'high' }) => {
    if (!ensureAuthenticated()) return

    const title = eventData.title.trim()
    if (!title) return

    const { time, location, priority } = eventData

    const tempId = Date.now()
    const defaultMeta = getDefaultMetaForTitle(title)
    const nextEvent: CalendarEvent = {
      id: tempId,
      title,
      date: selectedDateIso,
      time: time?.trim() || defaultMeta.time,
      location: location?.trim() || '',
      priority,
    }

    // Show event immediately in UI
    setEvents((prevEvents) => [...prevEvents, nextEvent])
    setEventMetaById((prevMeta) => ({
      ...prevMeta,
      [tempId]: {
        ...defaultMeta,
        time: time?.trim() || defaultMeta.time,
        location: location?.trim() || '',
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
      setEvents((prev) => prev.filter((e) => e.id !== tempId))
      setEventMetaById((prevMeta) => {
        const updated = { ...prevMeta }
        delete updated[tempId]
        return updated
      })
    }).catch((e) => {
      console.error('Failed to create event:', e)
      setEvents((prev) => prev.filter((e) => e.id !== tempId))
      setEventMetaById((prevMeta) => {
        const updated = { ...prevMeta }
        delete updated[tempId]
        return updated
      })
    })
  }

  const onUploadFiles = async (incomingFiles: FileList | File[] | null, options?: { subjectId?: number }) => {
    if (!ensureAuthenticated()) {
      return
    }

    if (!incomingFiles || incomingFiles.length === 0) {
      return
    }

    const filesArray = incomingFiles instanceof FileList ? Array.from(incomingFiles) : incomingFiles

    const now = new Date()
    const formattedTime = now.toLocaleDateString('cs-CZ') + ' ' + now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })

    const tempFiles = filesArray.map((file) => ({
      id: Date.now() + Math.floor(Math.random() * 100000),
      name: file.name,
      size: formatFileSize(file.size),
      sizeBytes: file.size,
      addedLabel: formattedTime,
      category: getManagedFileCategory(file.name),
      shared: false,
      subjectId: options?.subjectId ?? null,
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
            addedLabel: formattedTime,
            shared: false,
            fileKey,
            fileUrl,
            subjectId: options?.subjectId,
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
    
    try {
      const res = await apiFetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, title, content: note }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        toast.error(errorData?.error || 'Nepodařilo se přidat poznámku.')
        console.error('Failed to add note:', errorData)
        return
      }

      await refreshLessons()
      await refreshSubjects()
    } catch (e) {
      toast.error('Došlo k chybě při přidávání poznámky.')
      console.error('Failed to add note:', e)
    }
  }

  const rateLesson = async (lessonId: number, vote: 'LIKE' | 'DISLIKE' | null) => {
    if (!ensureAuthenticated()) return

    const prevLessons = lessons
    // Optimistic UI update
    setLessons((prev) => prev.map(l => {
      if (l.id === lessonId) {
        let likes = Number(l.likes ?? 0)
        let dislikes = Number(l.dislikes ?? 0)
        const oldVote = l.userVote
        
        if (oldVote === 'LIKE') likes--
        if (oldVote === 'DISLIKE') dislikes--
        if (vote === 'LIKE') likes++
        if (vote === 'DISLIKE') dislikes++
        
        return { ...l, userVote: vote, likes: Math.max(0, likes), dislikes: Math.max(0, dislikes) }
      }
      return l
    }))

    try {
      const res = await apiFetch(`/api/lessons/${lessonId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote }),
      })
      if (!res.ok) throw new Error('Nepodařilo se uložit hodnocení.')
    } catch (e) {
      toast.error('Došlo k chybě při ukládání hodnocení.')
      console.error('Failed to rate lesson:', e)
      setLessons(prevLessons) // Revert on failure
    }
  }

  const rateFile = async (fileId: number, vote: 'LIKE' | 'DISLIKE' | null) => {
    if (!ensureAuthenticated()) return

    const prevFiles = managedFiles
    // Optimistic UI update
    setManagedFiles((prev) => prev.map(f => {
      if (f.id === fileId) {
        let likes = Number(f.likes ?? 0)
        let dislikes = Number(f.dislikes ?? 0)
        const oldVote = f.userVote
        
        if (oldVote === 'LIKE') likes--
        if (oldVote === 'DISLIKE') dislikes--
        if (vote === 'LIKE') likes++
        if (vote === 'DISLIKE') dislikes++
        
        return { ...f, userVote: vote, likes: Math.max(0, likes), dislikes: Math.max(0, dislikes) }
      }
      return f
    }))

    try {
      const res = await apiFetch(`/api/files/${fileId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote }),
      })
      if (!res.ok) throw new Error('Nepodařilo se uložit hodnocení.')
    } catch (e) {
      toast.error('Došlo k chybě při ukládání hodnocení.')
      console.error('Failed to rate file:', e)
      setManagedFiles(prevFiles) // Revert on failure
    }
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

  const clearUserData = () => {
    setIsHydrated(false)
    setTasks([])
    setEvents([])
    setSubjects([])
    setManagedFiles([])
    setLessons([])
    setStudyPlans([])
    setTags([])
    setProfile(userProfileSeed)
    setSavedProfile(userProfileSeed)
    localStorage.removeItem(TASKS_STORAGE_KEY)
    localStorage.removeItem(EVENTS_STORAGE_KEY)
    localStorage.removeItem(PROFILE_STORAGE_KEY)
  }

  const logout = async () => {
    clearUserData()
    setAuthSession(null)
    await signOut()
  }

  // --- TAGS ---
  const createTag = async (data: { name: string, color: string }) => {
    if (!ensureAuthenticated()) return
    const res = await apiFetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (res.ok) void refreshTags()
    return res
  }

  const deleteTag = async (id: number) => {
    if (!ensureAuthenticated()) return
    const res = await apiFetch(`/api/tags/${id}`, { method: 'DELETE' })
    if (res.ok) void refreshTags()
    return res
  }

  const createSubject = (subjectData: { name: string, teacher: string, code: string, tagIds?: number[] }) => {
    if (!ensureAuthenticated()) return

    const name = subjectData.name.trim()
    const teacher = subjectData.teacher.trim()
    const code = subjectData.code.trim().toUpperCase()

    if (!name || !teacher || !code) return

    void apiFetch('/api/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, teacher, code, studyPlanId: activeStudyPlanId === -1 ? null : activeStudyPlanId, tagIds: subjectData.tagIds || [] }),
    }).then(() => {
      void refreshSubjects()
    })
  }

  const createStudyPlan = (studyPlanData: { name: string, description?: string }) => {
    if (!ensureAuthenticated()) return

    const name = studyPlanData.name.trim()
    if (!name) return

    void apiFetch('/api/study-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description: studyPlanData.description }),
    }).then(() => {
      void refreshStudyPlans()
    })
  }

  const updateStudyPlan = (studyPlanId: number, data: { name: string, description?: string }) => {
    if (!ensureAuthenticated()) return
    void apiFetch(`/api/study-plans/${studyPlanId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(() => {
      void refreshStudyPlans()
    })
  }

  const toggleStudyPlanArchived = (studyPlanId: number) => {
    if (!ensureAuthenticated()) return
    const plan = studyPlans.find((item) => item.id === studyPlanId)
    if (!plan) return
    void apiFetch(`/api/study-plans/${studyPlanId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !plan.isActive }),
    }).then(() => {
      void refreshStudyPlans()
    })
  }

  const deleteStudyPlan = (studyPlanId: number) => {
    if (!ensureAuthenticated()) return
    void apiFetch(`/api/study-plans/${studyPlanId}`, {
      method: 'DELETE',
    }).then(() => {
      void refreshStudyPlans()
    })
  }

  const shareStudyPlan = async (studyPlanId: number, email: string) => {
    if (!ensureAuthenticated()) return

    const res = await apiFetch(`/api/study-plans/${studyPlanId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: 'VIEWER' }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.error || 'Nepodařilo se nasdílet studijní plán.')
    }
    toast.success(`Studijní plán byl úspěšně nasdílen uživateli ${email}`)
  }

  const shareSubject = async (subjectId: number, email: string) => {
    if (!ensureAuthenticated()) return

    const res = await apiFetch(`/api/subjects/${subjectId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.error || 'Nepodařilo se nasdílet předmět.')
    }
    const result = await res.json()
    toast.success(`Předmět byl úspěšně nasdílen uživateli ${result.recipientEmail}`)
  }

  const updateSubject = (subjectId: number, data: { name: string, teacher: string, code: string, tagIds?: number[], studyPlanId?: number | null }) => {
    if (!ensureAuthenticated()) return

    const subject = subjects.find((item) => item.id === subjectId)
    if (!subject) return

    const name = data.name.trim()
    const teacher = data.teacher.trim()
    const code = data.code.trim().toUpperCase()

    if (!name || !teacher || !code) return

    void apiFetch(`/api/subjects/${subjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, teacher, code, tagIds: data.tagIds, studyPlanId: 'studyPlanId' in data ? data.studyPlanId : undefined }),
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

    void apiFetch(`/api/subjects/${subjectId}`, { method: 'DELETE' }).then(() => {
      void refreshSubjects()
    })
  }

  const updateFile = (fileId: number, patch: Partial<ManagedFile>) => {
    if (!ensureAuthenticated()) {
      return
    }

    setManagedFiles(prev => prev.map(f => f.id === fileId ? { ...f, ...patch } : f))

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

    setManagedFiles(prev => prev.filter(f => f.id !== fileId))

    void apiFetch(`/api/files/${fileId}`, { method: 'DELETE' }).then(() => {
      void refreshFiles()
    })
  }

  const renameFile = (fileId: number, newName: string) => {
    const file = managedFiles.find((item) => item.id === fileId)
    if (!file) return

    const nextName = newName.trim()
    if (!nextName || nextName === file.name) return

    updateFile(fileId, { name: nextName })
  }

  const changeFileSubject = (fileId: number, subjectId: number | null) => {
    updateFile(fileId, { subjectId })
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
        toast.success(`Soubor úspěšně nasdílen uživateli ${email}`)
      } catch (err: any) {
        toast.error(err.message)
        throw err
      }
    } else {
      updateFile(fileId, { shared: !file.shared })
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

        const matchesStudyPlan = activeStudyPlanId
          ? activeStudyPlanId === -1
            ? subject.studyPlanId === null || subject.studyPlanId === undefined
            : subject.studyPlanId === activeStudyPlanId
          : true
        if (!matchesStudyPlan) {
          return false
        }

        if (tagFilter !== null) {
          if (!subject.tags?.some((t: any) => t.id === tagFilter)) {
            return false
          }
        }

        if (subjectFilter === 'active') {
          return !subject.archived
        }

        if (subjectFilter === 'archived') {
          return Boolean(subject.archived)
        }

        return true
      }),
    [subjects, subjectSearch, subjectFilter, activeStudyPlanId, tagFilter],
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
    tagFilter,
    setTagFilter,
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
    updateTask,
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
    clearUserData,
    setAuthSession,
    createSubject,
    updateSubject,
    toggleSubjectArchived,
    deleteSubject,
    renameFile,
    removeFile,
    toggleFileShared,
    authAlertOpen,
    setAuthAlertOpen,
    isBanned,
    setIsBanned,
    changeFileSubject,
    studyPlans,
    activeStudyPlanId,
    setActiveStudyPlanId,
    createStudyPlan,
    updateStudyPlan,
    toggleStudyPlanArchived,
    deleteStudyPlan,
    shareStudyPlan,
    shareSubject,
    tags,
    createTag,
    deleteTag,
    rateLesson,
    rateFile,
  }
}
