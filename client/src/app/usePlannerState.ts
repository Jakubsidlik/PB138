import React from 'react'
import {
  plannerEventsSeed,
  plannerLessonsSeed,
  plannerScreens,
  plannerSubjectsSeed,
  plannerUsersSeed,
  roleCapabilities,
  roleLabels,
  ROLE_STORAGE_KEY,
} from './data'
import {
  AppScreen,
  Event as PlannerEvent,
  Lesson,
  PlannerCalendarItem,
  PlannerSubject,
  SubjectAccess,
  UserRole,
} from './types'

const readRoleFromStorage = (): UserRole => {
  const raw = window.localStorage.getItem(ROLE_STORAGE_KEY)
  if (raw === 'student' || raw === 'registered' || raw === 'public') {
    return raw
  }

  return 'student'
}

const cycleAccess = (access: SubjectAccess): SubjectAccess => {
  if (access === 'private') {
    return 'registered'
  }

  if (access === 'registered') {
    return 'public'
  }

  return 'private'
}

const makeLessonItem = (lesson: Lesson, subject: PlannerSubject | undefined): PlannerCalendarItem => {
  const start = new Date(lesson.startsAt)
  const end = new Date(lesson.endsAt)

  return {
    id: lesson.id,
    title: lesson.title,
    start,
    end,
    kind: 'lesson',
    subjectTitle: subject?.name ?? 'Obecné',
    subjectCode: subject?.code ?? 'GEN',
    shared: lesson.shared,
    location: lesson.room,
    description: lesson.notes,
    color: subject?.color ?? 'slate',
  }
}

const makeEventItem = (event: PlannerEvent, subject: PlannerSubject | undefined): PlannerCalendarItem => {
  const start = new Date(event.startsAt)
  const end = new Date(event.endsAt)

  return {
    id: event.id,
    title: event.title,
    start,
    end,
    kind: 'event',
    subjectTitle: subject?.name ?? 'Obecné',
    subjectCode: subject?.code ?? 'GEN',
    shared: event.shared,
    location: event.location,
    description: event.description,
    color:
      event.kind === 'deadline'
        ? 'rose'
        : event.kind === 'exam'
          ? 'amber'
          : event.kind === 'consultation'
            ? 'emerald'
            : 'indigo',
  }
}

const parseBooleanPrompt = (value: string | null, fallback: boolean) => {
  if (value === null) {
    return fallback
  }

  const normalized = value.trim().toLowerCase()
  if (['ano', 'yes', 'y', '1', 'true'].includes(normalized)) {
    return true
  }

  if (['ne', 'no', 'n', '0', 'false'].includes(normalized)) {
    return false
  }

  return fallback
}

const getNextId = (items: Array<{ id: number }>) =>
  items.reduce((nextId, item) => Math.max(nextId, item.id), 0) + 1

export function usePlannerState() {
  const [activeRole, setActiveRole] = React.useState<UserRole>(() => readRoleFromStorage())
  const [activeScreen, setActiveScreen] = React.useState<AppScreen>('overview')
  const users = plannerUsersSeed
  const [subjects, setSubjects] = React.useState<PlannerSubject[]>(plannerSubjectsSeed)
  const [lessons, setLessons] = React.useState<Lesson[]>(plannerLessonsSeed)
  const [events, setEvents] = React.useState<PlannerEvent[]>(plannerEventsSeed)
  const [savedSubjectIds, setSavedSubjectIds] = React.useState<number[]>([2, 3])
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<number | null>(plannerSubjectsSeed[0]?.id ?? null)
  const [selectedItemId, setSelectedItemId] = React.useState<number | null>(null)

  React.useEffect(() => {
    window.localStorage.setItem(ROLE_STORAGE_KEY, activeRole)
  }, [activeRole])

  const visibleSubjects = React.useMemo(() => {
    if (activeRole === 'student') {
      return subjects
    }

    if (activeRole === 'registered') {
      return subjects.filter((subject) => subject.access !== 'private')
    }

    return subjects.filter((subject) => subject.access === 'public')
  }, [activeRole, subjects])

  const visibleLessons = React.useMemo(() => {
    if (activeRole === 'student') {
      return lessons
    }

    if (activeRole === 'registered') {
      return lessons.filter((lesson) => {
        const subject = subjects.find((item) => item.id === lesson.subjectId)
        return lesson.shared || subject?.access === 'public' || subject?.access === 'registered'
      })
    }

    return lessons.filter((lesson) => {
      const subject = subjects.find((item) => item.id === lesson.subjectId)
      return lesson.shared && subject?.access === 'public'
    })
  }, [activeRole, lessons, subjects])

  const visibleEvents = React.useMemo(() => {
    if (activeRole === 'student') {
      return events
    }

    if (activeRole === 'registered') {
      return events.filter((event) => event.shared)
    }

    return events.filter((event) => event.shared && event.kind !== 'meeting')
  }, [activeRole, events])

  const subjectById = React.useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects])

  const calendarItems = React.useMemo(() => {
    const lessonItems = visibleLessons.map((lesson) =>
      makeLessonItem(lesson, subjectById.get(lesson.subjectId)),
    )

    const eventItems = visibleEvents.map((event) =>
      makeEventItem(event, event.subjectId === null ? undefined : subjectById.get(event.subjectId)),
    )

    return [...lessonItems, ...eventItems].sort((left, right) => left.start.getTime() - right.start.getTime())
  }, [subjectById, visibleEvents, visibleLessons])

  const selectedSubject = React.useMemo(() => {
    if (selectedSubjectId === null) {
      return visibleSubjects[0] ?? null
    }

    return visibleSubjects.find((subject) => subject.id === selectedSubjectId) ?? visibleSubjects[0] ?? null
  }, [selectedSubjectId, visibleSubjects])

  React.useEffect(() => {
    if (!selectedSubject) {
      return
    }

    if (selectedSubjectId !== selectedSubject.id) {
      setSelectedSubjectId(selectedSubject.id)
    }
  }, [selectedSubject, selectedSubjectId])

  React.useEffect(() => {
    if (calendarItems.length === 0) {
      setSelectedItemId(null)
      return
    }

    if (selectedItemId === null || !calendarItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(calendarItems[0].id)
    }
  }, [calendarItems, selectedItemId])

  const selectedCalendarItem = React.useMemo(
    () => calendarItems.find((item) => item.id === selectedItemId) ?? calendarItems[0] ?? null,
    [calendarItems, selectedItemId],
  )

  const currentUser = React.useMemo(
    () => users.find((user) => user.role === activeRole) ?? users[0] ?? null,
    [activeRole, users],
  )

  const overviewStats = React.useMemo(
    () => ({
      publicSubjects: subjects.filter((subject) => subject.access === 'public').length,
      sharedSubjects: subjects.filter((subject) => subject.access !== 'private').length,
      lessons: visibleLessons.length,
      events: visibleEvents.length,
      saved: savedSubjectIds.length,
    }),
    [savedSubjectIds.length, subjects, visibleEvents.length, visibleLessons.length],
  )

  const subjectLessons = React.useMemo(
    () => lessons.filter((lesson) => lesson.subjectId === selectedSubject?.id),
    [lessons, selectedSubject],
  )

  const subjectEvents = React.useMemo(
    () => events.filter((event) => event.subjectId === selectedSubject?.id),
    [events, selectedSubject],
  )

  const canManage = activeRole === 'student'
  const canSave = activeRole !== 'student'

  const toggleSavedSubject = (subjectId: number) => {
    if (!canSave) {
      return
    }

    setSavedSubjectIds((currentIds) =>
      currentIds.includes(subjectId)
        ? currentIds.filter((item) => item !== subjectId)
        : [...currentIds, subjectId],
    )
  }

  const toggleSubjectAccess = (subjectId: number) => {
    if (!canManage) {
      return
    }

    setSubjects((currentSubjects) =>
      currentSubjects.map((subject) =>
        subject.id === subjectId ? { ...subject, access: cycleAccess(subject.access) } : subject,
      ),
    )
  }

  const removeSubject = (subjectId: number) => {
    if (!canManage) {
      return
    }

    setSubjects((currentSubjects) => currentSubjects.filter((subject) => subject.id !== subjectId))
    setLessons((currentLessons) => currentLessons.filter((lesson) => lesson.subjectId !== subjectId))
    setEvents((currentEvents) => currentEvents.filter((event) => event.subjectId !== subjectId))
  }

  const toggleLessonSharing = (lessonId: number) => {
    if (!canManage) {
      return
    }

    setLessons((currentLessons) =>
      currentLessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, shared: !lesson.shared } : lesson)),
    )
  }

  const toggleEventSharing = (eventId: number) => {
    if (!canManage) {
      return
    }

    setEvents((currentEvents) =>
      currentEvents.map((event) => (event.id === eventId ? { ...event, shared: !event.shared } : event)),
    )
  }

  const createSubject = () => {
    if (!canManage) {
      return
    }

    const name = window.prompt('Název předmětu')?.trim()
    if (!name) {
      return
    }

    const code = window.prompt('Kód předmětu', 'NEW')?.trim().toUpperCase()
    if (!code) {
      return
    }

    const teacher = window.prompt('Vyučující', 'User')?.trim() || 'User'
    const access = window.prompt('Viditelnost: private / registered / public', 'registered')?.trim() as SubjectAccess | undefined

    const nextSubject: PlannerSubject = {
      id: getNextId(subjects),
      name,
      teacher,
      code,
      files: 0,
      notes: 0,
      ownerId: 1,
      access: access === 'private' || access === 'public' ? access : 'registered',
      description: 'Nový předmět vytvořený v novém režimu aplikace.',
      color: 'indigo',
      lessonsCount: 0,
      eventsCount: 0,
      studentsCount: 0,
      archived: false,
    }

    setSubjects((currentSubjects) => [nextSubject, ...currentSubjects])
    setSelectedSubjectId(nextSubject.id)
    setActiveScreen('subjects')
  }

  const createLesson = () => {
    if (!canManage || !selectedSubject) {
      return
    }

    const title = window.prompt('Název lekce', 'Nová lekce')?.trim()
    if (!title) {
      return
    }

    const startsAt = window.prompt('Začátek', '2026-04-15T09:00:00')?.trim()
    const endsAt = window.prompt('Konec', '2026-04-15T10:30:00')?.trim()
    const room = window.prompt('Místnost', 'A1.01')?.trim() || 'A1.01'
    const format = window.prompt('Format: lecture / seminar / lab', 'lecture')?.trim() as Lesson['format'] | undefined
    const shared = parseBooleanPrompt(window.prompt('Sdílená? ano/ne', 'ano'), true)

    if (!startsAt || !endsAt) {
      return
    }

    const nextLesson: Lesson = {
      id: getNextId(lessons),
      subjectId: selectedSubject.id,
      title,
      startsAt,
      endsAt,
      room,
      format: format === 'seminar' || format === 'lab' ? format : 'lecture',
      shared,
      notes: 'Přidáno ze správce role.',
    }

    setLessons((currentLessons) => [nextLesson, ...currentLessons])
    setSubjects((currentSubjects) =>
      currentSubjects.map((subject) =>
        subject.id === selectedSubject.id
          ? { ...subject, lessonsCount: subject.lessonsCount + 1 }
          : subject,
      ),
    )
    setActiveScreen('calendar')
    setSelectedItemId(nextLesson.id)
  }

  const createEvent = () => {
    if (!canManage || !selectedSubject) {
      return
    }

    const title = window.prompt('Název události', 'Nová událost')?.trim()
    if (!title) {
      return
    }

    const startsAt = window.prompt('Začátek', '2026-04-16T18:00:00')?.trim()
    const endsAt = window.prompt('Konec', '2026-04-16T19:00:00')?.trim()
    const location = window.prompt('Místo', 'Online')?.trim() || 'Online'
    const kind = window.prompt('Typ: deadline / exam / consultation / meeting', 'meeting')?.trim() as PlannerEvent['kind'] | undefined
    const shared = parseBooleanPrompt(window.prompt('Sdílená? ano/ne', 'ano'), true)

    if (!startsAt || !endsAt) {
      return
    }

    const nextEvent: PlannerEvent = {
      id: getNextId(events),
      subjectId: selectedSubject.id,
      title,
      startsAt,
      endsAt,
      kind: kind === 'deadline' || kind === 'exam' || kind === 'consultation' ? kind : 'meeting',
      shared,
      location,
      description: 'Přidáno ve správci nových rolí.',
    }

    setEvents((currentEvents) => [nextEvent, ...currentEvents])
    setSubjects((currentSubjects) =>
      currentSubjects.map((subject) =>
        subject.id === selectedSubject.id
          ? { ...subject, eventsCount: subject.eventsCount + 1 }
          : subject,
      ),
    )
    setActiveScreen('calendar')
    setSelectedItemId(nextEvent.id)
  }

  const screenLabel = plannerScreens.find((screen) => screen.id === activeScreen)?.label ?? 'Přehled'

  return {
    activeRole,
    setActiveRole,
    activeScreen,
    setActiveScreen,
    screenLabel,
    users,
    currentUser,
    subjects,
    visibleSubjects,
    selectedSubject,
    setSelectedSubjectId,
    subjectLessons,
    subjectEvents,
    lessons,
    visibleLessons,
    events,
    visibleEvents,
    calendarItems,
    selectedCalendarItem,
    selectedItemId,
    setSelectedItemId,
    savedSubjectIds,
    toggleSavedSubject,
    toggleSubjectAccess,
    removeSubject,
    toggleLessonSharing,
    toggleEventSharing,
    createSubject,
    createLesson,
    createEvent,
    canManage,
    canSave,
    roleLabels,
    roleCapabilities,
    plannerScreens,
    overviewStats,
  }
}
