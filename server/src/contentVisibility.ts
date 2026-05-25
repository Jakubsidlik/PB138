export type PublicContent = {
  isShared: boolean | null
  deletedAt: Date | null | undefined
}

export const isPubliclyVisible = (content: PublicContent): boolean => {
  // Obsah musĂ­ mĂ­t deletedAt pĹ™esnÄ› null (ne undefined nebo Date)
  if (content.deletedAt !== null) return false
  // Obsah musĂ­ bĂ˝t explicitnÄ› sdĂ­lenĂ˝
  if (content.isShared !== true) return false
  return true
}
