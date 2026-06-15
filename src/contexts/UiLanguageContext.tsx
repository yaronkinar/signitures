import { createContext, useContext, useState, type ReactNode } from 'react'
import type { AppLanguage } from '../i18n'
import { getInitialUiLanguage } from '../lib/uiLanguage'

type UiLanguageContextValue = {
  uiLanguage: AppLanguage
  setUiLanguage: (lang: AppLanguage) => void
}

const UiLanguageContext = createContext<UiLanguageContextValue | null>(null)

export const UiLanguageProvider = ({ children }: { children: ReactNode }) => {
  const [uiLanguage, setUiLanguage] = useState<AppLanguage>(getInitialUiLanguage)
  return (
    <UiLanguageContext.Provider value={{ uiLanguage, setUiLanguage }}>
      {children}
    </UiLanguageContext.Provider>
  )
}

export const useUiLanguage = (): UiLanguageContextValue => {
  const ctx = useContext(UiLanguageContext)
  if (!ctx) {
    throw new Error('useUiLanguage must be used inside <UiLanguageProvider>')
  }
  return ctx
}
