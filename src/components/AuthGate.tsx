import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import App from '../App'
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
      <RegisterCloudAuthToken />
      <App />
    </>
  )
}
