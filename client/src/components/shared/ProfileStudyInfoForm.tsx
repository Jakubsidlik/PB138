import { UserProfile } from '../../app/types'
import { studyYearOptions, studyTypeOptions } from './profileConstants'

type ProfileStudyInfoFormProps = {
  profile: Partial<UserProfile>
  onChangeProfile: (updates: Partial<UserProfile>) => void
}

export function ProfileStudyInfoForm({ profile, onChangeProfile }: ProfileStudyInfoFormProps) {
  return (
    <>
      <label>
        <span>Škola</span>
        <input
          id="school"
          value={profile.school || ''}
          onChange={(e) => onChangeProfile({ school: e.target.value })}
          placeholder="např. Masarykova Univerzita"
        />
      </label>

      <label>
        <span>Typ studia</span>
        <select value={profile.studyType} onChange={(event) => onChangeProfile({ studyType: event.target.value })}>
          {studyTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Studijní zaměření</span>
        <input
          id="studyMajor"
          value={profile.studyMajor || ''}
          onChange={(e) => onChangeProfile({ studyMajor: e.target.value })}
          placeholder="např. Aplikovaná informatika"
        />
      </label>

      <label>
        <span>Ročník</span>
        <select value={profile.studyYear} onChange={(event) => onChangeProfile({ studyYear: event.target.value })}>
          {studyYearOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}
