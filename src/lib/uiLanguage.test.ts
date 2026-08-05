import { afterEach, describe, expect, it } from 'vitest'
import { getInitialUiLanguage } from './uiLanguage'

const FORM_STORAGE_KEY = 'signitures-form-state'

const setPath = (path: string): void => {
  history.replaceState(null, '', path)
}

const persistLanguage = (lang: string): void => {
  localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify({ signatureLanguage: lang }))
}

afterEach(() => {
  localStorage.clear()
  setPath('/')
})

describe('getInitialUiLanguage', () => {
  it('returns he for the /he locale root', () => {
    setPath('/he')
    expect(getInitialUiLanguage()).toBe('he')
  })

  it('returns he for nested /he paths', () => {
    setPath('/he/guides/outlook-email-signature')
    expect(getInitialUiLanguage()).toBe('he')
  })

  it('lets the /he path override a persisted English preference', () => {
    persistLanguage('en')
    setPath('/he')
    expect(getInitialUiLanguage()).toBe('he')
  })

  it('falls back to the persisted preference outside /he', () => {
    persistLanguage('en')
    setPath('/')
    expect(getInitialUiLanguage()).toBe('en')
  })

  it('does not treat paths merely starting with "he" as Hebrew', () => {
    persistLanguage('en')
    setPath('/help')
    expect(getInitialUiLanguage()).toBe('en')
  })
})
