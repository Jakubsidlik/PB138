import React from 'react'
import { AccentPalette, MobileNavItem, ThemeMode } from '../../app/types'

type TopbarProps = {
  isCalendarScreen: boolean
  isFilesScreen: boolean
  isSubjectsScreen: boolean
  isProfileScreen: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  setActiveMobileNav: React.Dispatch<React.SetStateAction<MobileNavItem>>
  accentPalette: AccentPalette
  setAccentPalette: React.Dispatch<React.SetStateAction<AccentPalette>>
  themeMode: ThemeMode
  setThemeMode: React.Dispatch<React.SetStateAction<ThemeMode>>
  profileName: string
  profileSubtitle: string
  profileAvatarDataUrl: string | null
  onOpenProfile: () => void
}

export function Topbar({
  isCalendarScreen,
  isFilesScreen,
  isSubjectsScreen,
  isProfileScreen,
  fileInputRef,
  setActiveMobileNav,
  accentPalette,
  setAccentPalette,
  themeMode,
  setThemeMode,
  profileName,
  profileSubtitle,
  profileAvatarDataUrl,
  onOpenProfile,
}: TopbarProps) {
  const [isMobileThemePanelOpen, setIsMobileThemePanelOpen] = React.useState(false)

  const paletteOptions: Array<{ value: AccentPalette; label: string }> = [
    { value: 'blue', label: 'Modrá' },
    { value: 'emerald', label: 'Smaragdová' },
    { value: 'violet', label: 'Fialová' },
    { value: 'rose', label: 'Růžová' },
    { value: 'red', label: 'Červená' },
    { value: 'amber', label: 'Žlutá' },
    { value: 'orange', label: 'Oranžová' },
    { value: 'cyan', label: 'Tyrkysová' },
    { value: 'mono', label: 'Monochromatická' },
  ]

  const initials =
    profileName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'U'

  return (
    <header className="topbar">
      <div className="topbar-mobile">
        {isProfileScreen ? (
          <>
            <button
              type="button"
              className="mobile-header-icon"
              aria-label="Zpět"
              onClick={() => {
                setActiveMobileNav('home')
                window.location.hash = ''
              }}
            >
              ←
            </button>
            <h2 className="mobile-subjects-title">Nastavení profilu</h2>
            <button type="button" className="mobile-header-icon mobile-header-icon-primary" aria-label="Menu">
              ⋮
            </button>
          </>
        ) : isCalendarScreen ? (
          <>
            <button
              type="button"
              className="mobile-header-icon"
              aria-label="Zpět"
              onClick={() => {
                setActiveMobileNav('home')
                window.location.hash = ''
              }}
            >
              ←
            </button>
            <h2 className="mobile-subjects-title">Kalendář</h2>
            <button type="button" className="mobile-header-icon" aria-label="Hledat">
              🔎
            </button>
          </>
        ) : isSubjectsScreen ? (
          <>
            <button type="button" className="mobile-header-icon" aria-label="Menu">
              ☰
            </button>
            <h2 className="mobile-subjects-title">Moje předměty</h2>
            <button type="button" className="mobile-header-icon mobile-header-icon-primary" aria-label="Profil">
              👤
            </button>
          </>
        ) : (
          <div className="mobile-greeting">
            {isFilesScreen ? <div className="mobile-avatar files-avatar">📂</div> : <div className="mobile-avatar">{initials}</div>}
            <div>
              <p>{isFilesScreen ? 'File Manager' : 'Vítej zpět,'}</p>
              <h1>{isFilesScreen ? 'Organization Files' : profileName}</h1>
            </div>
          </div>
        )}

        {isSubjectsScreen || isCalendarScreen || isProfileScreen ? null : isFilesScreen ? (
          <div className="mobile-files-actions">
            <button type="button" className="mobile-notification" aria-label="Hledat soubory">
              🔎
            </button>
            <button
              type="button"
              className="mobile-notification mobile-notification-primary"
              aria-label="Přidat soubor"
              onClick={() => fileInputRef.current?.click()}
            >
              ＋
            </button>
          </div>
        ) : (
          <div className="mobile-home-actions">
            <button type="button" className="mobile-notification" aria-label="Notifikace">
              🔔
            </button>
            <button
              type="button"
              className="mobile-notification"
              aria-label="Nastavení motivu"
              onClick={() => setIsMobileThemePanelOpen((prev) => !prev)}
            >
              ⚙️
            </button>
            <button type="button" className="mobile-notification" aria-label="Profil" onClick={onOpenProfile}>
              👤
            </button>
          </div>
        )}
      </div>

      {!isSubjectsScreen && !isCalendarScreen && !isFilesScreen && !isProfileScreen && isMobileThemePanelOpen ? (
        <div className="mobile-theme-panel" aria-label="Výběr motivu">
          <h3>Motivy</h3>
          <label htmlFor="mobile-palette-select">Barva motivu</label>
          <select
            id="mobile-palette-select"
            value={accentPalette}
            onChange={(event) => setAccentPalette(event.target.value as AccentPalette)}
          >
            {paletteOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="mobile-theme-mode-switch" role="group" aria-label="Režim zobrazení">
            <button
              type="button"
              className={themeMode === 'light' ? 'active' : ''}
              onClick={() => setThemeMode('light')}
            >
              Světlý režim
            </button>
            <button
              type="button"
              className={themeMode === 'dark' ? 'active' : ''}
              onClick={() => setThemeMode('dark')}
            >
              Tmavý režim
            </button>
          </div>
        </div>
      ) : null}

      <div className="topbar-desktop">
        <input className="search" placeholder="Hledat úkoly, poznámky nebo soubory..." type="text" />
        <button type="button" className="profile" onClick={onOpenProfile}>
          <div>
            <p className="name">{profileName}</p>
            <p className="subtitle">{profileSubtitle}</p>
          </div>
          <div className="avatar">
            {profileAvatarDataUrl ? (
              <img src={profileAvatarDataUrl} alt="Profil" className="topbar-avatar-image" />
            ) : (
              initials
            )}
          </div>
        </button>
      </div>
    </header>
  )
}
