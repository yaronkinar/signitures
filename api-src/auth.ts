import type { VercelRequest } from '@vercel/node'
import { createClerkClient, verifyToken } from '@clerk/backend'
import { validateTenantId } from './signatureBlobShared'

export type AuthedUser = { userId: string; email: string }
export type Tenant = { id: string }

export class AuthError extends Error {
  status = 401
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'aol.com'
])

export const resolveTenant = (user: AuthedUser): Tenant => {
  const at = user.email.lastIndexOf('@')
  if (at < 1 || at === user.email.length - 1) {
    throw new Error(`Email "${user.email}" has no domain`)
  }
  const domain = user.email.slice(at + 1).toLowerCase()
  const id = FREE_EMAIL_DOMAINS.has(domain)
    ? `user:${user.userId}`
    : `domain:${domain}`
  if (!validateTenantId(id)) {
    throw new Error(`Computed tenant id "${id}" failed validation`)
  }
  return { id }
}

const getBearerToken = (req: VercelRequest): string | null => {
  const header = req.headers.authorization
  if (typeof header !== 'string') return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match ? match[1].trim() : null
}

let cachedClerk: ReturnType<typeof createClerkClient> | null = null
const getClerk = () => {
  if (cachedClerk) return cachedClerk
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) throw new AuthError('Auth is not configured on the server')
  cachedClerk = createClerkClient({ secretKey })
  return cachedClerk
}

export const requireUser = async (req: VercelRequest): Promise<AuthedUser> => {
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) throw new AuthError('Auth is not configured on the server')

  const token = getBearerToken(req)
  if (!token) throw new AuthError('Not signed in')

  let payload
  try {
    payload = await verifyToken(token, { secretKey })
  } catch {
    throw new AuthError('Invalid or expired session')
  }

  const userId = typeof payload.sub === 'string' ? payload.sub : ''
  if (!userId) throw new AuthError('Invalid session payload')

  const clerk = getClerk()
  const user = await clerk.users.getUser(userId)
  const primary = user.emailAddresses.find(
    (address) => address.id === user.primaryEmailAddressId && address.verification?.status === 'verified'
  )
  if (!primary?.emailAddress) throw new AuthError('No verified email on this account')

  return { userId, email: primary.emailAddress }
}
