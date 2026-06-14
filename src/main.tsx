import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { AuthGate } from './components/AuthGate'
import './App.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error(
    'Missing VITE_CLERK_PUBLISHABLE_KEY. Run `vercel env pull .env.local` after installing the Clerk Marketplace integration.'
  )
}

const root = document.getElementById('root')
if (!root) {
  throw new Error('Missing #root element')
}

createRoot(root).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey}>
      <AuthGate />
    </ClerkProvider>
  </StrictMode>
)
