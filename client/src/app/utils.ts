import { CalendarCell, EventMeta, FileCategory } from './types'


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
    return { label: 'Vysoká priorita', className: 'Vysoká', progress: 80 }
  }
  if (index === 1) {
    return { label: 'Střední priorita', className: 'Střední', progress: 40 }
  }

  return { label: 'Nízká priorita', className: 'Nízká', progress: 20 }
}

export const getRelativeDaysLabel = (date: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const eventDate = new Date(date)
  eventDate.setHours(0, 0, 0, 0)

  const diffMs = eventDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return 'Dnes'
  }

  if (diffDays === 1) {
    return 'Zítra'
  }

  if (diffDays >= 2 && diffDays <= 4) {
    return `Za ${diffDays} dny`
  }

  return `Za ${diffDays} dní`
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

export const getDailyMotto = (): string => {
  const mottos = [
    '"Vzdělání je nejlepší investice!"',
    '"Každý den je nová příležitost!"',
    '"Malé krůčky vedou k velkým cílům!"',
    '"Věř ve své schopnosti!"',
    '"Učení nikdy nekončí!"',
    '"Soustředění je klíč k úspěchu!"',
    '"Tvoje práce se vždy vyplatí!"',
    '"Chyby jsou součástí učení!"',
    '"Nejlepší čas je teď!"',
    '"Nerezignuj na své sny!"',
    '"Jsi silnější, než si myslíš!"',
    '"Sebevědomost roste s praxí!"',
    '"Společný úkol - větší síla!"',
    '"Každý máster byl kdysi začátečník!"',
    '"Ztráta je jen lekce!"',
    '"Tvůj potenciál je neomezený!"',
    '"Vytrvalost je cesta k vítězství!"',
    '"Základy jsou důležité!"'
  ]

  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  return mottos[dayOfYear % mottos.length]
}
