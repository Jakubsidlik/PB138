export type Subject = {
	id: number
	userId?: number | null
	studyPlanId?: number | null
	name: string
	teacher: string
	code: string
	files: number
	notes: number
	archived?: boolean
	events?: number
	deletedAt?: string | null
}

export type StudyPlan = {
	id: number
	userId: number
	name: string
	description: string | null
	startDate: string
	endDate: string | null
	isActive: boolean
	subjectsCount?: number
	tasksCount?: number
	lessonsCount?: number
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
	userId?: number
	subjectId?: number | null
	name: string
	size: string
	sizeBytes?: number
	addedLabel: string
	category: FileCategory
	shared: boolean
	isShared?: boolean
	deletedAt?: string | null
}

export type FileFolder = {
	id: number
	name: string
	filesCount: number
	color: 'amber' | 'emerald' | 'primary' | 'slate'
}

export type Task = {
	id: number
	userId?: number
	subjectId?: number | null
	studyPlanId?: number | null
	title: string
	done: boolean
	favorite?: boolean
	priority?: TaskPriority
	deadline?: string | null
	deletedAt?: string | null
}

export type TaskPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type TaskArchive = {
	id: number
	taskId: number
	userId: number
	subjectId: number | null
	studyPlanId: number | null
	title: string
	done: boolean
	favorite: boolean
	priority: TaskPriority
	deadline: string | null
	completedAt: string
	archivedAt: string
	deletedAt?: string | null
}

export type CalendarEvent = {
	id: number
	userId?: number
	title: string
	date: string
	time?: string
	location?: string
	icon?: string
	accent?: 'primary' | 'amber' | 'emerald'
	subjectId?: number | null
	deletedAt?: string | null
}

export type Lesson = {
	id: number
	subjectId: number | null
	studyPlanId: number | null
	title: string
	content: string | null
	orderIndex: number
	notesCount?: number
	deletedAt?: string | null
}

export type LessonNote = {
	id: number
	lessonId: number
	userId: number
	note: string
	isPinned: boolean
	createdAt: string
	updatedAt: string
}

export type FileComment = {
	id: number
	fileId: number
	userId: number
	comment: string
	createdAt: string
	updatedAt: string
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
	| 'rose'
	| 'amber'
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

export type UserRole = 'student' | 'registered' | 'public'

export type AuthRole = 'REGISTERED' | 'ADMIN'

export type AuthSession = {
	userId: number
	role: AuthRole
	fullName: string
	email: string
}

export type PlannerCalendarKind = 'lesson' | 'event'

export type PlannerCalendarColor = 'blue' | 'emerald' | 'violet' | 'amber' | 'cyan' | 'rose'

export type PlannerCalendarItem = {
	id: number
	title: string
	subjectCode: string
	subjectTitle: string
	start: Date
	end: Date
	kind: PlannerCalendarKind
	color: PlannerCalendarColor
	shared: boolean
	location: string
	description: string
}

export type CalendarCell = {
	date: Date
	iso: string
	inCurrentMonth: boolean
}
