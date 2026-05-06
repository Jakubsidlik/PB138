import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Calendar, Home, Files, User, Plus, CheckSquare, BookMarked } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'

export function MobileBottomNav() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleNavigateTo = (path: string) => {
    router.navigate({ to: path as any })
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
        <Button
          className={`nav-dropdown-btn ${isDropdownOpen ? 'active' : ''}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-label="Otevřít menu"
          aria-expanded={isDropdownOpen}
        >
          <Plus size={24} />
          <span className="nav-label">Více</span>
        </Button>
        {isDropdownOpen && (
          <div className="nav-dropdown-menu">
<<<<<<< Updated upstream
            <button
              onClick={() => handleNavigateTo('/tasks')}
            >
              <CheckSquare size={20} />
              <span>Úkoly</span>
            </button>
            <button
              onClick={() => handleNavigateTo('/files')}
            >
              <Files size={20} />
              <span>Soubory</span>
            </button>
            <button
              onClick={() => handleNavigateTo('/study')}
=======
            <Button
              className={activeMobileNav === 'tasks' ? 'active' : ''}
              onClick={() => handleDropdownItemClick('tasks')}
            >
              <CheckSquare size={20} />
              <span>Úkoly</span>
            </Button>
            <Button
              className={activeMobileNav === 'files' ? 'active' : ''}
              onClick={() => handleDropdownItemClick('files')}
            >
              <Files size={20} />
              <span>Soubory</span>
            </Button>
            <Button
              className={activeMobileNav === 'study-plan' ? 'active' : ''}
              onClick={() => handleDropdownItemClick('study-plan')}
>>>>>>> Stashed changes
            >
              <BookMarked size={20} />
              <span>Studijní plán</span>
            </Button>
          </div>
        )}
      </div>
      <button
        onClick={() => handleNavigateTo('/calendar')}
      >
        <Calendar size={24} />
        <span className="nav-label">Kalendář</span>
      </button>
      <button
        onClick={() => handleNavigateTo('/')}
      >
        <Home size={24} />
        <span className="nav-label">Domů</span>
      </button>
      <button
        onClick={() => handleNavigateTo('/profile')}
      >
        <User size={24} />
        <span className="nav-label">Profil</span>
      </button>
    </nav>
  )
}


