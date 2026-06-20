import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import App from '../App'
import { SignInModal } from './SignInModal'
import { SignInModalProvider } from '../contexts/SignInModalContext'
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
      <RegisterCloudAuthToken />
      <App />
      <SignInModal />
    </SignInModalProvider>
  )
}
