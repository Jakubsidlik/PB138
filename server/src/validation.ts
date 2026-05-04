export const isValidDisplayName = (name: unknown): boolean => {
  if (typeof name !== 'string') return false
  const trimmed = name.trim()
  return trimmed.length >= 2
}

export const isValidEmail = (email: unknown): boolean => {
  if (typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isStrongPassword = (password: unknown): boolean => {
  if (typeof password !== 'string') return false
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  const isLongEnough = password.length >= 8

  return hasLowercase && hasUppercase && hasDigit && hasSpecialChar && isLongEnough
}

export const isEmailAvailable = (existingEmail: string | null, newEmail: string | null): boolean => {
  if (!newEmail || !existingEmail) return true
  return existingEmail.toLowerCase() !== newEmail.toLowerCase()
}
