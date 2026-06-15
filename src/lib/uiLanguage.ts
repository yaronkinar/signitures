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

export const getInitialUiLanguage = (): AppLanguage =>
  readPersistedLanguage() ?? readBrowserLanguage()
