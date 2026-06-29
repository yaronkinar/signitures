import { SignedIn, SignedOut, SignIn, useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { AdminPage } from './AdminPage'
import { setCloudAuthTokenGetter } from '../lib/cloudSignatures'

const RegisterAdminAuthToken = () => {
  const { getToken, isSignedIn } = useAuth()
  useEffect(() => {
    if (!isSignedIn) return
    setCloudAuthTokenGetter(() => getToken())
  }, [getToken, isSignedIn])
  return null
}

export const AdminGate = () => (
  <>
    <SignedIn>
      <RegisterAdminAuthToken />
      <AdminPage />
    </SignedIn>
    <SignedOut>
      <main style={{ maxWidth: 420, margin: '64px auto', padding: '0 16px' }}>
        <h1>Admin sign in</h1>
        <SignIn routing="virtual" />
      </main>
    </SignedOut>
  </>
)
