import { describe, expect, it } from 'vitest'
import { isValidDisplayName, isValidEmail, isStrongPassword } from '../validation.js'

describe('backend validation', () => {
  it('requires display name to be at least 2 characters long', () => {
    expect(isValidDisplayName('A')).toBe(false)
    expect(isValidDisplayName('JT')).toBe(true)
    expect(isValidDisplayName('Ada')).toBe(true)
    expect(isValidDisplayName('Anna Marie')).toBe(true)
    expect(isValidDisplayName('Christopher')).toBe(true)
    expect(isValidDisplayName('  TC  ')).toBe(true)
    expect(isValidDisplayName('  Anna Marie  ')).toBe(true)
    expect(isValidDisplayName('  ')).toBe(false)
  })

  it('accepts only valid email addresses', () => {
    expect(isValidEmail('student@example.com')).toBe(true)
    expect(isValidEmail('student@example.cz')).toBe(true)
    expect(isValidEmail('jt@example.com')).toBe(true)
    expect(isValidEmail('a.b@example.org')).toBe(true)
    expect(isValidEmail('user+tag@example.com')).toBe(true)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('student.example.com')).toBe(false)
    expect(isValidEmail('student@')).toBe(false)
    expect(isValidEmail('student@com')).toBe(false)
  })

  it('requires strong passwords for signup payloads', () => {
    expect(isStrongPassword('abcDEF1!')).toBe(true)
    expect(isStrongPassword('abcdef1!')).toBe(false)
    expect(isStrongPassword('ABCDEF1!')).toBe(false)
    expect(isStrongPassword('Abcdefgh')).toBe(false)
    expect(isStrongPassword('Ab1!')).toBe(false)
  })
})