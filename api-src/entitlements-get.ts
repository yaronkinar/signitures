import type { VercelRequest, VercelResponse } from '@vercel/node'
import { AuthError, requireUser, resolveTenant } from './auth'
import { isPro, readEntitlements } from './entitlements'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const user = await requireUser(req)
    const tenant = resolveTenant(user)

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const entitlements = await readEntitlements(tenant.id)
    res.status(200).json({
      tier: isPro(entitlements) ? 'pro' : 'free',
      unlockedSignatureIds: entitlements.unlockedSignatureIds
    })
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'Entitlements request failed'
    console.error('[entitlements]', message, error)
    res.status(500).json({ error: message })
  }
}
