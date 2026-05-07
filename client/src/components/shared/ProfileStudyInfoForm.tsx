import { UserProfile } from '../../app/types'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select'
import { studyYearOptions, studyTypeOptions } from './profileConstants'

type ProfileStudyInfoFormProps = {
  profile: Partial<UserProfile>
  onChangeProfile: (updates: Partial<UserProfile>) => void
}

export function ProfileStudyInfoForm({ profile, onChangeProfile }: ProfileStudyInfoFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="school">Škola</Label>
        <Input
          id="school"
          value={profile.school || ''}
          onChange={(e) => onChangeProfile({ school: e.target.value })}
          placeholder="např. Masarykova Univerzita"
        />
      </div>

      <div>
        <Label htmlFor="studyType">Typ studia</Label>
        <Select value={profile.studyType || ''} onValueChange={(value) => onChangeProfile({ studyType: value })}>
          <SelectTrigger id="studyType">
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

      <div>
        <Label htmlFor="studyMajor">Studijní zaměření</Label>
        <Input
          id="studyMajor"
          value={profile.studyMajor || ''}
          onChange={(e) => onChangeProfile({ studyMajor: e.target.value })}
          placeholder="např. Aplikovaná informatika"
        />
      </div>

      <div>
        <Label htmlFor="studyYear">Ročník</Label>
        <Select value={profile.studyYear || ''} onValueChange={(value) => onChangeProfile({ studyYear: value })}>
          <SelectTrigger id="studyYear">
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
    </>
  )
}
