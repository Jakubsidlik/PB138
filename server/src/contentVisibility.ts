export type PublicContent = {
  isShared: boolean | null
  deletedAt: Date | null | undefined
}

export const isPubliclyVisible = (content: PublicContent): boolean => {
  if (content.deletedAt !== null) return false
  if (content.isShared !== true) return false
  return true
}
