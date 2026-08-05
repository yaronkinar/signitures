import type { AppLanguage } from '../i18n'

const FORM_STORAGE_KEY = 'signitures-form-state'

const readPersistedLanguage = (): AppLanguage | null => {
  try {
    const raw = localStorage.getItem(FORM_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { signatureLanguage?: unknown }
    if (parsed?.signatureLanguage === 'en' || parsed?.signatureLanguage === 'he') {
      return parsed.signatureLanguage
    }
    return null
  } catch {
    return null
  }
}

const readBrowserLanguage = (): AppLanguage => {
  if (typeof navigator === 'undefined') return 'he'
  const locale = navigator.language?.toLowerCase() ?? ''
  return locale.startsWith('he') ? 'he' : 'en'
}

/**
 * `/he` and `/he/...` are indexed as the Hebrew locale, so the URL wins over any
 * persisted or browser preference. Without this a Hebrew search result would
 * render in English for returning visitors, which Google treats as a mismatch
 * between the hreflang annotation and the served page.
 */
const readPathLanguage = (): AppLanguage | null => {
  if (typeof location === 'undefined') return null
  const path = location.pathname.toLowerCase()
  if (path === '/he' || path.startsWith('/he/')) return 'he'
  return null
}

export const getInitialUiLanguage = (): AppLanguage =>
  readPathLanguage() ?? readPersistedLanguage() ?? readBrowserLanguage()
