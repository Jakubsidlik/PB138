import { describe, expect, it } from 'bun:test'
import {
  asBigInt,
  asNumberId,
  toDateOnlyIso,
  parseOptionalDate,
  parseTaskPriority,
  parseUserRole,
  parseCollaborationRole,
  parseFileSizeToBytes,
  formatFileSize,
  inferFileCategory,
  parseCursorPagination
} from '../../src/utils.js'

describe('utils.ts', () => {
  describe('asBigInt', () => {
    it('should convert finite numbers to bigint', () => {
      expect(asBigInt(42)).toBe(42n)
      expect(asBigInt(42.9)).toBe(42n)
    })
    it('should convert string digits to bigint', () => {
      expect(asBigInt('123')).toBe(123n)
    })
    it('should return already bigint as is', () => {
      expect(asBigInt(10n)).toBe(10n)
    })
    it('should return null for invalid inputs', () => {
      expect(asBigInt('abc')).toBeNull()
      expect(asBigInt(null)).toBeNull()
      expect(asBigInt(undefined)).toBeNull()
    })
  })

  describe('asNumberId', () => {
    it('should convert bigint to number if safe', () => {
      expect(asNumberId(42n)).toBe(42)
    })
    it('should return null for non-bigint inputs', () => {
      expect(asNumberId(null)).toBeNull()
      expect(asNumberId(undefined)).toBeNull()
    })
  })

  describe('toDateOnlyIso', () => {
    it('should convert Date to YYYY-MM-DD', () => {
      const date = new Date('2024-05-20T14:30:00.000Z')
      expect(toDateOnlyIso(date)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('parseOptionalDate', () => {
    it('should return undefined for undefined input', () => {
      expect(parseOptionalDate(undefined)).toBeUndefined()
    })
    it('should return null for null or empty string', () => {
      expect(parseOptionalDate(null)).toBeNull()
      expect(parseOptionalDate('')).toBeNull()
    })
    it('should parse valid date string', () => {
      const parsed = parseOptionalDate('2024-05-20')
      expect(parsed).toBeInstanceOf(Date)
    })
    it('should return undefined for invalid date string', () => {
      expect(parseOptionalDate('invalid-date')).toBeUndefined()
    })
  })

  describe('parseTaskPriority', () => {
    it('should return parsed priority if valid', () => {
      expect(parseTaskPriority('HIGH')).toBe('HIGH')
      expect(parseTaskPriority('NONE')).toBe('NONE')
    })
    it('should return undefined for invalid priority', () => {
      expect(parseTaskPriority('INVALID')).toBeUndefined()
      expect(parseTaskPriority(123)).toBeUndefined()
    })
  })

  describe('parseUserRole', () => {
    it('should return parsed role if valid', () => {
      expect(parseUserRole('ADMIN')).toBe('ADMIN')
      expect(parseUserRole('REGISTERED')).toBe('REGISTERED')
    })
    it('should return undefined for invalid role', () => {
      expect(parseUserRole('GUEST')).toBeUndefined()
    })
  })

  describe('parseCollaborationRole', () => {
    it('should return valid roles', () => {
      expect(parseCollaborationRole('VIEWER')).toBe('VIEWER')
      expect(parseCollaborationRole('CONTRIBUTOR')).toBe('CONTRIBUTOR')
    })
    it('should return undefined for invalid', () => {
      expect(parseCollaborationRole('ADMIN')).toBeUndefined()
    })
  })

  describe('parseFileSizeToBytes', () => {
    it('should parse numeric size directly as trunc', () => {
      expect(parseFileSizeToBytes(1024.5)).toBe(1024)
    })
    it('should parse strings with units', () => {
      expect(parseFileSizeToBytes('1 KB')).toBe(1024)
      expect(parseFileSizeToBytes('2.5 MB')).toBe(2621440)
      expect(parseFileSizeToBytes('1 GB')).toBe(1073741824)
    })
    it('should return undefined/null on invalid', () => {
      expect(parseFileSizeToBytes(undefined)).toBeUndefined()
      expect(parseFileSizeToBytes(null)).toBeNull()
      expect(parseFileSizeToBytes('invalid size')).toBeUndefined()
    })
  })

  describe('formatFileSize', () => {
    it('should format to KB if under 1MB', () => {
      expect(formatFileSize(500 * 1024)).toBe('500 KB')
    })
    it('should format to MB if 1MB or over', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
    })
  })

  describe('inferFileCategory', () => {
    it('should correctly infer categories based on extension', () => {
      expect(inferFileCategory('test.pdf')).toBe('pdf')
      expect(inferFileCategory('img.PNG')).toBe('image')
      expect(inferFileCategory('doc.docx')).toBe('document')
      expect(inferFileCategory('file.unknown')).toBe('other')
    })
  })

  describe('parseCursorPagination', () => {
    it('should parse limits and cursors correctly', () => {
      const mockReq = { query: { limit: '50', cursor: '10' } } as any
      const result = parseCursorPagination(mockReq, { defaultLimit: 25, maxLimit: 100 })
      expect(result.limit).toBe(50)
      expect(result.cursor).toBe(10n)
      expect(result.enabled).toBe(true)
    })
    it('should clamp limit to maxLimit', () => {
      const mockReq = { query: { limit: '500' } } as any
      const result = parseCursorPagination(mockReq, { defaultLimit: 25, maxLimit: 100 })
      expect(result.limit).toBe(100)
    })
  })
})
