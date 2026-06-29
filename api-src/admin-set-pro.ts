import type { VercelRequest, VercelResponse } from '@vercel/node'
import { AuthError, getClerk, requireAdmin, resolveTenant } from './auth'
import { readEntitlements, writeEntitlements } from './entitlements'

type SetProBody = { email?: unknown; active?: unknown }

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    await requireAdmin(req)

    const body = (req.body ?? {}) as SetProBody
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const active = typeof body.active === 'boolean' ? body.active : undefined
    if (!email || active === undefined) {
      res.status(400).json({ error: 'email (string) and active (boolean) are required' })
      return
    }

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
    const resolvedEmail = primary?.emailAddress ?? email
    const tenant = resolveTenant({ userId: found.id, email: resolvedEmail })

    const entitlements = await readEntitlements(tenant.id)
    await writeEntitlements(tenant.id, {
      ...entitlements,
      pro: { ...entitlements.pro, active }
    })

    res.status(200).json({ tenantId: tenant.id, email: resolvedEmail, active })
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
