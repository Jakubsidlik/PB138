# 🎨 Barevné Schéma - Lonely Student

## Primární Paleta

### Barvy
- **#242f49** — Primární tmavá modrá (tlačítka, aktivní prvky, text)
- **#161e2f** — Sekundární velmi tmavá modrá (pozadí, hranice, gradientní pozadí)
- **#fffdf6** — Světlá smetanová (pozadí, text na tmavém)

---

## Režimy

### 💡 Světlý Režim (Theme Light)
```
Pozadí hlavní:      #fffdf6 (smetanová)
Pozadí sidebar:     #fffdf6 (smetanová)
Pozadí karty:       #ffffff (bílá)
Pozadí input:       #faf9f7 (velmi světlá)

Text primární:      #242f49 (tmavá modrá)
Text sekundární:    #6b7684 (málo sytý šedý)

Tlačítka:          
  - bg: #242f49
  - text: #fffdf6
  - hover: shadow

Accent:            #242f49
Borders:           #e5e3e0 (velmi světlá)
Danger/Error:      #d32f2f (červená)
```

### 🌙 Tmavý Režim (Theme Dark)
```
Pozadí hlavní:      #161e2f (velmi tmavá)
Pozadí sidebar:     #161e2f (velmi tmavá)
Pozadí karty:       #1f2a3d (o něco světlejší)
Pozadí input:       #0f1620 (nejsilnější tlumení)

Text primární:      #fffdf6 (smetanová)
Text sekundární:    #b0b8c0 (světlý šedý)

Tlačítka:
  - bg: #242f49 (primární tmavá)
  - text: #fffdf6
  - hover: shadow

Accent:            #fffdf6
Borders:           #242f49
Danger/Error:      #e53935 (červená)
```

---

## Komponenty

### 🔘 Tlačítka
**Light Mode:**
- Background: #242f49
- Text: #fffdf6
- Hover: drop-shadow 0 5px 15px rgba(36, 47, 73, 0.4)
- Active: scale(0.95)

**Dark Mode:**
- Background: #242f49
- Text: #fffdf6
- Hover: drop-shadow 0 5px 15px rgba(36, 47, 73, 0.4)
- Active: scale(0.95)

### 🎛️ Input Pole
- Border: 1px solid var(--border-color)
- Background: var(--bg-input)
- Text: var(--text-main)
- Focus: outline: none, background slightly darker

### 📝 Formuláře (AuthScreen)
**Pozadí:**
- Vrstva 1: linear-gradient(to right, #242f49, #161e2f)
- Vrstva 2: #fffdf6 (formulář)

**Text:**
- H1: #242f49
- Ostatní text: #6b7684 (light), #fffdf6 (dark)

**Chybové stavy:**
- Text: #d32f2f (light), #e53935 (dark)
- Pozadí: rgba(211, 47, 47, 0.1)
- Border-left: 4px solid

### 📌 Sidebar
- Background: var(--bg-sidebar)
- Border-right: 1px solid var(--border-color)
- Menu items:
  - Text: var(--text-main)
  - Active: highlight s var(--accent-soft)

### 🔝 Topbar
- Background: var(--bg-topbar) s transparentností
- Border: 1px solid var(--border-color)
- Shadow na obsahu níže

---

## CSS Proměnné

### Light Mode
```css
.dashboard-root {
  --bg-main: #fffdf6;
  --bg-sidebar: #fffdf6;
  --bg-topbar: rgba(255, 253, 246, 0.95);
  --bg-card: #ffffff;
  --bg-subtle: #faf9f7;
  --bg-soft: #f5f3f0;
  --bg-input: #faf9f7;
  --text-main: #242f49;
  --text-muted: #6b7684;
  --text-contrast: #fffdf6;
  --border-color: #e5e3e0;
  --border-soft: #f0ede8;
  --accent: #242f49;
  --accent-soft: #e8eef5;
  --accent-soft-strong: #d1d9e8;
  --accent-text: #242f49;
  --danger: #d32f2f;
}
```

### Dark Mode
```css
.dashboard-root.theme-dark {
  --bg-main: #161e2f;
  --bg-sidebar: #161e2f;
  --bg-topbar: rgba(22, 30, 47, 0.95);
  --bg-card: #1f2a3d;
  --bg-subtle: #0f1620;
  --bg-soft: #242f49;
  --bg-input: #0f1620;
  --text-main: #fffdf6;
  --text-muted: #b0b8c0;
  --text-contrast: #161e2f;
  --border-color: #242f49;
  --border-soft: #1f2a3d;
  --accent-soft: #3d4f6f;
  --accent-soft-strong: #576176;
  --accent-text: #fffdf6;
  --danger: #e53935;
}

---
-Úpravy povoleny, ale dejte to pls vědět předem, pak se musí vše překopat

**Poslední Update:** 2026-04-12