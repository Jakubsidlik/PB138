export type PublicContent = {
  isShared: boolean | null
  deletedAt: Date | null | undefined
}

export const isPubliclyVisible = (content: PublicContent): boolean => {
  // Obsah musí mít deletedAt přesně null (ne undefined nebo Date)
  if (content.deletedAt !== null) return false
  // Obsah musí být explicitně sdílený
  if (content.isShared !== true) return false
  return true
}
