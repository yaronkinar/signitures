import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import App from '../App'
import { SignInScreen } from './SignInScreen'
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
    <>
      <SignedOut>
        <SignInScreen />
      </SignedOut>
      <SignedIn>
        <RegisterCloudAuthToken />
        <App />
      </SignedIn>
    </>
  )
}
