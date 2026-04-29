import { z } from 'zod'

export const studyPlanSchema = z.object({
  name: z.string().trim().min(1, 'Pole name je povinne.'),
  description: z.string().trim().nullable().optional(),
  faculty: z.string().trim().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  isShared: z.boolean().optional().default(false),
})
export const updateStudyPlanSchema = studyPlanSchema.partial()

export const subjectSchema = z.object({
  name: z.string().trim().min(1, 'Pole name je povinne.'),
  teacher: z.string().trim().min(1, 'Pole teacher je povinne.'),
  code: z.string().trim().min(1, 'Pole code je povinne.').toUpperCase(),
  studyPlanId: z.number().nullable().optional(),
  isShared: z.boolean().optional().default(false),
})
export const updateSubjectSchema = subjectSchema.partial().extend({
  archived: z.boolean().optional()
})

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Pole title je povinne.'),
  done: z.boolean().optional().default(false),
  subjectId: z.number().nullable().optional(),
  studyPlanId: z.number().nullable().optional(),
  favorite: z.boolean().optional().default(false),
  tag: z.string().trim().nullable().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  deadline: z.string().nullable().optional(),
})
export const updateTaskSchema = taskSchema.partial()

export const eventSchema = z.object({
  title: z.string().trim().min(1, 'Pole title a date jsou povinna.'),
  date: z.string().trim().min(1, 'Pole title a date jsou povinna.'),
  time: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  subjectId: z.number().nullable().optional(),
  recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  repeatCount: z.number().optional(),
  isShared: z.boolean().optional().default(false),
})
export const updateEventSchema = eventSchema.partial()

export const fileSchema = z.object({
  name: z.string().trim().min(1, 'Pole name je povinne.'),
  size: z.union([z.string(), z.number()]).optional(),
  addedLabel: z.string().optional().default('Added now'),
  shared: z.boolean().optional(),
  isShared: z.boolean().optional(),
  subjectId: z.number().nullable().optional(),
  lessonId: z.number().nullable().optional(),
  fileKey: z.string().nullable().optional(),
  fileUrl: z.string().nullable().optional(),
})
export const updateFileSchema = fileSchema.partial()

export const fileCommentSchema = z.object({
  comment: z.string().trim().min(1, 'Pole comment je povinne.')
})

export const lessonSchema = z.object({
  title: z.string().trim().min(1, 'Pole title je povinne.'),
  content: z.string().nullable().optional(),
  subjectId: z.number().nullable().optional(),
  studyPlanId: z.number().nullable().optional(),
  isShared: z.boolean().optional().default(false),
  orderIndex: z.number().optional().default(0),
})
export const updateLessonSchema = lessonSchema.partial()

export const lessonNoteSchema = z.object({
  note: z.string().trim().min(1, 'Pole note je povinne.'),
  isPinned: z.boolean().optional().default(false),
})
export const updateLessonNoteSchema = lessonNoteSchema.partial()

export const textAnnotationSchema = z.object({
  targetType: z.enum(['LESSON', 'LESSON_NOTE', 'FILE_COMMENT']),
  targetId: z.union([z.string(), z.number()]),
  startOffset: z.number().min(0, 'Neplatny interval oznaceni textu.'),
  endOffset: z.number().min(0, 'Neplatny interval oznaceni textu.'),
  selectedText: z.string().trim().min(1, 'Pole selectedText a comment jsou povinna.'),
  comment: z.string().trim().min(1, 'Pole selectedText a comment jsou povinna.'),
})

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Pole fullName je povinne.'),
  email: z.string().trim().email('Neplatny format emailu.'),
  password: z.string().optional(),
  role: z.enum(['REGISTERED', 'ADMIN']).optional(),
  school: z.string().trim().nullable().optional(),
  faculty: z.string().trim().nullable().optional(),
  studyMajor: z.string().trim().nullable().optional(),
  studyYear: z.string().trim().nullable().optional(),
  studyType: z.string().trim().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  bio: z.string().trim().nullable().optional(),
  avatarDataUrl: z.string().nullable().optional(),
})
export const updateProfileSchema = profileSchema.partial()

export const shareStudyPlanSchema = z.object({
  email: z.string().trim().min(1, 'Pole email je povinne.'),
  role: z.enum(['VIEWER', 'CONTRIBUTOR']).optional().default('VIEWER')
})

export const uploadUrlSchema = z.object({
  filename: z.string().trim().min(1, 'Chybi filename.'),
  contentType: z.string().trim().min(1, 'Chybi contentType.')
})

export const fileModerationSchema = z.object({
  isShared: z.boolean().optional(),
  deleted: z.boolean().optional()
})

export const bulkTasksSchema = z.object({
  tasks: z.array(z.object({
    id: z.number(),
    title: z.string().trim().min(1, 'Nazev ukolu nesmi byt prazdny.'),
    done: z.boolean(),
    subjectId: z.number().nullable().optional()
  }))
})

export const bulkEventsSchema = z.object({
  events: z.array(z.object({
    id: z.number(),
    title: z.string().trim().min(1, 'Nazev udalosti nesmi byt prazdny.'),
    date: z.string().refine((val) => !Number.isNaN(new Date(val).getTime()), { message: 'Neplatny format data.' }),
    time: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    isShared: z.boolean().optional().default(false),
    subjectId: z.number().nullable().optional()
  }))
})