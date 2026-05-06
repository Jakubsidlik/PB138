/**
 * Generated from openapi.yaml - Zod schemas for Tasks
 * Do not edit manually
 */

import { z } from 'zod'

export const taskPrioritySchema = z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export const taskSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  done: z.boolean(),
  subjectId: z.number().nullable(),
  studyPlanId: z.number().nullable(),
  favorite: z.boolean(),
  tag: z.string().nullable(),
  deadline: z.string().nullable(),
  deletedAt: z.string().nullable(),
})

export const createTaskRequestSchema = z.object({
  title: z.string().min(1, 'Pole title je povinne.'),
  done: z.boolean().optional().default(false),
  subjectId: z.number().nullable().optional(),
  studyPlanId: z.number().nullable().optional(),
  favorite: z.boolean().optional().default(false),
  tag: z.string().nullable().optional(),
  priority: taskPrioritySchema.optional(),
  deadline: z.string().nullable().optional(),
})

export const updateTaskRequestSchema = createTaskRequestSchema.partial()

export const bulkTaskItemSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Nazev ukolu nesmi byt prazdny.'),
  done: z.boolean(),
  subjectId: z.number().nullable().optional(),
})

export const bulkTaskRequestSchema = z.object({
  tasks: z.array(bulkTaskItemSchema).min(1),
})

export const bulkTasksResponseSchema = z.object({
  success: z.boolean(),
  tasks: z.array(taskSchema).optional(),
})

export const paginatedTasksSchema = z.object({
  data: z.array(taskSchema),
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

export type Task = z.infer<typeof taskSchema>
export type CreateTaskRequest = z.infer<typeof createTaskRequestSchema>
export type UpdateTaskRequest = z.infer<typeof updateTaskRequestSchema>
export type BulkTaskRequest = z.infer<typeof bulkTaskRequestSchema>
export type BulkTasksResponse = z.infer<typeof bulkTasksResponseSchema>
export type PaginatedTasks = z.infer<typeof paginatedTasksSchema>
export type SuccessResponse = z.infer<typeof successResponseSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema>
