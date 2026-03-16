import { CalendarCell, EventMeta, FileCategory, MobileNavItem } from './types'

export const getNavFromHash = (hash: string): MobileNavItem => {
  if (hash === '#calendar') {
    return 'calendar'
  }
  if (hash === '#subjects') {
    return 'subjects'
  }
  if (hash === '#files') {
    return 'files'
  }

  if (hash === '#profile') {
    return 'profile'
  }

  return 'home'
}

export const formatDateIso = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getDefaultMetaForTitle = (title: string): EventMeta => {
  const lower = title.toLowerCase()

  if (lower.includes('lab') || lower.includes('chem')) {
    return {
      time: '01:00 PM - 03:00 PM',
      location: 'Main Lab, Block C',
      icon: '🧪',
      accent: 'amber',
    }
  }

  if (lower.includes('meeting') || lower.includes('group') || lower.includes('org')) {
    return {
      time: '04:30 PM - 05:30 PM',
      location: 'Student Union Lounge',
      icon: '👥',
      accent: 'emerald',
    }
  }

  return {
    time: '09:00 AM - 10:30 AM',
    location: 'Science Building, Room 402',
    icon: '📘',
    accent: 'primary',
  }
}

export const getManagedFileCategory = (fileName: string): FileCategory => {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') {
    return 'pdf'
  }

  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') {
    return 'image'
  }

  if (ext === 'doc' || ext === 'docx' || ext === 'txt' || ext === 'rtf' || ext === 'ppt') {
    return 'document'
  }

  return 'other'
}

export const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
}

export const getDeadlineMeta = (index: number) => {
  if (index === 0) {
    return { label: 'High Priority', className: 'high', progress: 80 }
  }
  if (index === 1) {
    return { label: 'Medium Priority', className: 'medium', progress: 40 }
  }

  return { label: 'Low Priority', className: 'low', progress: 20 }
}

export const getRelativeDaysLabel = (date: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const eventDate = new Date(date)
  eventDate.setHours(0, 0, 0, 0)

  const diffMs = eventDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return 'Today'
  }

  if (diffDays === 1) {
    return 'In 1 day'
  }

  return `In ${diffDays} days`
}

export const buildCalendarCells = (displayMonth: Date): CalendarCell[] => {
  const year = displayMonth.getFullYear()
  const month = displayMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const startDate = new Date(year, month, 1 - startOffset)

  return Array.from({ length: 35 }, (_, index) => {
    const cellDate = new Date(startDate)
    cellDate.setDate(startDate.getDate() + index)

    return {
      date: cellDate,
      iso: formatDateIso(cellDate),
      inCurrentMonth: cellDate.getMonth() === month,
    }
  })
}
