import { useEffect, useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { BookMarked, Calendar, CheckSquare, Files, Home, Plus, User } from 'lucide-react'

import { Button } from '../../components/ui/button'

export function MobileBottomNav() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleNavigateTo = (path: string) => {
    router.navigate({ to: path as any })
    setIsDropdownOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (!isDropdownOpen) {
      return undefined
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobilní navigace">
      <div className="nav-dropdown-wrapper" ref={dropdownRef}>
        <Button
          type="button"
          variant="ghost"
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
            <Button
              type="button"
              variant="ghost"
              className="nav-dropdown-item"
              onClick={() => handleNavigateTo('/tasks')}
            >
              <CheckSquare size={20} />
              <span>Úkoly</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="nav-dropdown-item"
              onClick={() => handleNavigateTo('/files')}
            >
              <Files size={20} />
              <span>Soubory</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="nav-dropdown-item"
              onClick={() => handleNavigateTo('/study')}
            >
              <BookMarked size={20} />
              <span>Studijní plán</span>
            </Button>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        className="nav-item"
        onClick={() => handleNavigateTo('/calendar')}
      >
        <Calendar size={24} />
        <span className="nav-label">Kalendář</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="nav-item"
        onClick={() => handleNavigateTo('/')}
      >
        <Home size={24} />
        <span className="nav-label">Domů</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="nav-item"
        onClick={() => handleNavigateTo('/profile')}
      >
        <User size={24} />
        <span className="nav-label">Profil</span>
      </Button>
    </nav>
  )
}