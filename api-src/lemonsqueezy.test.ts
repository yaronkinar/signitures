import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyLemonSqueezySignature } from './lemonsqueezy'

describe('verifyLemonSqueezySignature', () => {
  const secret = 'test-secret'
  const body = JSON.stringify({ meta: { event_name: 'order_created' } })

  it('accepts a signature computed with the correct secret', () => {
    const signature = createHmac('sha256', secret).update(body).digest('hex')
    expect(verifyLemonSqueezySignature(body, signature, secret)).toBe(true)
  })

  it('rejects a signature computed with the wrong secret', () => {
    const signature = createHmac('sha256', 'wrong-secret').update(body).digest('hex')
    expect(verifyLemonSqueezySignature(body, signature, secret)).toBe(false)
  })

  it('rejects a missing signature header', () => {
    expect(verifyLemonSqueezySignature(body, undefined, secret)).toBe(false)
  })

  it('rejects a tampered body', () => {
    const signature = createHmac('sha256', secret).update(body).digest('hex')
    expect(verifyLemonSqueezySignature(`${body}tampered`, signature, secret)).toBe(false)
  })
})
