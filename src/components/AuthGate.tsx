import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import App from '../App'
import { SignInModal } from './SignInModal'
import { PaywallModal } from './PaywallModal'
import { SignInModalProvider } from '../contexts/SignInModalContext'
import { EntitlementsProvider } from '../contexts/EntitlementsContext'
import { PaywallModalProvider } from '../contexts/PaywallModalContext'
import { setCloudAuthTokenGetter } from '../lib/cloudSignatures'

const RegisterCloudAuthToken = () => {
  const { getToken, isSignedIn } = useAuth()
  useEffect(() => {
    if (!isSignedIn) return
    setCloudAuthTokenGetter(() => getToken())
  }, [getToken, isSignedIn])
  return null
}

export const AuthGate = () => {
  return (
    <SignInModalProvider>
      <EntitlementsProvider>
        <PaywallModalProvider>
          <RegisterCloudAuthToken />
          <App />
          <SignInModal />
          <PaywallModal />
        </PaywallModalProvider>
      </EntitlementsProvider>
    </SignInModalProvider>
  )
}
