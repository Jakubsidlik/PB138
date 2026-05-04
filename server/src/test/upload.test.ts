import { describe, expect, it } from 'vitest'
import { buildFileKey, buildFileUrl } from '../fileStorage.js'

describe('file upload helpers', () => {
  it('creates sanitized file keys with unique prefixes', () => {
    expect(buildFileKey('uuid-123', 'lecture notes.pdf')).toBe('uuid-123-lecture_notes.pdf')
    expect(buildFileKey('uuid-123', 'lecture notes (final).pdf')).toBe('uuid-123-lecture_notes__final_.pdf')
    expect(buildFileKey('uuid-123', 'report(1).docx')).toBe('uuid-123-report_1_.docx')
  })

  it('builds Supabase-compatible file URLs when endpoint is configured', () => {
    expect(
      buildFileUrl(
        'uuid-123-lecture_notes.pdf',
        'lonelystudents-uploads',
        'https://example.storage.supabase.co/storage/v1/s3',
        'eu-west-1',
      ),
    ).toBe('https://example.storage.supabase.co/storage/v1/s3/lonelystudents-uploads/uuid-123-lecture_notes.pdf')
  })

  it('builds aws fallback file URLs when no endpoint is configured', () => {
    expect(buildFileUrl('uuid-123-lecture_notes.pdf', 'lonelystudents-uploads')).toBe(
      'https://lonelystudents-uploads.s3.eu-west-1.amazonaws.com/uuid-123-lecture_notes.pdf',
    )
  })
})