import React from 'react'
import { ThemeMode, AccentPalette } from '../../app/types'
import { Button } from '../ui/button'

type ThemeSelectorProps = {
  currentTheme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  currentPalette: AccentPalette
  onPaletteChange: (palette: AccentPalette) => void
}

const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: '☀️ Světlý režim' },
  { value: 'dark', label: '🌙 Tmavý režim' },
]

const paletteOptions: { value: AccentPalette; label: string }[] = [
  { value: 'blue', label: '🔵 Modrá' },
  { value: 'emerald', label: '🟢 Smaragdová' },
  { value: 'rose', label: '🔴 Červená' },
  { value: 'amber', label: '🟠 Oranžová' },
  { value: 'mono', label: '⚪ Šedá' },
]

export function ThemeSelector({
  currentTheme,
  onThemeChange,
  currentPalette,
  onPaletteChange,
}: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="theme-selector">
      <Button
        type="button"
        variant="outline"
        className="theme-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Otevřít nastavení tématu"
      >
        <span>Nastavení vzhledu</span>
        <span aria-hidden="true">{isOpen ? '✕' : '›'}</span>
      </Button>

      {isOpen && (
        <div className="theme-selector-panel">
          <section className="theme-selector-section">
            <h4>Režim</h4>
            <div className="theme-options">
              {themeOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={currentTheme === option.value ? 'default' : 'outline'}
                  className={`theme-option ${currentTheme === option.value ? 'active' : ''}`}
                  onClick={() => {
                    onThemeChange(option.value)
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </section>

          <section className="theme-selector-section">
            <h4>Barva</h4>
            <div className="palette-options">
              {paletteOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={currentPalette === option.value ? 'default' : 'outline'}
                  size="icon"
                  className={`palette-option palette-${option.value} ${currentPalette === option.value ? 'active' : ''}`}
                  onClick={() => {
                    onPaletteChange(option.value)
                  }}
                  title={option.label}
                >
                  <span className="palette-dot" />
                </Button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
