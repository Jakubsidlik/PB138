import React, { useState, useRef, useEffect } from 'react'
import { Calendar, Home, Files, User, Plus, CheckSquare, BookMarked } from 'lucide-react'
import { MobileNavItem } from '../../app/types'

type MobileBottomNavProps = {
  activeMobileNav: MobileNavItem
  setActiveMobileNav: React.Dispatch<React.SetStateAction<MobileNavItem>>
}

export function MobileBottomNav({ activeMobileNav, setActiveMobileNav }: MobileBottomNavProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleDropdownItemClick = (item: MobileNavItem) => {
    setActiveMobileNav(item)
    setIsDropdownOpen(false)
  }

  const handleNavigationClick = (item: MobileNavItem) => {
    setActiveMobileNav(item)
    setIsDropdownOpen(false)
  }

  // Zavření dropdownu při kliknutí mimo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isDropdownOpen])

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobilní navigace">
      <div className="nav-dropdown-wrapper" ref={dropdownRef}>
        <button
          className={`nav-dropdown-btn ${isDropdownOpen ? 'active' : ''}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-label="Otevřít menu"
          aria-expanded={isDropdownOpen}
        >
          <Plus size={24} />
          <span className="nav-label">Více</span>
        </button>
        {isDropdownOpen && (
          <div className="nav-dropdown-menu">
            <button
              className={activeMobileNav === 'tasks' ? 'active' : ''}
              onClick={() => handleDropdownItemClick('tasks')}
            >
              <CheckSquare size={20} />
              <span>Úkoly</span>
            </button>
            <button
              className={activeMobileNav === 'files' ? 'active' : ''}
              onClick={() => handleDropdownItemClick('files')}
            >
              <Files size={20} />
              <span>Soubory</span>
            </button>
            <button
              className={activeMobileNav === 'study-plan' ? 'active' : ''}
              onClick={() => handleDropdownItemClick('study-plan')}
            >
              <BookMarked size={20} />
              <span>Studijní plán</span>
            </button>
          </div>
        )}
      </div>
      <a
        className={activeMobileNav === 'calendar' ? 'active' : ''}
        href="#calendar"
        onClick={() => handleNavigationClick('calendar')}
      >
        <Calendar size={24} />
        <span className="nav-label">Kalendář</span>
      </a>
      <a
        className={activeMobileNav === 'home' ? 'active' : ''}
        href="#"
        onClick={() => handleNavigationClick('home')}
      >
        <Home size={24} />
        <span className="nav-label">Domů</span>
      </a>
      <a
        className={activeMobileNav === 'profile' ? 'active' : ''}
        href="#profile"
        onClick={() => handleNavigationClick('profile')}
      >
        <User size={24} />
        <span className="nav-label">Profil</span>
      </a>
    </nav>
  )
}
