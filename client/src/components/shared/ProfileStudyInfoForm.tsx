import { UserProfile } from '../../app/types'
import { studyYearOptions, studyTypeOptions } from './profileConstants'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

type ProfileStudyInfoFormProps = {
  profile: Partial<UserProfile>
  onChangeProfile: (updates: Partial<UserProfile>) => void
}

export function ProfileStudyInfoForm({ profile, onChangeProfile }: ProfileStudyInfoFormProps) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Škola</span>
        <Input
          id="school"
          value={profile.school || ''}
          onChange={(e) => onChangeProfile({ school: e.target.value })}
          placeholder="např. Masarykova Univerzita"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Typ studia</span>
        <Select value={profile.studyType} onValueChange={(value) => onChangeProfile({ studyType: value })}>
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
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Studijní zaměření</span>
        <Input
          id="studyMajor"
          value={profile.studyMajor || ''}
          onChange={(e) => onChangeProfile({ studyMajor: e.target.value })}
          placeholder="např. Aplikovaná informatika"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Ročník</span>
        <Select value={profile.studyYear} onValueChange={(value) => onChangeProfile({ studyYear: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Vyberte ročník" />
          </SelectTrigger>
          <SelectContent>
            {studyYearOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
