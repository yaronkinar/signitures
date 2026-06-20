import { useSignInModal } from '../contexts/SignInModalContext'

export const useRequireSignIn = () => {
  const { ensureSignedIn } = useSignInModal()
  return { ensureSignedIn }
}
