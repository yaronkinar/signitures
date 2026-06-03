import { describe, expect, it } from 'vitest'
import { toOutlookSignatureFileBase, toPlainTextSignature } from './outlookSignaturePackage'
import { createTestForm } from '../test/fixtures'

describe('toOutlookSignatureFileBase', () => {
  it('prefers ASCII outlookSignatureName', () => {
    expect(toOutlookSignatureFileBase('ישראל', 'israel@x.com', 'Israel Israeli')).toBe(
      'Israel Israeli'
    )
  })

  it('uses ASCII full name when available', () => {
    expect(toOutlookSignatureFileBase('Jane Doe', 'jane@x.com')).toBe('Jane Doe')
  })

  it('derives name from email local part for Hebrew names', () => {
    expect(toOutlookSignatureFileBase('ישראל ישראלי', 'israel.cohen@company.com')).toBe(
      'israel cohen'
    )
  })

  it('transliterates Hebrew full name when email is not usable', () => {
    const base = toOutlookSignatureFileBase('ישראל', '')
    expect(base).toMatch(/^[A-Za-z0-9._\s-]+$/)
    expect(base.length).toBeGreaterThan(1)
  })

  it('transliterates Hebrew names to ASCII file bases', () => {
    const base = toOutlookSignatureFileBase('ישראל ישראלי', '')
    expect(base).toMatch(/^[A-Za-z0-9._\s-]+$/)
    expect(toOutlookSignatureFileBase('ישראל ישראלי', '')).toBe(base)
  })

  it('returns hash when transliteration is too short', () => {
    expect(toOutlookSignatureFileBase('א', '')).toMatch(/^Signature-/)
  })
})

describe('toPlainTextSignature', () => {
  it('includes contact lines in order', () => {
    const text = toPlainTextSignature(
      createTestForm({
        signatureLanguage: 'en',
        fullName: 'Jane Doe',
        jobTitle: 'Manager',
        company: 'Acme',
        phone: '555',
        email: 'jane@acme.com',
        website: 'https://acme.com'
      })
    )

    expect(text).toContain('Jane Doe')
    expect(text).toContain('Manager')
    expect(text).toContain('Acme')
    expect(text).toContain('555')
    expect(text).toContain('jane@acme.com')
    expect(text).toContain('acme.com')
  })
})
