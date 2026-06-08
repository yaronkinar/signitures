export type AppUiTheme = 'classic' | 'precision'

export const UI_THEME_STORAGE_KEY = 'signitures-ui-theme'
export const DEFAULT_UI_THEME: AppUiTheme = 'precision'

export const isAppUiTheme = (value: string): value is AppUiTheme =>
  value === 'classic' || value === 'precision'

export const loadStoredUiTheme = (): AppUiTheme => {
  try {
    const stored = localStorage.getItem(UI_THEME_STORAGE_KEY)
    return stored && isAppUiTheme(stored) ? stored : DEFAULT_UI_THEME
  } catch {
    return DEFAULT_UI_THEME
  }
}

export const storeUiTheme = (theme: AppUiTheme): void => {
  try {
    localStorage.setItem(UI_THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore storage failures.
  }
}
