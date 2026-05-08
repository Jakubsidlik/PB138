import React from 'react'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { AuthSession, UserProfile, ThemeMode, AccentPalette } from '../app/types'
import { AvatarPreview } from '../components/shared/AvatarPreview'
import { HiddenFileInput } from '../components/shared/HiddenFileInput'
import { ProfileAuthInfo } from '../components/shared/ProfileAuthInfo'
import { ProfileStudyInfoForm } from '../components/shared/ProfileStudyInfoForm'
import { ProfileThemeSection } from '../components/shared/ProfileThemeSection'
import { ProfileSaveActions } from '../components/shared/ProfileSaveActions'

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

  return (
    <section className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-10" id="desktop-profile">
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
                  className="bg-[#242f49] text-white hover:bg-[#161e2f] shadow-md hover:shadow-lg transition-all"
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
              themeMode={themeMode}
              onThemeChange={onThemeChange}
              accentPalette={accentPalette}
              onPaletteChange={onPaletteChange}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <ProfileSaveActions
          hasUnsavedChanges={hasUnsavedChanges}
          isSavingProfile={isSavingProfile}
          onResetProfile={onResetProfile}
          onSaveProfile={onSaveProfile}
        />
      </div>
    </section>
  )
}
