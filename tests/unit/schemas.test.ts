import { describe, expect, it } from 'bun:test'
import {
  studyPlanSchema,
  taskSchema,
  eventSchema,
  profileSchema,
  subjectSchema,
  lessonSchema,
  fileSchema,
  groupSchema,
  inviteSchema,
  setTierSchema,
  imageSchema,
} from '../../server/src/schemas'

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
        expect(res.data.code).toBe('MATH101')
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

  describe('groupSchema', () => {
    it('should validate valid group name', () => {
      expect(groupSchema.safeParse({ name: 'My Tier Group' }).success).toBe(true)
    })
    it('should fail when name is missing', () => {
      expect(groupSchema.safeParse({}).success).toBe(false)
    })
    it('should fail when name is empty or whitespace-only', () => {
      expect(groupSchema.safeParse({ name: '' }).success).toBe(false)
      expect(groupSchema.safeParse({ name: '   ' }).success).toBe(false)
    })
  })

  describe('inviteSchema', () => {
    it('should validate a valid email address', () => {
      expect(inviteSchema.safeParse({ email: 'user@example.com' }).success).toBe(true)
    })
    it('should fail on invalid email format', () => {
      expect(inviteSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
    })
    it('should fail when email is missing', () => {
      expect(inviteSchema.safeParse({}).success).toBe(false)
    })
  })

  describe('setTierSchema', () => {
    it('should validate all valid tier values', () => {
      const validTiers = ['S', 'A', 'B', 'C', 'D', 'E', 'F']
      for (const tier of validTiers) {
        expect(setTierSchema.safeParse({ tier }).success).toBe(true)
      }
    })
    it('should fail on invalid tier value', () => {
      expect(setTierSchema.safeParse({ tier: 'Z' }).success).toBe(false)
      expect(setTierSchema.safeParse({ tier: 'G' }).success).toBe(false)
      expect(setTierSchema.safeParse({ tier: '' }).success).toBe(false)
    })
    it('should fail when tier is missing', () => {
      expect(setTierSchema.safeParse({}).success).toBe(false)
    })
  })

  describe('imageSchema', () => {
    it('should validate valid image data with all fields', () => {
      const data = { name: 'Ferrari.jpg', size: 2048, fileKey: 'uuid-ferrari.jpg', fileUrl: 'https://example.com/img.jpg' }
      expect(imageSchema.safeParse(data).success).toBe(true)
    })
    it('should validate image data with only name (others optional)', () => {
      expect(imageSchema.safeParse({ name: 'photo.png' }).success).toBe(true)
    })
    it('should use default size of 0 when not provided', () => {
      const result = imageSchema.safeParse({ name: 'photo.png' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.size).toBe(0)
      }
    })
    it('should fail when name is missing', () => {
      expect(imageSchema.safeParse({ size: 1024 }).success).toBe(false)
    })
    it('should fail when name is empty', () => {
      expect(imageSchema.safeParse({ name: '' }).success).toBe(false)
      expect(imageSchema.safeParse({ name: '   ' }).success).toBe(false)
    })
  })
})

