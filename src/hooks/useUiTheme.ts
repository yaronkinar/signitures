import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_UI_THEME,
  loadStoredUiTheme,
  storeUiTheme,
  type AppUiTheme
} from '../lib/uiTheme'

export const useUiTheme = () => {
  const [uiTheme, setUiThemeState] = useState<AppUiTheme>(() => loadStoredUiTheme())

  useEffect(() => {
    document.documentElement.dataset.uiTheme = uiTheme
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', uiTheme === 'classic' ? '#88236f' : '#006685')
    }
  }, [uiTheme])

  const setUiTheme = useCallback((theme: AppUiTheme) => {
    setUiThemeState(theme)
    storeUiTheme(theme)
  }, [])

  const toggleUiTheme = useCallback(() => {
    setUiTheme(uiTheme === 'classic' ? 'precision' : 'classic')
  }, [setUiTheme, uiTheme])

  return {
    uiTheme,
    setUiTheme,
    toggleUiTheme,
    isClassicTheme: uiTheme === 'classic',
    isPrecisionTheme: uiTheme === 'precision',
    defaultUiTheme: DEFAULT_UI_THEME
  }
}
