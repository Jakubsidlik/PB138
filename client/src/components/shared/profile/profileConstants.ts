export const studyYearOptions = [
  '1. ročník',
  '2. ročník',
  '3. ročník',
  '4. ročník',
  '5. ročník',
  '6. ročník',
  '7. ročník',
  '8. ročník',
  '9. ročník',
  '10. ročník',
]

export const studyTypeOptions = [
  'Základní škola',
  'Střední škola',
  'Bakalářské studium',
  'Magisterské studium',
  'Doktorské studium',
]

export function initialsFromName(fullName: string): string {
  return (
    fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'U'
  )
}
