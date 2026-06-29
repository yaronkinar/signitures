import type { VercelRequest, VercelResponse } from '@vercel/node'
import { AuthError, requireAdmin } from './auth'
import { readGlobalProOverride, writeGlobalProOverride } from './entitlements'

type GlobalProBody = { active?: unknown }

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    await requireAdmin(req)

    if (req.method === 'GET') {
      const override = await readGlobalProOverride()
      res.status(200).json(override)
      return
    }

    if (req.method === 'POST') {
      const body = (req.body ?? {}) as GlobalProBody
      if (typeof body.active !== 'boolean') {
        res.status(400).json({ error: 'active (boolean) is required' })
        return
      }
      await writeGlobalProOverride(body.active)
      res.status(200).json({ active: body.active })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'Admin global-pro request failed'
    console.error('[admin-global-pro]', message, error)
    res.status(500).json({ error: message })
  }
}
