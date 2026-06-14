import { SignedIn, SignedOut } from '@clerk/clerk-react'
import App from '../App'
import { SignInScreen } from './SignInScreen'

export const AuthGate = () => {
  return (
    <>
      <SignedOut>
        <SignInScreen />
      </SignedOut>
      <SignedIn>
        <App />
      </SignedIn>
    </>
  )
}
