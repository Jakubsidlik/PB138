import React from 'react'
import { MobileNavItem } from '../../app/types'

type MobileBottomNavProps = {
  activeMobileNav: MobileNavItem
  setActiveMobileNav: React.Dispatch<React.SetStateAction<MobileNavItem>>
}

export function MobileBottomNav({ activeMobileNav, setActiveMobileNav }: MobileBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobilní navigace">
      <a className={activeMobileNav === 'home' ? 'active' : ''} href="#" onClick={() => setActiveMobileNav('home')}>
        <span className="nav-icon" aria-hidden="true">🏠</span>
        <span className="nav-label">Domů</span>
      </a>
      <a
        className={activeMobileNav === 'calendar' ? 'active' : ''}
        href="#calendar"
        onClick={() => setActiveMobileNav('calendar')}
      >
        <span className="nav-icon" aria-hidden="true">📅</span>
        <span className="nav-label">Kalendář</span>
      </a>
      <a
        className={activeMobileNav === 'subjects' ? 'active' : ''}
        href="#subjects"
        onClick={() => setActiveMobileNav('subjects')}
      >
        <span className="nav-icon" aria-hidden="true">📚</span>
        <span className="nav-label">Předměty</span>
      </a>
      <a className={activeMobileNav === 'files' ? 'active' : ''} href="#files" onClick={() => setActiveMobileNav('files')}>
        <span className="nav-icon" aria-hidden="true">📁</span>
        <span className="nav-label">Soubory</span>
      </a>
    </nav>
  )
}
