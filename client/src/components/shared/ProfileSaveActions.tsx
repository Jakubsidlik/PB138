import { Button } from '../ui/button'

type ProfileSaveActionsProps = {
  hasUnsavedChanges: boolean
  isSavingProfile: boolean
  onResetProfile: () => void
  onSaveProfile: () => void
}

export function ProfileSaveActions({
  hasUnsavedChanges,
  isSavingProfile,
  onResetProfile,
  onSaveProfile,
}: ProfileSaveActionsProps) {
  return (
    <div className="profile-actions-row">
      <Button type="button" className="secondary" onClick={onResetProfile}>
        Zahodit změny
      </Button>
      <Button
        type="button"
        className="primary"
        disabled={!hasUnsavedChanges || isSavingProfile}
        onClick={onSaveProfile}
      >
        {isSavingProfile ? 'Ukládám...' : 'Uložit'}
      </Button>
    </div>
  )
}
