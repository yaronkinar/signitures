import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { fetchEntitlements, type EntitlementsResponse, type EntitlementsTier } from '../lib/entitlements'

export type EntitlementsContextValue = {
  tier: EntitlementsTier
  isPro: boolean
  unlockedSignatureIds: string[]
  refresh: () => Promise<EntitlementsResponse>
  pollUntilUnlocked: (predicate: (unlockedSignatureIds: string[], isPro: boolean) => boolean) => Promise<boolean>
}

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null)

const POLL_INTERVAL_MS = 1500
const POLL_TIMEOUT_MS = 10000

export const EntitlementsProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn } = useAuth()
  const [tier, setTier] = useState<EntitlementsTier>('free')
  const [unlockedSignatureIds, setUnlockedSignatureIds] = useState<string[]>([])
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refresh = useCallback(async (): Promise<EntitlementsResponse> => {
    if (!isSignedIn) {
      setTier('free')
      setUnlockedSignatureIds([])
      return { tier: 'free', unlockedSignatureIds: [] }
    }
    const result = await fetchEntitlements()
    if (!mountedRef.current) return result
    setTier(result.tier)
    setUnlockedSignatureIds(result.unlockedSignatureIds)
    return result
  }, [isSignedIn])

  useEffect(() => {
    refresh().catch(() => undefined)
  }, [refresh])

  const pollUntilUnlocked = useCallback(
    async (predicate: (unlockedSignatureIds: string[], isPro: boolean) => boolean): Promise<boolean> => {
      const deadline = Date.now() + POLL_TIMEOUT_MS
      while (Date.now() < deadline) {
        const result = await fetchEntitlements()
        if (!mountedRef.current) return false
        setTier(result.tier)
        setUnlockedSignatureIds(result.unlockedSignatureIds)
        if (predicate(result.unlockedSignatureIds, result.tier === 'pro')) return true
        await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS))
      }
      return false
    },
    []
  )

  return (
    <EntitlementsContext.Provider
      value={{ tier, isPro: tier === 'pro', unlockedSignatureIds, refresh, pollUntilUnlocked }}
    >
      {children}
    </EntitlementsContext.Provider>
  )
}

export const useEntitlementsContext = (): EntitlementsContextValue => {
  const ctx = useContext(EntitlementsContext)
  if (!ctx) {
    throw new Error('useEntitlementsContext must be used inside <EntitlementsProvider>')
  }
  return ctx
}
