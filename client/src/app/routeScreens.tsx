
import { useParams } from '@tanstack/react-router'
import { GroupsListScreen } from '../screen/GroupsListScreen'
import { TierListScreen } from '../screen/TierListScreen'
import { TierGalleryScreen } from '../screen/TierGalleryScreen'
import { DesktopProfileScreen } from '../screen/ProfileScreen'
import { useDashboard } from './DashboardContext'
import type { Tier } from './types'

export function HomeComponent() {
  return <GroupsListScreen />
}

export function GroupComponent() {
  const params = useParams({ strict: false }) as any
  const groupId = parseInt(params.groupId, 10)

  if (isNaN(groupId)) {
    return <div className="p-8 text-center text-red-500">Neplatné ID skupiny</div>
  }

  return <TierListScreen groupId={groupId} />
}

export function TierGalleryComponent() {
  const params = useParams({ strict: false }) as any
  const groupId = parseInt(params.groupId, 10)
  const tier = params.tier as Tier

  if (isNaN(groupId) || !['S', 'A', 'B', 'C', 'D', 'E', 'F'].includes(tier)) {
    return <div className="p-8 text-center text-red-500">Neplatné parametry</div>
  }

  return <TierGalleryScreen groupId={groupId} tier={tier} />
}

export function ProfileComponent() {
  const state = useDashboard()

  const handleChangeProfile = (updates: Record<string, any>) => {
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        state.onChangeProfile(key, String(value ?? ''))
      }
    }
  }

  const handleUploadAvatar = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      state.onUploadProfileAvatar(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  return (
    <DesktopProfileScreen
      profile={state.profile}
      isHydrated={state.isHydrated}
      authSession={state.authSession}
      onChangeProfile={handleChangeProfile}
      onUploadAvatar={handleUploadAvatar}
      onRemoveAvatar={state.onRemoveProfileAvatar}
      onResetProfile={state.resetProfile}
      themeMode={state.themeMode}
      onThemeChange={state.setThemeMode}
      accentPalette={state.accentPalette}
      onPaletteChange={state.setAccentPalette}
      hasUnsavedChanges={state.hasUnsavedProfileChanges}
      onSaveProfile={state.onSaveProfile}
      isSavingProfile={state.isSavingProfile}
    />
  )
}

export const HomeRouteScreen = HomeComponent
export const GroupRouteScreen = GroupComponent
export const TierGalleryRouteScreen = TierGalleryComponent
export const ProfileRouteScreen = ProfileComponent
