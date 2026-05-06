import { UserProfile } from '../../app/types'
import { studyYearOptions, studyTypeOptions } from './profileConstants'

type ProfileStudyInfoFormProps = {
  profile: UserProfile
  onChangeProfile: (field: keyof Omit<UserProfile, 'avatarDataUrl'>, value: string) => void
}

export function ProfileStudyInfoForm({ profile, onChangeProfile }: ProfileStudyInfoFormProps) {
  return (
    <>
      <label>
        <span>Škola</span>
        <input
          type="text"
          value={profile.school}
          onChange={(event) => onChangeProfile('school', event.target.value)}
        />
      </label>

      <label>
        <span>Typ studia</span>
        <select value={profile.studyType} onChange={(event) => onChangeProfile('studyType', event.target.value)}>
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
          type="text"
          value={profile.studyMajor}
          onChange={(event) => onChangeProfile('studyMajor', event.target.value)}
        />
      </label>

      <label>
        <span>Ročník</span>
        <select value={profile.studyYear} onChange={(event) => onChangeProfile('studyYear', event.target.value)}>
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
