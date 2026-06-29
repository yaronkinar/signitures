import type { VercelRequest, VercelResponse } from '@vercel/node'
import { AuthError, getClerk, requireAdmin, resolveTenant } from './auth'
import { readEntitlements, writeEntitlements } from './entitlements'
import { validateTenantId } from './signatureBlobShared'

type SetProBody = { email?: unknown; tenantId?: unknown; active?: unknown }

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    await requireAdmin(req)

    const body = (req.body ?? {}) as SetProBody
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const rawTenantId = typeof body.tenantId === 'string' ? body.tenantId.trim() : ''
    const active = typeof body.active === 'boolean' ? body.active : undefined

    if (active === undefined || (!email && !rawTenantId)) {
      res.status(400).json({ error: 'active (boolean) and either email or tenantId are required' })
      return
    }

    let tenantId: string
    let resolvedEmail: string | undefined

    if (rawTenantId) {
      if (!validateTenantId(rawTenantId)) {
        res.status(400).json({ error: 'Invalid tenantId' })
        return
      }
      tenantId = rawTenantId
    } else {
      const clerk = getClerk()
      const { data: users } = await clerk.users.getUserList({ emailAddress: [email] })
      const found = users[0]
      if (!found) {
        res.status(404).json({ error: 'No account found for that email' })
        return
      }

      const primary = found.emailAddresses.find(
        (address) => address.id === found.primaryEmailAddressId
      )
      resolvedEmail = primary?.emailAddress ?? email
      tenantId = resolveTenant({ userId: found.id, email: resolvedEmail }).id
    }

    const entitlements = await readEntitlements(tenantId)
    await writeEntitlements(tenantId, {
      ...entitlements,
      pro: { ...entitlements.pro, active }
    })

    res.status(200).json({ tenantId, email: resolvedEmail, active })
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'Admin set-pro request failed'
    console.error('[admin-set-pro]', message, error)
    res.status(500).json({ error: message })
  }
}
