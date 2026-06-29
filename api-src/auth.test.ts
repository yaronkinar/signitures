import { describe, expect, it } from 'vitest'
import { AuthError, resolveTenant } from './auth'

describe('resolveTenant', () => {
  it('derives a domain tenant from a business email', () => {
    expect(resolveTenant({ userId: 'user_1', email: 'alice@acme.com' })).toEqual({
      id: 'domain:acme.com'
    })
  })

  it('lowercases the domain', () => {
    expect(resolveTenant({ userId: 'user_1', email: 'Alice@ACME.com' })).toEqual({
      id: 'domain:acme.com'
    })
  })

  it('keeps subdomains distinct', () => {
    expect(resolveTenant({ userId: 'user_1', email: 'bob@mail.acme.com' })).toEqual({
      id: 'domain:mail.acme.com'
    })
  })

  it('routes gmail.com to a per-user tenant', () => {
    expect(resolveTenant({ userId: 'user_42', email: 'bob@gmail.com' })).toEqual({
      id: 'user:user_42'
    })
  })

  it('routes outlook.com to a per-user tenant', () => {
    expect(resolveTenant({ userId: 'user_42', email: 'bob@outlook.com' })).toEqual({
      id: 'user:user_42'
    })
  })

  it('routes proton.me to a per-user tenant', () => {
    expect(resolveTenant({ userId: 'user_42', email: 'bob@proton.me' })).toEqual({
      id: 'user:user_42'
    })
  })

  it('throws if email has no domain', () => {
    expect(() => resolveTenant({ userId: 'user_1', email: 'no-at-sign' })).toThrow()
  })

  it('throws if the computed tenant id contains illegal characters', () => {
    expect(() =>
      resolveTenant({ userId: 'user has spaces', email: 'bob@gmail.com' })
    ).toThrow(/failed validation/)
  })
})

describe('AuthError', () => {
  it('defaults to a 401 status', () => {
    expect(new AuthError('Not signed in').status).toBe(401)
  })

  it('accepts a custom status', () => {
    expect(new AuthError('Forbidden', 403).status).toBe(403)
  })
})
