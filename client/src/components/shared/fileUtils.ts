import { ManagedFile } from '../../app/types'

export function getFileIcon(category: ManagedFile['category']): { icon: string; tone: string } {
  if (category === 'pdf') {
    return { icon: '📕', tone: 'red' }
  }
  if (category === 'image') {
    return { icon: '🖼️', tone: 'green' }
  }
  if (category === 'document') {
    return { icon: '📄', tone: 'blue' }
  }

  return { icon: '📁', tone: 'slate' }
}
