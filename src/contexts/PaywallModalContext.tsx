// src/contexts/PaywallModalContext.tsx
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

export type PaywallRequest = { kind: 'download'; signatureId: string } | { kind: 'pro' }

type PendingUnlock = { resolve: () => void; reject: (error: Error) => void }

type PaywallModalContextValue = {
  isOpen: boolean
  request: PaywallRequest | null
  requestUnlock: (request: PaywallRequest) => Promise<void>
  resolveUnlock: () => void
  closeModal: () => void
}

const PaywallModalContext = createContext<PaywallModalContextValue | null>(null)

export const PaywallModalProvider = ({ children }: { children: ReactNode }) => {
  const [request, setRequest] = useState<PaywallRequest | null>(null)
  const pendingRef = useRef<PendingUnlock | null>(null)

  const requestUnlock = useCallback((next: PaywallRequest): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      pendingRef.current?.reject(new Error('Superseded by a new paywall request'))
      pendingRef.current = { resolve, reject }
      setRequest(next)
    })
  }, [])

  const resolveUnlock = useCallback(() => {
    const pending = pendingRef.current
    pendingRef.current = null
    setRequest(null)
    pending?.resolve()
  }, [])

  const closeModal = useCallback(() => {
    const pending = pendingRef.current
    pendingRef.current = null
    setRequest(null)
    pending?.reject(new Error('Paywall dismissed'))
  }, [])

  return (
    <PaywallModalContext.Provider
      value={{ isOpen: request !== null, request, requestUnlock, resolveUnlock, closeModal }}
    >
      {children}
    </PaywallModalContext.Provider>
  )
}

export const usePaywallModal = (): PaywallModalContextValue => {
  const ctx = useContext(PaywallModalContext)
  if (!ctx) {
    throw new Error('usePaywallModal must be used inside <PaywallModalProvider>')
  }
  return ctx
}
