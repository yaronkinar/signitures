import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { heIL } from '@clerk/localizations'
import { AuthGate } from './components/AuthGate'
import { UiLanguageProvider, useUiLanguage } from './contexts/UiLanguageContext'
import './App.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error(
    'Missing VITE_CLERK_PUBLISHABLE_KEY. Run `vercel env pull .env.local` after installing the Clerk Marketplace integration.'
  )
}

const LocalizedClerkProvider = ({ children }: { children: ReactNode }) => {
  const { uiLanguage } = useUiLanguage()
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={uiLanguage === 'he' ? heIL : undefined}
    >
      {children}
    </ClerkProvider>
  )
}

const root = document.getElementById('root')
if (!root) {
  throw new Error('Missing #root element')
}

createRoot(root).render(
  <StrictMode>
    <UiLanguageProvider>
      <LocalizedClerkProvider>
        <AuthGate />
      </LocalizedClerkProvider>
    </UiLanguageProvider>
  </StrictMode>
)
