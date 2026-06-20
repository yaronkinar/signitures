import type { VercelRequest, VercelResponse } from '@vercel/node'
import { AuthError, requireUser, resolveTenant } from './auth'
import { createLemonCheckout } from './lemonsqueezy'
import { validateSaveId } from './signatureBlobShared'

const parseJsonBody = (body: unknown): Record<string, unknown> => {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>
  }
  if (typeof body === 'string' && body.trim()) {
    try {
      const parsed = JSON.parse(body) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // fall through
    }
  }
  return {}
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const user = await requireUser(req)
    const tenant = resolveTenant(user)

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const body = parseJsonBody(req.body)
    const kind = body.kind === 'pro' ? 'pro' : body.kind === 'download' ? 'download' : null
    if (!kind) {
      res.status(400).json({ error: 'Invalid kind' })
      return
    }

    if (kind === 'download') {
      const signatureId = typeof body.signatureId === 'string' ? body.signatureId : ''
      if (!validateSaveId(signatureId)) {
        res.status(400).json({ error: 'Invalid signatureId' })
        return
      }
      const variantId = process.env.LEMONSQUEEZY_VARIANT_ID_DOWNLOAD
      if (!variantId) {
        res.status(500).json({ error: 'LEMONSQUEEZY_VARIANT_ID_DOWNLOAD is not set on the server' })
        return
      }
      const checkoutUrl = await createLemonCheckout(variantId, {
        tenantId: tenant.id,
        userId: user.userId,
        signatureId
      })
      res.status(200).json({ checkoutUrl })
      return
    }

    const variantId = process.env.LEMONSQUEEZY_VARIANT_ID_PRO
    if (!variantId) {
      res.status(500).json({ error: 'LEMONSQUEEZY_VARIANT_ID_PRO is not set on the server' })
      return
    }
    const checkoutUrl = await createLemonCheckout(variantId, { tenantId: tenant.id, userId: user.userId })
    res.status(200).json({ checkoutUrl })
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'Checkout request failed'
    console.error('[entitlements-checkout]', message, error)
    res.status(500).json({ error: message })
  }
}
