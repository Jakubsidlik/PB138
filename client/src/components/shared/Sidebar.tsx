import React from 'react'
import { MobileNavItem, ThemeMode, AccentPalette } from '../../app/types'
import { ThemeSelector } from './ThemeSelector'
import ghostLogo from '../../assets/ghostLogo.jpg'

type SidebarProps = {
  activeMobileNav: MobileNavItem
  setActiveMobileNav: React.Dispatch<React.SetStateAction<MobileNavItem>>
  themeMode: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  accentPalette: AccentPalette
  onPaletteChange: (palette: AccentPalette) => void
  onLogout: () => void
}

export function Sidebar({
  activeMobileNav,
  setActiveMobileNav,
  themeMode,
  onThemeChange,
  accentPalette,
  onPaletteChange,
  onLogout,
}: SidebarProps) {

  return (
    <aside className="sidebar">
      <div className="brand">
        <img 
          src={ghostLogo}
          alt="Lonely Student Logo"
          className="brand-logo"
          //Matěji tu pak logo
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <h1>Lonely Student</h1>
      </div>

      <nav className="menu">
        <a
          className={`menu-item ${activeMobileNav === 'home' ? 'active' : ''}`}
          href="#"
          onClick={() => setActiveMobileNav('home')}
        >
          Hlavní stránka
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

        <div className="menu-theme-selector">
          <ThemeSelector
            currentTheme={themeMode}
            onThemeChange={onThemeChange}
            currentPalette={accentPalette}
            onPaletteChange={onPaletteChange}
          />
        </div>

        <button type="button" className="menu-logout-btn" onClick={onLogout}>
          Odhlásit se
        </button>
      </nav>
    </aside>
  )
}
