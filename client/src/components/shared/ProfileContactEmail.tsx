import { UserProfile } from '../../app/types'
import { Input } from '../ui/input'

type ProfileContactEmailProps = {
  profile: Partial<UserProfile>
  onChangeProfile: (updates: Partial<UserProfile>) => void
}

export function ProfileContactEmail({ profile, onChangeProfile }: ProfileContactEmailProps) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contactEmail" className="text-sm font-medium">Kontaktní e-mail (pro sdílení souborů)</label>
        <Input
          type="email"
          id="contactEmail"
          value={profile.contactEmail || ''}
          onChange={(e) => onChangeProfile({ contactEmail: e.target.value })}
          placeholder="např. jan.novak@skola.cz"
        />
        <span className="text-[0.8rem] text-muted-foreground">Tento e-mail uvidí ostatní studenti při sdílení dokumentů.</span>
      </div>
    </div>
  )
}
