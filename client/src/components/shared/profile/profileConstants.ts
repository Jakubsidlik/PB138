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
  '6leté gymnázium',
  '8leté gymnázium',
  'Bakalářské studium',
  'Magisterské studium',
  'Doktorské studium',
]

export const studyTypeYearsMap: Record<string, string[]> = {
  'Základní škola': ['1. ročník', '2. ročník', '3. ročník', '4. ročník', '5. ročník', '6. ročník', '7. ročník', '8. ročník', '9. ročník'],
  'Střední škola': ['1. ročník', '2. ročník', '3. ročník', '4. ročník'],
  '6leté gymnázium': ['1. ročník', '2. ročník', '3. ročník', '4. ročník', '5. ročník', '6. ročník'],
  '8leté gymnázium': ['1. ročník', '2. ročník', '3. ročník', '4. ročník', '5. ročník', '6. ročník', '7. ročník', '8. ročník'],
  'Bakalářské studium': ['1. ročník', '2. ročník', '3. ročník', '4. ročník'],
  'Magisterské studium': ['1. ročník', '2. ročník', '3. ročník', '4. ročník', '5. ročník', '6. ročník'],
  'Doktorské studium': ['1. ročník', '2. ročník', '3. ročník', '4. ročník', '5. ročník', '6. ročník', '7. ročník', '8. ročník'],
}

export function getYearsForStudyType(studyType: string | null | undefined): string[] {
  if (!studyType) return studyYearOptions
  return studyTypeYearsMap[studyType] || studyYearOptions
}

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
