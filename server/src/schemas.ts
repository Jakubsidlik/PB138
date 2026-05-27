import { z } from 'zod'

export const studyPlanSchema = z.object({
  name: z.string().trim().min(1, 'Pole name je povinne.'),
  description: z.string().trim().nullable().optional(),

  isActive: z.boolean().optional(),
  isShared: z.boolean().optional(),
})
export const updateStudyPlanSchema = studyPlanSchema.partial()

export const subjectSchema = z.object({
  name: z.string().trim().min(1, 'Pole name je povinne.'),
  teacher: z.string().trim().min(1, 'Pole teacher je povinne.'),
  code: z.string().trim().min(1, 'Pole code je povinne.').toUpperCase(),
  studyPlanId: z.number().nullable().optional(),
  isShared: z.boolean().optional(),
  tagIds: z.array(z.number()).optional(),
})
export const updateSubjectSchema = subjectSchema.partial().extend({
  archived: z.boolean().optional(),
})

export const tagSchema = z.object({
  name: z.string().trim().min(1, 'Pole name je povinne.'),
  color: z.string().trim().min(1, 'Pole color je povinne.'),
})


export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Pole title je povinne.'),
  done: z.boolean().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
})
export const updateTaskSchema = taskSchema.partial()

export const eventSchema = z.object({
  title: z.string().trim().min(1, 'Pole title a date jsou povinna.'),
  date: z.string().trim().min(1, 'Pole title a date jsou povinna.'),
  time: z.string().nullable().optional(),
  location: z.string().nullable().optional(),

  isShared: z.boolean().optional(),
})
export const updateEventSchema = eventSchema.partial()

const parseSizeToBytes = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.trunc(value)
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (/^\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10)
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)$/i)
  if (!match) return undefined
  const amount = Number.parseFloat(match[1])
  const unit = match[2].toUpperCase()
  if (unit === 'KB') return Math.round(amount * 1024)
  if (unit === 'MB') return Math.round(amount * 1024 * 1024)
  return Math.round(amount * 1024 * 1024 * 1024)
}

export const fileSchema = z.object({
  name: z.string().trim().min(1, 'Pole name je povinne.'),
  size: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined
      const parsed = parseSizeToBytes(val)
      return parsed !== undefined ? parsed : val
    },
    z.number({ invalid_type_error: 'Pole size musi byt cislo nebo text typu "2.4 MB".' }).optional()
  ),
  addedLabel: z.string().optional().default('Added now'),
  shared: z.boolean().optional(),
  isShared: z.boolean().optional(),
  subjectId: z.number().nullable().optional(),
  fileKey: z.string().nullable().optional(),
  fileUrl: z.string().nullable().optional(),
})
export const updateFileSchema = fileSchema.partial()

export const shareFileSchema = z.object({
  targetUserEmail: z.string().email('Neplatný formát e-mailu'),
  permission: z.enum(['read', 'write']).default('read'),
})



export const lessonSchema = z.object({
  title: z.string().trim().min(1, 'Pole title je povinne.'),
  content: z.string().max(2000, 'Poznámka může mít maximálně 2000 znaků.').nullable().optional(),
  subjectId: z.number().nullable().optional(),
  isShared: z.boolean().optional().default(false),
  orderIndex: z.number().optional().default(0),
})
export const updateLessonSchema = lessonSchema.partial()


export const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Pole fullName je povinne.'),
  email: z.string().trim().email('Neplatny format emailu.'),
  password: z.string().optional(),
  role: z.enum(['REGISTERED', 'ADMIN', 'PUBLIC']).optional(),
  school: z.string().trim().nullable().optional(),
  studyMajor: z.string().trim().nullable().optional(),
  studyYear: z.string().trim().nullable().optional(),
  studyType: z.string().trim().nullable().optional(),

  avatarDataUrl: z.string().nullable().optional(),
})
export const updateProfileSchema = z.object({
  fullName: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().trim().min(1, 'Pole fullName je povinne.').optional()
  ),
  email: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().trim().email('Neplatny format emailu.').optional()
  ),
  password: z.string().optional(),
  role: z.enum(['REGISTERED', 'ADMIN', 'PUBLIC']).optional(),
  school: z.string().trim().nullable().optional(),
  studyMajor: z.string().trim().nullable().optional(),
  studyYear: z.string().trim().nullable().optional(),
  studyType: z.string().trim().nullable().optional(),
  avatarDataUrl: z.string().nullable().optional(),
})

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
  }))
})