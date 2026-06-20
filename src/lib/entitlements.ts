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

export type CheckoutRequest = { kind: 'download'; signatureId: string } | { kind: 'pro' }

export const createCheckout = async (body: CheckoutRequest): Promise<string | null> => {
  const response = await authedFetch('/api/entitlements/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!response.ok) return null
  const payload = (await response.json()) as { checkoutUrl?: string }
  return typeof payload.checkoutUrl === 'string' ? payload.checkoutUrl : null
}
