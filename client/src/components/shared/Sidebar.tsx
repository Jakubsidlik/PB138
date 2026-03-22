import React from 'react'
import { AccentPalette, MobileNavItem, ThemeMode } from '../../app/types'

type SidebarProps = {
  activeMobileNav: MobileNavItem
  setActiveMobileNav: React.Dispatch<React.SetStateAction<MobileNavItem>>
  accentPalette: AccentPalette
  setAccentPalette: React.Dispatch<React.SetStateAction<AccentPalette>>
  themeMode: ThemeMode
  setThemeMode: React.Dispatch<React.SetStateAction<ThemeMode>>
}

const paletteOptions: Array<{ value: AccentPalette; label: string }> = [
  { value: 'blue', label: 'Modrá' },
  { value: 'green', label: 'Zelená' },
  { value: 'purple', label: 'Fialová' },
  { value: 'pink', label: 'Růžová' },
  { value: 'red', label: 'Červená' },
  { value: 'brown', label: 'Hnědá' },
  { value: 'orange', label: 'Oranžová' },
  { value: 'cyan', label: 'Tyrkysová' },
  { value: 'mono', label: 'Monochromatická' },
  { value: 'yellow', label: 'Žlutá' },
]

export function Sidebar({
  activeMobileNav,
  setActiveMobileNav,
  accentPalette,
  setAccentPalette,
  themeMode,
  setThemeMode,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">🎓</div>
        <div>
          <h1>StudentHub</h1>
          <p>Academic v2.0</p>
        </div>
      </div>

      <nav className="menu">
        <a
          className={`menu-item ${activeMobileNav === 'home' ? 'active' : ''}`}
          href="#"
          onClick={() => setActiveMobileNav('home')}
        >
          Dashboard
        </a>
        <a
          className={`menu-item ${activeMobileNav === 'calendar' ? 'active' : ''}`}
          href="#calendar"
          onClick={() => setActiveMobileNav('calendar')}
        >
          Kalendář
        </a>
        <a
          className={`menu-item ${activeMobileNav === 'subjects' ? 'active' : ''}`}
          href="#subjects"
          onClick={() => setActiveMobileNav('subjects')}
        >
          Předměty
        </a>
        <a
          className={`menu-item ${activeMobileNav === 'files' ? 'active' : ''}`}
          href="#files"
          onClick={() => setActiveMobileNav('files')}
        >
          Soubory
        </a>
        <a
          className={`menu-item ${activeMobileNav === 'profile' ? 'active' : ''}`}
          href="#profile"
          onClick={() => setActiveMobileNav('profile')}
        >
          Profil
        </a>
      </nav>

      <section className="sidebar-theme-panel" aria-label="Motivy">
        <h3>Motivy</h3>

        <label htmlFor="sidebar-palette-select">Barva motivu</label>
        <select
          id="sidebar-palette-select"
          value={accentPalette}
          onChange={(event) => setAccentPalette(event.target.value as AccentPalette)}
        >
          {paletteOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="sidebar-theme-mode-switch">
          <button
            type="button"
            className={themeMode === 'light' ? 'active' : ''}
            onClick={() => setThemeMode('light')}
          >
            Světlý
          </button>
          <button
            type="button"
            className={themeMode === 'dark' ? 'active' : ''}
            onClick={() => setThemeMode('dark')}
          >
            Tmavý
          </button>
        </div>
      </section>

      <div className="storage-card">
        <p className="storage-title">Storage Usage</p>
        <div className="storage-bar">
          <div className="storage-progress" />
        </div>
        <p className="storage-caption">6.5GB z 10GB použito</p>
      </div>
    </aside>
  )
}
