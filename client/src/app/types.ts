export type Subject = {
	id: number
	name: string
	teacher: string
	code: string
	files: number
	notes: number
	archived?: boolean
	events?: number
}

export type ScheduleItem = {
	id: number
	time: string
	subject: string
	type: string
	location: string
}

export type StudyFile = {
	id: number
	subject: string
	name: string
	size: string
}

export type FileCategory = 'folder' | 'pdf' | 'image' | 'document' | 'other'
export type FileTab = 'all' | 'recent' | 'shared'

export type ManagedFile = {
	id: number
	name: string
	size: string
	addedLabel: string
	category: FileCategory
	shared: boolean
}

export type FileFolder = {
	id: number
	name: string
	filesCount: number
	color: 'amber' | 'emerald' | 'primary' | 'slate'
}

export type Task = {
	id: number
	title: string
	done: boolean
}

export type CalendarEvent = {
	id: number
	title: string
	date: string
	time?: string
	location?: string
	icon?: string
	accent?: 'primary' | 'amber' | 'emerald'
	subjectId?: number | null
}

export type EventMeta = {
	time: string
	location: string
	icon: string
	accent: 'primary' | 'amber' | 'emerald'
}

export type ThemeMode = 'light' | 'dark'
export type AccentPalette =
	| 'blue'
	| 'emerald'
	| 'violet'
	| 'rose'
	| 'red'
	| 'amber'
	| 'orange'
	| 'cyan'
	| 'mono'
export type MobileNavItem = 'home' | 'calendar' | 'subjects' | 'files' | 'profile'

export type UserProfile = {
	fullName: string
	email: string
	school: string
	studyMajor: string
	studyYear: string
	studyType: string
	avatarDataUrl: string | null
}

export type SubjectVisual = {
	icon: string
	tone: 'blue' | 'emerald' | 'violet' | 'amber'
}

export type DesktopSubjectTone = 'blue' | 'emerald' | 'violet' | 'amber' | 'cyan'

export type DesktopSubjectMeta = {
	icon: string
	tone: DesktopSubjectTone
}

export type CalendarCell = {
	date: Date
	iso: string
	inCurrentMonth: boolean
}

export type UserRole = 'student' | 'registered' | 'public'

export type AppScreen = 'overview' | 'subjects' | 'calendar' | 'users'

export type SubjectAccess = 'private' | 'registered' | 'public'

export type LessonFormat = 'lecture' | 'seminar' | 'lab'

export type EventKind = 'deadline' | 'exam' | 'consultation' | 'meeting'

export type PlannerUser = {
	id: number
	name: string
	email: string
	role: UserRole
	institution: string
	bio: string
	avatarDataUrl: string | null
	lastSeenLabel: string
}

export type PlannerSubject = Subject & {
	ownerId: number
	access: SubjectAccess
	description: string
	color: 'indigo' | 'emerald' | 'amber' | 'rose'
	lessonsCount: number
	eventsCount: number
	studentsCount: number
}

export type Lesson = {
	id: number
	subjectId: number
	title: string
	startsAt: string
	endsAt: string
	room: string
	format: LessonFormat
	shared: boolean
	notes: string
}

export type Event = {
	id: number
	subjectId: number | null
	title: string
	startsAt: string
	endsAt: string
	kind: EventKind
	shared: boolean
	location: string
	description: string
}

export type PlannerCalendarItem = {
	id: number
	title: string
	start: Date
	end: Date
	kind: 'lesson' | 'event'
	subjectTitle: string
	subjectCode: string
	shared: boolean
	location: string
	description: string
	color: string
}

export type RoleCapability = {
	label: string
	description: string
}
