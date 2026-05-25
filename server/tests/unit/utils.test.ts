import { describe, expect, it } from 'bun:test'
import {
  asBigInt,
  asNumberId,
  toDateOnlyIso,
  formatFileSize,
  inferFileCategory,
  parseCursorPagination,
  mapFileRecord,
  toPaginatedPayload
} from '../../src/utils'

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

  describe('mapFileRecord', () => {
    it('should map db object to FileRecord correctly', () => {
      const dbFile = {
        id: 1n,
        userId: 2n,
        subjectId: 3n,
        name: 'test.pdf',
        size: 1024,
        fileKey: 'key',
        fileUrl: 'http://url',
        addedLabel: 'label',
        isShared: true,
        userEmail: 'test@example.com',
        likes: 5,
        dislikes: 1,
        userVote: 'LIKE',
        deletedAt: new Date('2024-05-20T14:30:00.000Z')
      }
      const result = mapFileRecord(dbFile)
      expect(result.id).toBe(1)
      expect(result.userId).toBe(2)
      expect(result.subjectId).toBe(3)
      expect(result.name).toBe('test.pdf')
      expect(result.category).toBe('pdf')
      expect(result.sizeBytes).toBe(1024)
      expect(result.userEmail).toBe('test@example.com')
      expect(result.likes).toBe(5)
      expect(result.userVote).toBe('LIKE')
      expect(result.deletedAt).toBe('2024-05-20T14:30:00.000Z')
    })
  })

  describe('toPaginatedPayload', () => {
    it('should calculate pagination correctly', () => {
      const result = toPaginatedPayload([{id: 1}, {id: 2}, {id: 3}], 2)
      expect(result.data).toEqual([{id: 1}, {id: 2}])
      expect(result.hasMore).toBe(true)
      expect(result.nextCursor).toBe('2')
    })

    it('should handle no next page', () => {
      const result = toPaginatedPayload([{id: 1}, {id: 2}], 2)
      expect(result.data).toEqual([{id: 1}, {id: 2}])
      expect(result.hasMore).toBe(false)
      expect(result.nextCursor).toBeNull()
    })
  })
})
