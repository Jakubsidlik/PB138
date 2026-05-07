import { UserProfile } from '../../app/types'
import { Input } from '../ui/input'

type ProfileContactEmailProps = {
  profile: Partial<UserProfile>
  onChangeProfile: (updates: Partial<UserProfile>) => void
}

export function ProfileContactEmail({ profile, onChangeProfile }: ProfileContactEmailProps) {
  return (
    <div className="profile-grid">
      <div className="profile-input-group">
        <label htmlFor="contactEmail">Kontaktní e-mail (pro sdílení souborů)</label>
        <Input
          type="email"
          id="contactEmail"
          value={profile.contactEmail || ''}
          onChange={(e) => onChangeProfile({ contactEmail: e.target.value })}
          placeholder="např. jan.novak@skola.cz"
        />
        <span className="profile-hint">Tento e-mail uvidí ostatní studenti při sdílení dokumentů.</span>
      </div>
    </div>
  )
}
