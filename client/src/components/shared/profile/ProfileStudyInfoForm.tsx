import React from 'react'
import { useForm, Controller } from 'react-hook-form'
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

  React.useEffect(() => {
    form.reset({
      school: profile.school || '',
      studyType: profile.studyType || '',
      studyMajor: profile.studyMajor || '',
      studyYear: profile.studyYear || '',
    })
  }, [form, profile.school, profile.studyType, profile.studyMajor, profile.studyYear])

  const watchedValues = form.watch()

  React.useEffect(() => {
    const school = watchedValues.school || undefined
    const studyType = watchedValues.studyType || undefined
    const studyMajor = watchedValues.studyMajor || undefined
    const studyYear = watchedValues.studyYear || undefined

    const hasChanges = 
      profile.school !== school ||
      profile.studyType !== studyType ||
      profile.studyMajor !== studyMajor ||
      profile.studyYear !== studyYear

    if (!hasChanges) {
      return
    }

    const updates: Partial<UserProfile> = {
      school,
      studyType,
      studyMajor,
      studyYear,
    }

    onChangeProfile(updates)
  }, [watchedValues, onChangeProfile, profile.school, profile.studyType, profile.studyMajor, profile.studyYear])

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
        <Controller
          control={form.control}
          name="studyType"
          render={({ field }) => (
            <Select
              value={field.value || ''}
              onValueChange={(value) => {
                const newType = value || ''
                field.onChange(newType)
                const validYears = getYearsForStudyType(newType)
                if (form.watch('studyYear') && !validYears.includes(form.watch('studyYear') as string)) {
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
          )}
        />
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
        <Controller
          control={form.control}
          name="studyYear"
          render={({ field }) => (
            <Select
              disabled={!form.watch('studyType')}
              value={field.value || ''}
              onValueChange={field.onChange}
            >
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
          )}
        />
        {form.formState.errors.studyYear && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.studyYear.message}</p>
        )}
      </div>
    </div>
  )
}
