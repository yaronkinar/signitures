import { describe, expect, it } from 'vitest'
import {
  GLOBAL_PRO_OVERRIDE_PATH,
  defaultEntitlements,
  defaultGlobalProOverride,
  entitlementsPath,
  isPro
} from './entitlements'

describe('defaultEntitlements', () => {
  it('returns free tier with no unlocked signatures', () => {
    expect(defaultEntitlements()).toEqual({
      version: 1,
      pro: { active: false },
      unlockedSignatureIds: []
    })
  })
})

describe('entitlementsPath', () => {
  it('writes under entitlements/<tenantId>.json', () => {
    expect(entitlementsPath('domain:acme.com')).toBe('entitlements/domain:acme.com.json')
  })

  it('works for user tenants', () => {
    expect(entitlementsPath('user:user_42')).toBe('entitlements/user:user_42.json')
  })
})

describe('isPro', () => {
  it('returns true when pro.active is true', () => {
    expect(isPro({ version: 1, pro: { active: true }, unlockedSignatureIds: [] })).toBe(true)
  })

  it('returns false when pro.active is false', () => {
    expect(isPro({ version: 1, pro: { active: false }, unlockedSignatureIds: [] })).toBe(false)
  })
})

describe('GLOBAL_PRO_OVERRIDE_PATH', () => {
  it('points at a fixed path', () => {
    expect(GLOBAL_PRO_OVERRIDE_PATH).toBe('entitlements/_global-pro-override.json')
  })
})

describe('defaultGlobalProOverride', () => {
  it('defaults to inactive', () => {
    expect(defaultGlobalProOverride()).toEqual({ active: false })
  })
})
