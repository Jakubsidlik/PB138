import { ThemeMode, AccentPalette } from '../../app/types'
import { ThemeSelector } from './ThemeSelector'

type ProfileThemeSectionProps = {
  themeMode: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  accentPalette: AccentPalette
  onPaletteChange: (palette: AccentPalette) => void
}

export function ProfileThemeSection({
  themeMode,
  onThemeChange,
  accentPalette,
  onPaletteChange,
}: ProfileThemeSectionProps) {
  return (
    <ThemeSelector
      currentTheme={themeMode}
      onThemeChange={onThemeChange}
      currentPalette={accentPalette}
      onPaletteChange={onPaletteChange}
    />
  )
}
