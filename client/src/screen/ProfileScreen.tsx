import React from 'react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { AuthSession, UserProfile, ThemeMode, AccentPalette } from '../app/types'
import { AvatarPreview } from '../components/shared/profile/AvatarPreview'
import { HiddenFileInput } from '../components/shared/files/HiddenFileInput'
import { ProfileAuthInfo } from '../components/shared/profile/ProfileAuthInfo'
import { ProfileStudyInfoForm } from '../components/shared/profile/ProfileStudyInfoForm'
import { ProfileThemeSection } from '../components/shared/profile/ProfileThemeSection'
import { ProfileSaveActions } from '../components/shared/profile/ProfileSaveActions'

type DesktopProfileScreenProps = {
  profile: UserProfile
  authSession: AuthSession | null
  onChangeProfile: (updates: Partial<UserProfile>) => void
  onUploadAvatar: (files: FileList | null) => void
  onRemoveAvatar: () => void
  onResetProfile: () => void
  themeMode: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  accentPalette: AccentPalette
  onPaletteChange: (palette: AccentPalette) => void
  hasUnsavedChanges: boolean
  onSaveProfile: () => void
  isSavingProfile: boolean
}

export function DesktopProfileScreen({
  profile,
  authSession,
  onChangeProfile,
  onUploadAvatar,
  onRemoveAvatar,
  onResetProfile,
  themeMode,
  onThemeChange,
  accentPalette,
  onPaletteChange,
  hasUnsavedChanges,
  onSaveProfile,
  isSavingProfile,
}: DesktopProfileScreenProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  const [draftThemeMode, setDraftThemeMode] = React.useState(themeMode)
  const [draftAccentPalette, setDraftAccentPalette] = React.useState(accentPalette)

  React.useEffect(() => {
    setDraftThemeMode(themeMode)
  }, [themeMode])

  React.useEffect(() => {
    setDraftAccentPalette(accentPalette)
  }, [accentPalette])

  const hasUnsavedThemeChanges = draftThemeMode !== themeMode || draftAccentPalette !== accentPalette
  const totalHasUnsavedChanges = hasUnsavedChanges || hasUnsavedThemeChanges

  const handleSaveProfile = () => {
    if (draftThemeMode !== themeMode) {
      onThemeChange(draftThemeMode)
    }
    if (draftAccentPalette !== accentPalette) {
      onPaletteChange(draftAccentPalette)
    }
    if (hasUnsavedChanges) {
      onSaveProfile()
    }
  }

  const handleResetProfile = () => {
    setDraftThemeMode(themeMode)
    setDraftAccentPalette(accentPalette)
    onResetProfile()
  }

  return (
    <section className="flex flex-col gap-6 w-full px-8 pt-6 pb-10" id="desktop-profile">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Nastavení profilu</h2>
        <p className="text-muted-foreground">Spravuj profilový obrázek, osobní údaje a studijní informace</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-xl border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Profilová fotka</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
            <div className="relative shrink-0">
              <AvatarPreview avatarDataUrl={profile.avatarDataUrl} fullName={profile.fullName} />
            </div>

            <div className="flex flex-col gap-4 text-center sm:text-left w-full sm:mt-4">
              <p className="text-sm text-muted-foreground">Nahraj JPG nebo PNG (max 5MB) nebo odeber současný avatar.</p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start mt-2">
                <Button 
                  type="button" 
                  className="bg-[var(--accent)] text-[var(--text-contrast)] hover:opacity-90 shadow-md hover:shadow-lg transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Nahrát novou fotku
                </Button>
                <Button type="button" variant="outline" onClick={onRemoveAvatar}>
                  Odebrat
                </Button>
              </div>
              <HiddenFileInput
                inputRef={fileInputRef}
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={onUploadAvatar}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Registrovaný uživatel</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileAuthInfo authSession={authSession} />
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Studijní informace</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <ProfileStudyInfoForm profile={profile} onChangeProfile={onChangeProfile} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Vzhled</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileThemeSection
              themeMode={draftThemeMode}
              onThemeChange={setDraftThemeMode}
              accentPalette={draftAccentPalette}
              onPaletteChange={setDraftAccentPalette}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <ProfileSaveActions
          hasUnsavedChanges={totalHasUnsavedChanges}
          isSavingProfile={isSavingProfile}
          onResetProfile={handleResetProfile}
          onSaveProfile={handleSaveProfile}
        />
      </div>
    </section>
  )
}
