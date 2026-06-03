import { describe, expect, it } from 'vitest'
import { buildSignatureHtml } from './signatureHtmlBuilder'
import { createTestForm, createTestLayout } from '../test/fixtures'

describe('buildSignatureHtml', () => {
  it('includes Outlook comment and outer presentation table', () => {
    const form = createTestForm({ fullName: 'Jane Doe', email: 'jane@acme.com' })
    const layout = createTestLayout(form)
    const html = buildSignatureHtml(form, layout)

    expect(html).toContain('<!-- Outlook email signature -->')
    expect(html).toContain('role="presentation"')
    expect(html).toContain('Jane Doe')
    expect(html).toContain('jane@acme.com')
  })

  it('uses RTL direction for Hebrew language', () => {
    const form = createTestForm({
      signatureLanguage: 'he',
      fullName: 'ישראל ישראלי',
      jobTitle: 'מנהל',
      company: 'חברה'
    })
    const layout = createTestLayout(form)
    const html = buildSignatureHtml(form, layout)

    expect(html).toContain('dir="rtl"')
  })

  it('uses LTR when English content has no Hebrew', () => {
    const form = createTestForm({
      signatureLanguage: 'en',
      fullName: 'Jane Doe'
    })
    const layout = createTestLayout(form)
    const html = buildSignatureHtml(form, layout)

    expect(html).toMatch(/dir="ltr"/)
    expect(html).not.toContain('dir="rtl"')
  })

  it('escapes XSS in contact fields', () => {
    const form = createTestForm({
      fullName: '<img onerror=alert(1)>',
      phone: '050',
      email: 'a@b.com'
    })
    const layout = createTestLayout(form)
    const html = buildSignatureHtml(form, layout)

    expect(html).not.toContain('<img onerror')
    expect(html).toContain('&lt;img onerror=alert(1)&gt;')
  })

  it('allows sanitized span color in name', () => {
    const form = createTestForm({
      fullName: '<span style="color:#ff0000;">Red Name</span>'
    })
    const layout = createTestLayout(form)
    const html = buildSignatureHtml(form, layout)

    expect(html).toContain('<span style="color:#ff0000;">Red Name</span>')
  })

  it('renders text image slots instead of text rows when provided', () => {
    const form = createTestForm({ fullName: 'Ignored', jobTitle: 'Ignored' })
    const layout = createTestLayout(form)
    const html = buildSignatureHtml(form, layout, {
      textImages: {
        name: {
          dataUrl: 'data:image/png;base64,abc',
          width: 120,
          height: 28,
          alt: 'Jane Doe'
        },
        titleBlock: {
          dataUrl: 'data:image/png;base64,def',
          width: 100,
          height: 40,
          alt: 'Manager'
        }
      }
    })

    expect(html).toContain('data:image/png;base64,abc')
    expect(html).toContain('data:image/png;base64,def')
    expect(html).toContain('alt="Jane Doe"')
    expect(html).not.toContain('Ignored')
  })

  it('includes mso-font-alt in text column styles', () => {
    const form = createTestForm({ fullName: 'Jane' })
    const layout = createTestLayout(form)
    const html = buildSignatureHtml(form, layout)

    expect(html).toContain('mso-font-alt:')
  })

  it('places logo column on the left when logoSide is left', () => {
    const form = createTestForm({
      logoSide: 'left',
      logoUrl: 'https://example.com/logo.png',
      fullName: 'Jane'
    })
    const layout = createTestLayout(form)
    const html = buildSignatureHtml(form, layout)

    const rowContent = html.match(/<tr style="[^"]*">\n\s*([\s\S]*?)\n\s*<\/tr>\s*\n<\/table>/)
    expect(rowContent).not.toBeNull()
    const cells = rowContent![1]
    const logoIndex = cells.indexOf('logo.png')
    const nameIndex = cells.indexOf('Jane')
    expect(logoIndex).toBeGreaterThan(-1)
    expect(nameIndex).toBeGreaterThan(-1)
    expect(logoIndex).toBeLessThan(nameIndex)
  })

  it('normalizes website links without protocol', () => {
    const form = createTestForm({
      fullName: 'Jane',
      website: 'acme.com'
    })
    const layout = createTestLayout(form)
    const html = buildSignatureHtml(form, layout)

    expect(html).toContain('href="https://acme.com"')
    expect(html).toContain('acme.com')
  })
})
