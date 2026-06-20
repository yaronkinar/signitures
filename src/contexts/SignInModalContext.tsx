import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'

type PendingSignIn = { resolve: () => void; reject: (error: Error) => void }

type SignInModalContextValue = {
  isOpen: boolean
  ensureSignedIn: () => Promise<void>
  closeModal: () => void
}

const SignInModalContext = createContext<SignInModalContextValue | null>(null)

export const SignInModalProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const pendingRef = useRef<PendingSignIn[]>([])

  useEffect(() => {
    if (!isSignedIn) return
    if (pendingRef.current.length === 0) return
    const pending = pendingRef.current
    pendingRef.current = []
    setIsOpen(false)
    pending.forEach((entry) => entry.resolve())
  }, [isSignedIn])

  const ensureSignedIn = useCallback((): Promise<void> => {
    if (isSignedIn) return Promise.resolve()
    return new Promise<void>((resolve, reject) => {
      pendingRef.current.push({ resolve, reject })
      setIsOpen(true)
    })
  }, [isSignedIn])

  const closeModal = useCallback(() => {
    const pending = pendingRef.current
    pendingRef.current = []
    setIsOpen(false)
    pending.forEach((entry) => entry.reject(new Error('Sign-in dismissed')))
  }, [])

  return (
    <SignInModalContext.Provider value={{ isOpen, ensureSignedIn, closeModal }}>
      {children}
    </SignInModalContext.Provider>
  )
}

export const useSignInModal = (): SignInModalContextValue => {
  const ctx = useContext(SignInModalContext)
  if (!ctx) {
    throw new Error('useSignInModal must be used inside <SignInModalProvider>')
  }
  return ctx
}
