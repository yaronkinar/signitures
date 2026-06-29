import type { VercelRequest, VercelResponse } from '@vercel/node'
import { list } from '@vercel/blob'
import { AuthError, requireAdmin } from './auth'
import { readEntitlements, GLOBAL_PRO_OVERRIDE_PATH } from './entitlements'

const ENTITLEMENTS_PREFIX = 'entitlements/'
const PAGE_SIZE = 25

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    await requireAdmin(req)

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined

    const result = await list({ prefix: ENTITLEMENTS_PREFIX, cursor, limit: PAGE_SIZE })

    const tenantIds = result.blobs
      .map((blob) => blob.pathname)
      .filter((pathname) => pathname !== GLOBAL_PRO_OVERRIDE_PATH)
      .map((pathname) => pathname.slice(ENTITLEMENTS_PREFIX.length, -'.json'.length))

    const tenants = await Promise.all(
      tenantIds.map(async (id) => {
        const entitlements = await readEntitlements(id)
        return { id, active: entitlements.pro.active }
      })
    )

    res.status(200).json({
      tenants,
      nextCursor: result.hasMore ? result.cursor ?? null : null
    })
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'Admin tenants request failed'
    console.error('[admin-tenants]', message, error)
    res.status(500).json({ error: message })
  }
}
