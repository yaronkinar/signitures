import { describe, expect, it } from 'vitest'
import { manifestPath, validateTenantId, zipPath } from './signatureBlobShared'

describe('validateTenantId', () => {
  it('accepts domain tenants', () => {
    expect(validateTenantId('domain:acme.com')).toBe(true)
    expect(validateTenantId('domain:mail.acme.co.uk')).toBe(true)
  })

  it('accepts user tenants', () => {
    expect(validateTenantId('user:user_2abc123')).toBe(true)
    expect(validateTenantId('user:user_ABC-123_xyz')).toBe(true)
  })

  it('rejects empty or malformed ids', () => {
    expect(validateTenantId('')).toBe(false)
    expect(validateTenantId('domain:')).toBe(false)
    expect(validateTenantId('user:')).toBe(false)
    expect(validateTenantId('acme.com')).toBe(false)
    expect(validateTenantId('domain:UPPER.com')).toBe(false)
    expect(validateTenantId('domain:acme.com/extra')).toBe(false)
    expect(validateTenantId('user:has spaces')).toBe(false)
  })
})

describe('manifestPath / zipPath', () => {
  it('writes manifests under signatures/tenants/<tenantId>/', () => {
    expect(manifestPath('domain:acme.com')).toBe(
      'signatures/tenants/domain:acme.com/manifest.json'
    )
  })

  it('writes zips under signatures/tenants/<tenantId>/<saveId>.zip', () => {
    expect(zipPath('user:user_42', 'abc-123')).toBe(
      'signatures/tenants/user:user_42/abc-123.zip'
    )
  })
})
