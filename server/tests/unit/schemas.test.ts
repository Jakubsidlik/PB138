import { describe, expect, it } from 'bun:test'
import {
  studyPlanSchema,
  taskSchema,
  eventSchema,
  profileSchema,
  subjectSchema,
  lessonSchema,
  fileSchema
} from '../../src/schemas'

describe('schemas.ts', () => {
  describe('studyPlanSchema', () => {
    it('should validate valid data', () => {
      const data = { name: 'My Plan', description: 'Testing' }
      expect(studyPlanSchema.safeParse(data).success).toBe(true)
    })
    it('should fail if name is missing or empty', () => {
      expect(studyPlanSchema.safeParse({}).success).toBe(false)
      expect(studyPlanSchema.safeParse({ name: '   ' }).success).toBe(false)
    })
  })

  describe('taskSchema', () => {
    it('should validate valid data', () => {
      const data = { title: 'Do homework', priority: 'HIGH' }
      expect(taskSchema.safeParse(data).success).toBe(true)
    })
    it('should fail on invalid priority', () => {
      const data = { title: 'Do homework', priority: 'INVALID_PRIO' }
      expect(taskSchema.safeParse(data).success).toBe(false)
    })
  })

  describe('eventSchema', () => {
    it('should validate valid data', () => {
      const data = { title: 'Meeting', date: '2024-05-20' }
      expect(eventSchema.safeParse(data).success).toBe(true)
    })
    it('should fail if date is missing', () => {
      expect(eventSchema.safeParse({ title: 'Meeting' }).success).toBe(false)
    })
  })

  describe('profileSchema', () => {
    it('should validate valid profile data', () => {
      const data = { fullName: 'John Doe', email: 'john@example.com' }
      expect(profileSchema.safeParse(data).success).toBe(true)
    })
    it('should fail on invalid email format', () => {
      const data = { fullName: 'John Doe', email: 'not-an-email' }
      expect(profileSchema.safeParse(data).success).toBe(false)
    })
  })

  describe('subjectSchema', () => {
    it('should validate correctly', () => {
      const data = { name: 'Math', teacher: 'Mr. Smith', code: 'MATH101' }
      const res = subjectSchema.safeParse(data)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.code).toBe('MATH101') // Checks if toUpperCase() was applied? Zod doesn't transform unless we use transform, but the schema has .toUpperCase(), wait no, Zod string().toUpperCase() transforms the string!
      }
    })
    it('should fail if code is missing', () => {
      const data = { name: 'Math', teacher: 'Mr. Smith' }
      expect(subjectSchema.safeParse(data).success).toBe(false)
    })
  })

  describe('lessonSchema', () => {
    it('should use default values', () => {
      const data = { title: 'First Lesson' }
      const res = lessonSchema.safeParse(data)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.isShared).toBe(false)
        expect(res.data.orderIndex).toBe(0)
      }
    })
  })

  describe('fileSchema', () => {
    it('should validate string and number size', () => {
      expect(fileSchema.safeParse({ name: 'file.txt', size: 1024 }).success).toBe(true)
      expect(fileSchema.safeParse({ name: 'file.txt', size: '1 MB' }).success).toBe(true)
    })
  })
})
