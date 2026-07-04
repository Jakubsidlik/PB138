import React from 'react'
import { toast } from 'sonner'
import {
  PALETTE_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  userProfileSeed,
} from './data'
import { useAuth } from '@clerk/clerk-react'
import {
  AccentPalette,
  AuthSession,
  Group,
  GroupMember,
  TierImage,
  TierCounts,
  Tier,
  ThemeMode,
  UserProfile,
} from './types'
import {
  readPaletteFromStorage,
  readProfileFromStorage,
  readThemeFromStorage,
} from './storage'

const AUTH_SESSION_STORAGE_KEY = 'pb138-auth-session'

const readAuthSessionFromStorage = (): AuthSession | null => {
  const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const session = parsed as Partial<AuthSession>
    if (
      (typeof session.userId !== 'number' && typeof session.userId !== 'string') ||
      (session.role !== 'REGISTROVANÝ UŽIVATEL' && session.role !== 'ADMIN') ||
      typeof session.fullName !== 'string' ||
      typeof session.email !== 'string'
    ) return null
    return { userId: session.userId, role: session.role, fullName: session.fullName, email: session.email }
  } catch {
    return null
  }
}

export function useDashboardState(fetchAll = false) {
  // ── Theme & Profile ─────────────────────────────────────────────────
  const [themeMode, setThemeMode] = React.useState<ThemeMode>(() => readThemeFromStorage())
  const [accentPalette, setAccentPalette] = React.useState<AccentPalette>(() => readPaletteFromStorage())
  const [profile, setProfile] = React.useState<UserProfile>(userProfileSeed)
  const [savedProfile, setSavedProfile] = React.useState<UserProfile>(userProfileSeed)
  const [authSession, setAuthSession] = React.useState<AuthSession | null>(() => readAuthSessionFromStorage())
  const [authAlertOpen, setAuthAlertOpen] = React.useState(false)
  const [isBanned, setIsBanned] = React.useState(false)
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)
  const [isHydrated, setIsHydrated] = React.useState(false)
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth()

  // ── Car-Y-list State ────────────────────────────────────────────────
  const [groups, setGroups] = React.useState<Group[]>([])
  const [activeGroupId, setActiveGroupId] = React.useState<number | null>(null)
  const [activeGroup, setActiveGroup] = React.useState<Group | null>(null)
  const [groupMembers, setGroupMembers] = React.useState<GroupMember[]>([])
  const [tierCounts, setTierCounts] = React.useState<TierCounts>({ S: 0, A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, unrated: 0 })
  const [unratedImages, setUnratedImages] = React.useState<TierImage[]>([])
  const [tierImages, setTierImages] = React.useState<Record<string, TierImage[]>>({})
  const [activeTier, setActiveTier] = React.useState<Tier | null>(null)

  // ── API fetch helper ────────────────────────────────────────────────
  const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
  const apiFetch = React.useCallback(
    async (input: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      let token = null
      try { token = await getToken() } catch {}
      if (token) headers.set('Authorization', `Bearer ${token}`)
      const url = API_BASE_URL ? `${API_BASE_URL}${input}` : input
      return fetch(url, { cache: 'no-store', ...init, headers })
    },
    [getToken],
  )

  // ── Theme effects ───────────────────────────────────────────────────
  React.useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode)
    if (themeMode === 'dark') {
      document.documentElement.classList.add('theme-dark', 'dark')
      document.body.style.backgroundColor = '#0f0f1a'
    } else {
      document.documentElement.classList.remove('theme-dark', 'dark')
      document.body.style.backgroundColor = '#fafafa'
    }
    const rootEl = document.querySelector('.dashboard-root')
    if (rootEl) {
      rootEl.classList.remove('theme-light', 'theme-dark')
      rootEl.classList.add(`theme-${themeMode}`)
    }
  }, [themeMode])

  React.useEffect(() => {
    localStorage.setItem(PALETTE_STORAGE_KEY, accentPalette)
    const rootEl = document.querySelector('.dashboard-root')
    if (rootEl) {
      rootEl.classList.forEach((cls) => {
        if (cls.startsWith('palette-')) rootEl.classList.remove(cls)
      })
      rootEl.classList.add(`palette-${accentPalette}`)
    }
    document.body.classList.forEach((cls) => {
      if (cls.startsWith('palette-')) document.body.classList.remove(cls)
    })
    document.body.classList.add(`palette-${accentPalette}`)
  }, [accentPalette])

  // ── Auth session persistence ────────────────────────────────────────
  React.useEffect(() => {
    if (authSession) {
      localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(authSession))
      return
    }
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
    setIsHydrated(false)
  }, [authSession])

  // ── Data hydration ──────────────────────────────────────────────────
  React.useEffect(() => {
    if (!isLoaded || isHydrated || !fetchAll) return

    const hydrateData = async () => {
      if (!authSession && !isSignedIn) {
        setIsHydrated(true)
        return
      }

      const localProfile = readProfileFromStorage() ?? userProfileSeed
      let loadedProfile = localProfile
      let loadedGroups: Group[] = []

      try {
        const [profileRes, groupsRes] = await Promise.allSettled([
          apiFetch('/api/profile'),
          apiFetch('/api/groups'),
        ])

        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const serverProfile = await profileRes.value.json()
          setAuthSession({
            userId: serverProfile.id,
            fullName: serverProfile.fullName,
            email: serverProfile.email,
            role: serverProfile.role,
          })
          loadedProfile = serverProfile
        } else if (profileRes.status === 'fulfilled' && profileRes.value.status === 401) {
          setAuthSession(null)
          if (isSignedIn) {
            setIsBanned(true)
            localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
            localStorage.removeItem(PROFILE_STORAGE_KEY)
          }
        }

        if (groupsRes.status === 'fulfilled' && groupsRes.value.ok) {
          const serverGroups = await groupsRes.value.json()
          if (Array.isArray(serverGroups)) loadedGroups = serverGroups
        }
      } catch (e) {
        console.error('Hydration error:', e)
      }

      setProfile(loadedProfile)
      setSavedProfile(loadedProfile)
      setGroups(loadedGroups)
      setIsHydrated(true)
    }

    void hydrateData()
  }, [apiFetch, authSession, isLoaded, isSignedIn, isHydrated, signOut])

  // ── Profile persistence ─────────────────────────────────────────────
  React.useEffect(() => {
    if (!isHydrated || !authSession) return
    if (authSession && (!profile.fullName || !profile.email)) {
      setProfile((prev) => ({
        ...prev,
        fullName: prev.fullName || authSession.fullName || '',
        email: prev.email || authSession.email || '',
      }))
      return
    }
    const { avatarDataUrl: _, ...profileWithoutAvatar } = profile
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileWithoutAvatar))
  }, [profile, isHydrated, authSession])

  // ── Auth helper ─────────────────────────────────────────────────────
  const ensureAuthenticated = () => {
    if (!authSession) {
      setAuthAlertOpen(true)
      return false
    }
    return true
  }

  // ── Profile actions ─────────────────────────────────────────────────
  const onSaveProfile = async () => {
    if (!ensureAuthenticated() || isSavingProfile) return
    setIsSavingProfile(true)
    try {
      const payload = { ...profile }
      if (!payload.fullName) delete (payload as any).fullName
      if (!payload.email) delete (payload as any).email
      const response = await apiFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.ok) setSavedProfile(profile)
    } catch (error) {
      console.error('Chyba při ukládání profilu:', error)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const onChangeProfile = (key: string, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  const onUploadProfileAvatar = (dataUrl: string) => {
    setProfile((prev) => ({ ...prev, avatarDataUrl: dataUrl }))
  }

  const onRemoveProfileAvatar = () => {
    setProfile((prev) => ({ ...prev, avatarDataUrl: null }))
  }

  const resetProfile = () => {
    setProfile(savedProfile)
  }

  const hasUnsavedProfileChanges = JSON.stringify(profile) !== JSON.stringify(savedProfile)

  const clearUserData = () => {
    setGroups([])
    setActiveGroupId(null)
    setActiveGroup(null)
    setGroupMembers([])
    setUnratedImages([])
    setTierImages({})
    setTierCounts({ S: 0, A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, unrated: 0 })
  }

  // ── Groups actions ──────────────────────────────────────────────────
  const refreshGroups = async () => {
    try {
      const res = await apiFetch('/api/groups')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setGroups(data)
      }
    } catch (e) {
      console.error('Failed to refresh groups:', e)
    }
  }

  const createGroup = async (name: string) => {
    if (!ensureAuthenticated()) return
    try {
      const res = await apiFetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        toast.success('Skupina byla vytvořena.')
        await refreshGroups()
      } else {
        const err = await res.json().catch(() => null)
        toast.error(err?.error || 'Nepodařilo se vytvořit skupinu.')
      }
    } catch (e) {
      toast.error('Chyba při vytváření skupiny.')
      console.error('Failed to create group:', e)
    }
  }

  const deleteGroup = async (groupId: number) => {
    if (!ensureAuthenticated()) return
    try {
      const res = await apiFetch(`/api/groups/${groupId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Skupina byla smazána.')
        if (activeGroupId === groupId) {
          setActiveGroupId(null)
          setActiveGroup(null)
        }
        await refreshGroups()
      } else {
        const err = await res.json().catch(() => null)
        toast.error(err?.error || 'Nepodařilo se smazat skupinu.')
      }
    } catch (e) {
      toast.error('Chyba při mazání skupiny.')
    }
  }

  const inviteToGroup = async (groupId: number, email: string) => {
    if (!ensureAuthenticated()) return
    try {
      const res = await apiFetch(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        toast.success('Pozvánka byla odeslána.')
        await refreshGroupMembers(groupId)
        await refreshGroups()
      } else {
        const err = await res.json().catch(() => null)
        toast.error(err?.error || 'Nepodařilo se pozvat uživatele.')
      }
    } catch (e) {
      toast.error('Chyba při odesílání pozvánky.')
    }
  }

  const removeGroupMember = async (groupId: number, userId: number) => {
    if (!ensureAuthenticated()) return
    try {
      const res = await apiFetch(`/api/groups/${groupId}/members/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Člen byl odebrán.')
        await refreshGroupMembers(groupId)
        await refreshGroups()
      } else {
        const err = await res.json().catch(() => null)
        toast.error(err?.error || 'Nepodařilo se odebrat člena.')
      }
    } catch (e) {
      toast.error('Chyba při odebírání člena.')
    }
  }

  const refreshGroupMembers = async (groupId: number) => {
    try {
      const res = await apiFetch(`/api/groups/${groupId}/members`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setGroupMembers(data)
      }
    } catch (e) {
      console.error('Failed to refresh members:', e)
    }
  }

  // ── Image actions ───────────────────────────────────────────────────
  const refreshTierCounts = async (groupId: number) => {
    try {
      const res = await apiFetch(`/api/groups/${groupId}/images/counts`)
      if (res.ok) setTierCounts(await res.json())
    } catch (e) {
      console.error('Failed to refresh tier counts:', e)
    }
  }

  const refreshUnratedImages = async (groupId: number) => {
    try {
      const res = await apiFetch(`/api/groups/${groupId}/images/unrated`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setUnratedImages(data)
      }
    } catch (e) {
      console.error('Failed to refresh unrated images:', e)
    }
  }

  const refreshTierImages = async (groupId: number, tier: Tier) => {
    try {
      const res = await apiFetch(`/api/groups/${groupId}/images?tier=${tier}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setTierImages(prev => ({ ...prev, [tier]: data }))
      }
    } catch (e) {
      console.error('Failed to refresh tier images:', e)
    }
  }

  const loadGroupData = async (groupId: number) => {
    setActiveGroupId(groupId)
    try {
      const [groupRes, membersRes, countsRes, unratedRes] = await Promise.allSettled([
        apiFetch(`/api/groups/${groupId}`),
        apiFetch(`/api/groups/${groupId}/members`),
        apiFetch(`/api/groups/${groupId}/images/counts`),
        apiFetch(`/api/groups/${groupId}/images/unrated`),
      ])

      if (groupRes.status === 'fulfilled' && groupRes.value.ok)
        setActiveGroup(await groupRes.value.json())
      if (membersRes.status === 'fulfilled' && membersRes.value.ok)
        setGroupMembers(await membersRes.value.json())
      if (countsRes.status === 'fulfilled' && countsRes.value.ok)
        setTierCounts(await countsRes.value.json())
      if (unratedRes.status === 'fulfilled' && unratedRes.value.ok)
        setUnratedImages(await unratedRes.value.json())
    } catch (e) {
      console.error('Failed to load group data:', e)
    }
  }

  const uploadImage = async (groupId: number, files: FileList | File[]) => {
    if (!ensureAuthenticated()) return

    const filesArray = files instanceof FileList ? Array.from(files) : files
    if (filesArray.length === 0) return

    for (const file of filesArray) {
      try {
        // Get presigned URL
        const urlRes = await apiFetch(`/api/groups/${groupId}/images/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type || 'image/jpeg' }),
        })
        if (!urlRes.ok) throw new Error('Nepodařilo se získat upload URL.')
        const { uploadUrl, fileKey, fileUrl } = await urlRes.json()

        // Upload to S3 / local
        const s3Res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'image/jpeg' },
          body: file,
        })
        if (!s3Res.ok) throw new Error('Chyba při nahrávání souboru.')

        // Create image record
        await apiFetch(`/api/groups/${groupId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, size: file.size, fileKey, fileUrl }),
        })

        toast.success(`Obrázek "${file.name}" byl nahrán.`)
      } catch (err) {
        console.error(`Chyba při nahrávání ${file.name}:`, err)
        toast.error(`Nepodařilo se nahrát "${file.name}".`)
      }
    }

    await refreshTierCounts(groupId)
    await refreshUnratedImages(groupId)
    await refreshGroups()
  }

  const setImageTier = async (groupId: number, imageId: number, tier: Tier) => {
    if (!ensureAuthenticated()) return
    try {
      const res = await apiFetch(`/api/groups/${groupId}/images/${imageId}/tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      if (res.ok) {
        toast.success(`Obrázek zařazen do tieru ${tier}.`)
        await refreshTierCounts(groupId)
        await refreshUnratedImages(groupId)
        if (activeTier) await refreshTierImages(groupId, activeTier)
      } else {
        const err = await res.json().catch(() => null)
        toast.error(err?.error || 'Nepodařilo se přiřadit tier.')
      }
    } catch (e) {
      toast.error('Chyba při přiřazování tieru.')
    }
  }

  const deleteImage = async (groupId: number, imageId: number) => {
    if (!ensureAuthenticated()) return
    try {
      const res = await apiFetch(`/api/groups/${groupId}/images/${imageId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Obrázek byl smazán.')
        await refreshTierCounts(groupId)
        await refreshUnratedImages(groupId)
        if (activeTier) await refreshTierImages(groupId, activeTier)
      }
    } catch (e) {
      toast.error('Chyba při mazání obrázku.')
    }
  }

    // Comments / Ratings
    const [groupResult, setGroupResult] = React.useState<import('./types').GroupResult | null>(null)
    const [myRatings, setMyRatings] = React.useState<import('./types').ImageRating[]>([])

    const rateImage = async (groupId: number, imageId: number, tier: Tier) => {
      if (!ensureAuthenticated()) return
      try {
        const res = await apiFetch(`/api/groups/${groupId}/images/${imageId}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier }),
        })
        if (res.ok) {
          toast.success(`Osobní hodnocení uloženo: ${tier}`)
          await refreshMyRatings(groupId)
        } else {
          const err = await res.json().catch(() => null)
          toast.error(err?.error || 'Nepodařilo se uložit hodnocení.')
        }
      } catch (e) {
        toast.error('Chyba při ukládání hodnocení.')
      }
    }

    const refreshGroupResult = async (groupId: number) => {
      try {
        const res = await apiFetch(`/api/groups/${groupId}/result`)
        if (res.ok) setGroupResult(await res.json())
      } catch (e) {
        console.error('Failed to load group result', e)
      }
    }

    const refreshMyRatings = async (groupId: number) => {
      try {
        const res = await apiFetch(`/api/groups/${groupId}/my-ratings`)
        if (res.ok) setMyRatings(await res.json())
      } catch (e) {
        console.error('Failed to load my ratings', e)
      }
    }

  return {
    // Theme
    themeMode, setThemeMode,
    accentPalette, setAccentPalette,
    // Auth
    authSession, setAuthSession,
    authAlertOpen, setAuthAlertOpen,
    isBanned, setIsBanned,
    isHydrated,
    // Profile
    profile, setProfile,
    onChangeProfile,
    onUploadProfileAvatar: onUploadProfileAvatar,
    onRemoveProfileAvatar: onRemoveProfileAvatar,
    resetProfile,
    hasUnsavedProfileChanges,
    onSaveProfile,
    isSavingProfile,
    clearUserData,
    // Groups
    groups,
    activeGroupId, setActiveGroupId,
    activeGroup, setActiveGroup,
    groupMembers,
    createGroup,
    deleteGroup,
    inviteToGroup,
    removeGroupMember,
    loadGroupData,
    refreshGroups,
    refreshGroupMembers,
    // Images / Tiers
    tierCounts,
    unratedImages,
    tierImages,
    activeTier, setActiveTier,
    uploadImage,
    setImageTier,
    deleteImage,
    refreshTierCounts,
    refreshUnratedImages,
    refreshTierImages,
    // Ratings & Result
    groupResult,
    myRatings,
    rateImage,
    refreshGroupResult,
    refreshMyRatings,
    apiFetch,
  }
}
