import React from 'react'
import { AccentPalette, MobileNavItem, ThemeMode } from '../../app/types'

type TopbarProps = {
  isCalendarScreen: boolean
  isFilesScreen: boolean
  isSubjectsScreen: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  setActiveMobileNav: React.Dispatch<React.SetStateAction<MobileNavItem>>
  accentPalette: AccentPalette
  setAccentPalette: React.Dispatch<React.SetStateAction<AccentPalette>>
  themeMode: ThemeMode
  setThemeMode: React.Dispatch<React.SetStateAction<ThemeMode>>
}

export function Topbar({
  isCalendarScreen,
  isFilesScreen,
  isSubjectsScreen,
  fileInputRef,
  setActiveMobileNav,
  accentPalette,
  setAccentPalette,
  themeMode,
  setThemeMode,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-mobile">
        {isCalendarScreen ? (
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
            {isFilesScreen ? <div className="mobile-avatar files-avatar">📂</div> : <div className="mobile-avatar">JK</div>}
            <div>
              <p>{isFilesScreen ? 'File Manager' : 'Vítej zpět,'}</p>
              <h1>{isFilesScreen ? 'Organization Files' : 'Jakub Kowalski'}</h1>
            </div>
          </div>
        )}

        {isSubjectsScreen || isCalendarScreen ? null : isFilesScreen ? (
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
          <button type="button" className="mobile-notification" aria-label="Notifikace">
            🔔
          </button>
        )}
      </div>

      <div className="topbar-desktop">
        <input className="search" placeholder="Hledat úkoly, poznámky nebo soubory..." type="text" />
        <div className="appearance-controls">
          <label htmlFor="palette-select">Paleta</label>
          <select
            id="palette-select"
            value={accentPalette}
            onChange={(e) => setAccentPalette(e.target.value as AccentPalette)}
          >
            <option value="blue">Modrá</option>
            <option value="emerald">Smaragdová</option>
            <option value="violet">Fialová</option>
            <option value="rose">Růžová</option>
          </select>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))}
          >
            {themeMode === 'light' ? 'Tmavý režim' : 'Světlý režim'}
          </button>
        </div>
        <div className="profile">
          <div>
            <p className="name">Jakub Kowalski</p>
            <p className="subtitle">Computer Science Major</p>
          </div>
          <div className="avatar">JK</div>
        </div>
      </div>
    </header>
  )
}
