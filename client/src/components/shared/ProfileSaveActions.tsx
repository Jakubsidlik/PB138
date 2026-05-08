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
    <div className="flex justify-end gap-3 mt-4">
      <Button variant="outline" type="button" onClick={onResetProfile}>
        Zahodit změny
      </Button>
      <Button
        type="button"
        disabled={!hasUnsavedChanges || isSavingProfile}
        onClick={onSaveProfile}
      >
        {isSavingProfile ? 'Ukládám...' : 'Uložit'}
      </Button>
    </div>
  )
}
