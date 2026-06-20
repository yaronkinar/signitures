import { authedFetch } from './cloudSignatures'

export type EntitlementsTier = 'free' | 'pro'

export type EntitlementsResponse = {
  tier: EntitlementsTier
  unlockedSignatureIds: string[]
}

export const fetchEntitlements = async (): Promise<EntitlementsResponse> => {
  const response = await authedFetch('/api/entitlements')
  if (!response.ok) {
    return { tier: 'free', unlockedSignatureIds: [] }
  }
  const payload = (await response.json()) as Partial<EntitlementsResponse>
  return {
    tier: payload.tier === 'pro' ? 'pro' : 'free',
    unlockedSignatureIds: Array.isArray(payload.unlockedSignatureIds) ? payload.unlockedSignatureIds : []
  }
}
