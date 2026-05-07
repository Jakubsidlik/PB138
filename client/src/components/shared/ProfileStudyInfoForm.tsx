import { UserProfile } from '../../app/types'
import { studyYearOptions, studyTypeOptions } from './profileConstants'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

type ProfileStudyInfoFormProps = {
  profile: Partial<UserProfile>
  onChangeProfile: (updates: Partial<UserProfile>) => void
}

export function ProfileStudyInfoForm({ profile, onChangeProfile }: ProfileStudyInfoFormProps) {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="school" className="text-sm font-medium">Škola</label>
        <Input
          id="school"
          value={profile.school || ''}
          onChange={(e) => onChangeProfile({ school: e.target.value })}
          placeholder="např. Masarykova Univerzita"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Typ studia</label>
        <Select 
          value={profile.studyType} 
          onValueChange={(value) => onChangeProfile({ studyType: value })}
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
      </div>

      <div className="space-y-2">
        <label htmlFor="studyMajor" className="text-sm font-medium">Studijní zaměření</label>
        <Input
          id="studyMajor"
          value={profile.studyMajor || ''}
          onChange={(e) => onChangeProfile({ studyMajor: e.target.value })}
          placeholder="např. Aplikovaná informatika"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Ročník</label>
        <Select 
          value={profile.studyYear} 
          onValueChange={(value) => onChangeProfile({ studyYear: value })}
        >
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
    </>
  )
}
