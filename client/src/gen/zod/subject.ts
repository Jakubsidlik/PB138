/**
 * Generated from openapi.yaml - Zod schemas for Subjects
 * Do not edit manually
 */

import { z } from 'zod'

export const subjectSchema = z.object({
  id: z.number(),
  userId: z.number(),
  studyPlanId: z.number().nullable(),
  name: z.string(),
  teacher: z.string(),
  code: z.string(),
  isShared: z.boolean(),
  archived: z.boolean(),
  files: z.number(),
  tasks: z.number(),
  events: z.number(),
  notes: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export const createSubjectRequestSchema = z.object({
  name: z.string().min(1, 'Pole name je povinne.'),
  teacher: z.string().min(1, 'Pole teacher je povinne.'),
  code: z.string().min(1, 'Pole code je povinne.').toUpperCase(),
  studyPlanId: z.number().nullable().optional(),
  isShared: z.boolean().optional().default(false),
})

export const updateSubjectRequestSchema = createSubjectRequestSchema.partial().extend({
  archived: z.boolean().optional(),
})

export const paginatedSubjectsSchema = z.object({
  data: z.array(subjectSchema),
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
  limit: z.number(),
})

export const successResponseSchema = z.object({
  success: z.boolean(),
})

export const errorResponseSchema = z.object({
  error: z.string(),
})

export type Subject = z.infer<typeof subjectSchema>
export type CreateSubjectRequest = z.infer<typeof createSubjectRequestSchema>
export type UpdateSubjectRequest = z.infer<typeof updateSubjectRequestSchema>
export type PaginatedSubjects = z.infer<typeof paginatedSubjectsSchema>
export type SuccessResponse = z.infer<typeof successResponseSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema>
