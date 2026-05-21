import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserProfile } from '../../../app/types'
import { studyTypeOptions, getYearsForStudyType } from './profileConstants'
import { Input } from '../../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { profileStudyInfoSchema, type ProfileStudyInfoFormData } from '../../../app/schemas'

type ProfileStudyInfoFormProps = {
  profile: Partial<UserProfile>
  onChangeProfile: (updates: Partial<UserProfile>) => void
}

export function ProfileStudyInfoForm({ profile, onChangeProfile }: ProfileStudyInfoFormProps) {
  const form = useForm<ProfileStudyInfoFormData>({
    resolver: zodResolver(profileStudyInfoSchema),
    defaultValues: {
      school: profile.school || '',
      studyType: profile.studyType || '',
      studyMajor: profile.studyMajor || '',
      studyYear: profile.studyYear || '',
    },
  })

  const watchedValues = form.watch()

  React.useEffect(() => {
    // Sync the form values to the parent when they change
    const school = watchedValues.school
    const studyType = watchedValues.studyType
    const studyMajor = watchedValues.studyMajor
    const studyYear = watchedValues.studyYear

    const updates: Partial<UserProfile> = {
      school: school || undefined,
      studyType: studyType || undefined,
      studyMajor: studyMajor || undefined,
      studyYear: studyYear || undefined,
    }

    onChangeProfile(updates)
  }, [watchedValues, onChangeProfile])

  const availableYears = getYearsForStudyType(form.watch('studyType'))

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Škola</span>
        <Input
          id="school"
          {...form.register('school')}
          placeholder="např. Masarykova Univerzita"
        />
        {form.formState.errors.school && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.school.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Typ studia</span>
        <Select
          value={form.watch('studyType') || undefined}
          onValueChange={(value) => {
            const newType = value || ''
            form.setValue('studyType', newType)
            const validYears = getYearsForStudyType(newType)
            if (form.watch('studyYear') && !validYears.includes(form.watch('studyYear'))) {
              form.setValue('studyYear', '')
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Vyberte typ studia" />
          </SelectTrigger>
          <SelectContent>
            {studyTypeOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.studyType && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.studyType.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Studijní zaměření</span>
        <Input
          id="studyMajor"
          {...form.register('studyMajor')}
          placeholder="např. Aplikovaná informatika"
        />
        {form.formState.errors.studyMajor && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.studyMajor.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Ročník</span>
        <Select value={form.watch('studyYear') || undefined} onValueChange={(value) => form.setValue('studyYear', value || '')}>
          <SelectTrigger>
            <SelectValue placeholder="Vyberte ročník" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.studyYear && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.studyYear.message}</p>
        )}
      </div>
    </div>
  )
}
