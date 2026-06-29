import { get, put } from '@vercel/blob'

export type Entitlements = {
  version: 1
  pro: { active: boolean; subscriptionId?: string; renewsAt?: number }
  unlockedSignatureIds: string[]
}

export const defaultEntitlements = (): Entitlements => ({
  version: 1,
  pro: { active: false },
  unlockedSignatureIds: []
})

export const entitlementsPath = (tenantId: string): string => `entitlements/${tenantId}.json`

export const isPro = (entitlements: Entitlements): boolean => entitlements.pro.active

export const readEntitlements = async (tenantId: string): Promise<Entitlements> => {
  try {
    const pathname = entitlementsPath(tenantId)
    const result = await get(pathname, { access: 'private' })
    if (!result || result.statusCode !== 200 || !result.stream) {
      return defaultEntitlements()
    }
    const text = await new Response(result.stream).text()
    const parsed = JSON.parse(text) as Entitlements
    if (parsed?.version !== 1 || typeof parsed.pro !== 'object' || !Array.isArray(parsed.unlockedSignatureIds)) {
      return defaultEntitlements()
    }
    return {
      version: 1,
      pro: {
        active: Boolean(parsed.pro.active),
        subscriptionId: typeof parsed.pro.subscriptionId === 'string' ? parsed.pro.subscriptionId : undefined,
        renewsAt: typeof parsed.pro.renewsAt === 'number' ? parsed.pro.renewsAt : undefined
      },
      unlockedSignatureIds: parsed.unlockedSignatureIds.filter((id) => typeof id === 'string')
    }
  } catch {
    return defaultEntitlements()
  }
}

export const writeEntitlements = async (tenantId: string, next: Entitlements): Promise<void> => {
  await put(entitlementsPath(tenantId), JSON.stringify(next), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  })
}

export type GlobalProOverride = { active: boolean }

export const GLOBAL_PRO_OVERRIDE_PATH = 'entitlements/_global-pro-override.json'

export const defaultGlobalProOverride = (): GlobalProOverride => ({ active: false })

export const readGlobalProOverride = async (): Promise<GlobalProOverride> => {
  try {
    const result = await get(GLOBAL_PRO_OVERRIDE_PATH, { access: 'private' })
    if (!result || result.statusCode !== 200 || !result.stream) {
      return defaultGlobalProOverride()
    }
    const text = await new Response(result.stream).text()
    const parsed = JSON.parse(text) as GlobalProOverride
    return { active: Boolean(parsed?.active) }
  } catch {
    return defaultGlobalProOverride()
  }
}

export const writeGlobalProOverride = async (active: boolean): Promise<void> => {
  await put(GLOBAL_PRO_OVERRIDE_PATH, JSON.stringify({ active }), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  })
}
