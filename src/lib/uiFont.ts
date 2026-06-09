export type UiFontOption = {
  id: string
  label: string
  stack: string
}

const HEBREW_FALLBACK = "'Heebo', 'Assistant', 'Noto Sans Hebrew'"
const SYSTEM_FALLBACK =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"

export const DEFAULT_UI_FONT_ID = 'default'

export const UI_FONT_OPTIONS: UiFontOption[] = [
  { id: 'default', label: 'Default', stack: '' },
  { id: 'rubik', label: 'Rubik', stack: `'Rubik', ${HEBREW_FALLBACK}, ${SYSTEM_FALLBACK}` },
  { id: 'heebo', label: 'Heebo', stack: `'Heebo', ${HEBREW_FALLBACK}, ${SYSTEM_FALLBACK}` },
  {
    id: 'assistant',
    label: 'Assistant',
    stack: `'Assistant', ${HEBREW_FALLBACK}, ${SYSTEM_FALLBACK}`
  },
  {
    id: 'opensans',
    label: 'Open Sans',
    stack: `'Open Sans', ${HEBREW_FALLBACK}, ${SYSTEM_FALLBACK}`
  },
  { id: 'inter', label: 'Inter', stack: `'Inter', ${HEBREW_FALLBACK}, ${SYSTEM_FALLBACK}` },
  { id: 'lexend', label: 'Lexend', stack: `'Lexend', ${HEBREW_FALLBACK}, ${SYSTEM_FALLBACK}` }
]

export const MIN_UI_FONT_SCALE = 80
export const MAX_UI_FONT_SCALE = 140
export const UI_FONT_SCALE_STEP = 10
export const DEFAULT_UI_FONT_SCALE = 100

export const UI_FONT_ID_STORAGE_KEY = 'signitures-ui-font'
export const UI_FONT_SCALE_STORAGE_KEY = 'signitures-ui-font-scale'

export const getUiFontOption = (id: string): UiFontOption =>
  UI_FONT_OPTIONS.find((option) => option.id === id) ?? UI_FONT_OPTIONS[0]

export const clampUiFontScale = (value: number): number => {
  if (!Number.isFinite(value)) return DEFAULT_UI_FONT_SCALE
  const rounded = Math.round(value / UI_FONT_SCALE_STEP) * UI_FONT_SCALE_STEP
  return Math.min(MAX_UI_FONT_SCALE, Math.max(MIN_UI_FONT_SCALE, rounded))
}

export const loadStoredUiFontId = (): string => {
  try {
    const stored = localStorage.getItem(UI_FONT_ID_STORAGE_KEY)
    return stored && UI_FONT_OPTIONS.some((option) => option.id === stored)
      ? stored
      : DEFAULT_UI_FONT_ID
  } catch {
    return DEFAULT_UI_FONT_ID
  }
}

export const loadStoredUiFontScale = (): number => {
  try {
    const stored = localStorage.getItem(UI_FONT_SCALE_STORAGE_KEY)
    return stored ? clampUiFontScale(Number(stored)) : DEFAULT_UI_FONT_SCALE
  } catch {
    return DEFAULT_UI_FONT_SCALE
  }
}

export const storeUiFontId = (id: string): void => {
  try {
    localStorage.setItem(UI_FONT_ID_STORAGE_KEY, id)
  } catch {
    // Ignore storage failures.
  }
}

export const storeUiFontScale = (scale: number): void => {
  try {
    localStorage.setItem(UI_FONT_SCALE_STORAGE_KEY, String(scale))
  } catch {
    // Ignore storage failures.
  }
}

export const buildUiFontCss = (fontId: string, scale: number): string => {
  const option = getUiFontOption(fontId)
  const rules: string[] = []

  if (option.stack) {
    rules.push(
      `:root[data-ui-theme]{--font-body:${option.stack};--font-headline:${option.stack};--font-label:${option.stack};}`
    )
    rules.push(`html[data-ui-theme] body{font-family:${option.stack} !important;}`)
  }

  if (scale !== DEFAULT_UI_FONT_SCALE) {
    rules.push(`.app-shell{zoom:${scale / 100};}`)
  }

  return rules.join('\n')
}
