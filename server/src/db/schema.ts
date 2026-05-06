import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
  bigint,
} from 'drizzle-orm/pg-core'

export const taskPriorityValues = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
export type TaskPriority = (typeof taskPriorityValues)[number]
export const taskPriorityEnum = pgEnum('TaskPriority', taskPriorityValues)

export const userRoleValues = ['REGISTERED', 'ADMIN'] as const
export type UserRole = (typeof userRoleValues)[number]
export const userRoleEnum = pgEnum('UserRole', userRoleValues)

export const eventRecurrenceValues = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'] as const
export type EventRecurrence = (typeof eventRecurrenceValues)[number]
export const eventRecurrenceEnum = pgEnum('EventRecurrence', eventRecurrenceValues)

export const collaborationRoleValues = ['VIEWER', 'CONTRIBUTOR'] as const
export type CollaborationRole = (typeof collaborationRoleValues)[number]
export const collaborationRoleEnum = pgEnum('CollaborationRole', collaborationRoleValues)

export const annotationTargetTypeValues = ['LESSON', 'LESSON_NOTE', 'FILE_COMMENT'] as const
export type AnnotationTargetType = (typeof annotationTargetTypeValues)[number]
export const annotationTargetTypeEnum = pgEnum('AnnotationTargetType', annotationTargetTypeValues)

export const users = pgTable('User', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedByDefaultAsIdentity(),
  clerkId: text('clerkId').unique(),
  fullName: text('fullName').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('passwordHash'),
  role: userRoleEnum('role').notNull().default('REGISTERED'),
  school: text('school'),
  faculty: text('faculty'),
  studyMajor: text('studyMajor'),
  studyYear: text('studyYear'),
  studyType: text('studyType'),
  birthDate: date('birthDate', { mode: 'date' }),
  bio: text('bio'),
  avatarDataUrl: text('avatarDataUrl'),
  deletedAt: timestamp('deletedAt', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  deletedAtIdx: index('User_deletedAt_idx').on(table.deletedAt),
}))

export const studyPlans = pgTable('StudyPlan', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedByDefaultAsIdentity(),
  userId: bigint('userId', { mode: 'bigint' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  faculty: text('faculty'),
  startDate: date('startDate', { mode: 'date' }),
  endDate: date('endDate', { mode: 'date' }),
  isActive: boolean('isActive').notNull().default(true),
  isShared: boolean('isShared').notNull().default(false),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('StudyPlan_userId_idx').on(table.userId),
  isActiveIdx: index('StudyPlan_isActive_idx').on(table.isActive),
  isSharedIdx: index('StudyPlan_isShared_idx').on(table.isShared),
}))

export const studyPlanCollaborators = pgTable('StudyPlanCollaborator', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedByDefaultAsIdentity(),
  studyPlanId: bigint('studyPlanId', { mode: 'bigint' }).notNull().references(() => studyPlans.id, { onDelete: 'cascade' }),
  userId: bigint('userId', { mode: 'bigint' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: collaborationRoleEnum('role').notNull().default('VIEWER'),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  uniqueStudyPlanUser: uniqueIndex('StudyPlanCollaborator_studyPlanId_userId_unique').on(table.studyPlanId, table.userId),
  userIdIdx: index('StudyPlanCollaborator_userId_idx').on(table.userId),
}))

export const subjects = pgTable('Subject', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedByDefaultAsIdentity(),
  userId: bigint('userId', { mode: 'bigint' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  studyPlanId: bigint('studyPlanId', { mode: 'bigint' }).references(() => studyPlans.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  teacher: text('teacher').notNull(),
  code: text('code').notNull(),
  isShared: boolean('isShared').notNull().default(false),
  deletedAt: timestamp('deletedAt', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('Subject_userId_idx').on(table.userId),
  studyPlanIdIdx: index('Subject_studyPlanId_idx').on(table.studyPlanId),
  isSharedIdx: index('Subject_isShared_idx').on(table.isShared),
  deletedAtIdx: index('Subject_deletedAt_idx').on(table.deletedAt),
  uniqueUserCode: uniqueIndex('Subject_userId_code_unique').on(table.userId, table.code),
}))

export const tasks = pgTable('Task', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedByDefaultAsIdentity(),
  userId: bigint('userId', { mode: 'bigint' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  subjectId: bigint('subjectId', { mode: 'bigint' }).references(() => subjects.id, { onDelete: 'set null' }),
  studyPlanId: bigint('studyPlanId', { mode: 'bigint' }).references(() => studyPlans.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  done: boolean('done').notNull().default(false),
  favorite: boolean('favorite').notNull().default(false),
  tag: text('tag'),
  deadline: timestamp('deadline', { withTimezone: true, mode: 'date' }),
  deletedAt: timestamp('deletedAt', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('Task_userId_idx').on(table.userId),
  subjectIdIdx: index('Task_subjectId_idx').on(table.subjectId),
  studyPlanIdIdx: index('Task_studyPlanId_idx').on(table.studyPlanId),
  deadlineIdx: index('Task_deadline_idx').on(table.deadline),
  deletedAtIdx: index('Task_deletedAt_idx').on(table.deletedAt),
}))

export const fileRecords = pgTable('FileRecord', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedByDefaultAsIdentity(),
  userId: bigint('userId', { mode: 'bigint' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  subjectId: bigint('subjectId', { mode: 'bigint' }).references(() => subjects.id, { onDelete: 'set null' }),
  lessonId: bigint('lessonId', { mode: 'bigint' }).references(() => lessons.id, { onDelete: 'set null' }),
  fileKey: text('fileKey').unique(),
  fileUrl: text('fileUrl'),
  name: text('name').notNull(),
  size: integer('size').notNull(),
  addedLabel: text('addedLabel').notNull(),
  isShared: boolean('isShared').notNull().default(false),
  deletedAt: timestamp('deletedAt', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('FileRecord_userId_idx').on(table.userId),
  subjectIdIdx: index('FileRecord_subjectId_idx').on(table.subjectId),
  lessonIdIdx: index('FileRecord_lessonId_idx').on(table.lessonId),
  isSharedIdx: index('FileRecord_isShared_idx').on(table.isShared),
  deletedAtIdx: index('FileRecord_deletedAt_idx').on(table.deletedAt),
}))

export const fileComments = pgTable('FileComment', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedByDefaultAsIdentity(),
  fileId: bigint('fileId', { mode: 'bigint' }).notNull().references(() => fileRecords.id, { onDelete: 'cascade' }),
  userId: bigint('userId', { mode: 'bigint' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  comment: text('comment').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  fileIdIdx: index('FileComment_fileId_idx').on(table.fileId),
  userIdIdx: index('FileComment_userId_idx').on(table.userId),
}))

export const lessons = pgTable('Lesson', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedByDefaultAsIdentity(),
  subjectId: bigint('subjectId', { mode: 'bigint' }).references(() => subjects.id, { onDelete: 'set null' }),
  studyPlanId: bigint('studyPlanId', { mode: 'bigint' }).references(() => studyPlans.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: text('content'),
  isShared: boolean('isShared').notNull().default(false),
  orderIndex: integer('orderIndex').notNull(),
  deletedAt: timestamp('deletedAt', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  subjectIdIdx: index('Lesson_subjectId_idx').on(table.subjectId),
  studyPlanIdIdx: index('Lesson_studyPlanId_idx').on(table.studyPlanId),
  isSharedIdx: index('Lesson_isShared_idx').on(table.isShared),
  deletedAtIdx: index('Lesson_deletedAt_idx').on(table.deletedAt),
}))

export const lessonNotes = pgTable('LessonNote', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedByDefaultAsIdentity(),
  lessonId: bigint('lessonId', { mode: 'bigint' }).notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  userId: bigint('userId', { mode: 'bigint' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  note: text('note').notNull(),
  isPinned: boolean('isPinned').notNull().default(false),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  lessonIdIdx: index('LessonNote_lessonId_idx').on(table.lessonId),
  userIdIdx: index('LessonNote_userId_idx').on(table.userId),
}))

export const events = pgTable('Event', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedByDefaultAsIdentity(),
  userId: bigint('userId', { mode: 'bigint' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  subjectId: bigint('subjectId', { mode: 'bigint' }).references(() => subjects.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  date: date('date', { mode: 'date' }).notNull(),
  time: text('time'),
  location: text('location'),
  isShared: boolean('isShared').notNull().default(false),
  recurrence: eventRecurrenceEnum('recurrence').notNull().default('NONE'),
  recurrenceGroupId: text('recurrenceGroupId'),
  deletedAt: timestamp('deletedAt', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('Event_userId_idx').on(table.userId),
  subjectIdIdx: index('Event_subjectId_idx').on(table.subjectId),
  isSharedIdx: index('Event_isShared_idx').on(table.isShared),
  dateIdx: index('Event_date_idx').on(table.date),
  deletedAtIdx: index('Event_deletedAt_idx').on(table.deletedAt),
  recurrenceGroupIdIdx: index('Event_recurrenceGroupId_idx').on(table.recurrenceGroupId),
}))

export const textAnnotations = pgTable('TextAnnotation', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedByDefaultAsIdentity(),
  targetType: annotationTargetTypeEnum('targetType').notNull(),
  targetId: bigint('targetId', { mode: 'bigint' }).notNull(),
  userId: bigint('userId', { mode: 'bigint' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  startOffset: integer('startOffset').notNull(),
  endOffset: integer('endOffset').notNull(),
  selectedText: text('selectedText').notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  targetIdx: index('TextAnnotation_targetType_targetId_idx').on(table.targetType, table.targetId),
  userIdIdx: index('TextAnnotation_userId_idx').on(table.userId),
}))

export type DbUser = typeof users.$inferSelect
export type DbStudyPlan = typeof studyPlans.$inferSelect
export type DbStudyPlanCollaborator = typeof studyPlanCollaborators.$inferSelect
export type DbSubject = typeof subjects.$inferSelect
export type DbTask = typeof tasks.$inferSelect
export type DbFileRecord = typeof fileRecords.$inferSelect
export type DbFileComment = typeof fileComments.$inferSelect
export type DbLesson = typeof lessons.$inferSelect
export type DbLessonNote = typeof lessonNotes.$inferSelect
export type DbEvent = typeof events.$inferSelect
export type DbTextAnnotation = typeof textAnnotations.$inferSelect