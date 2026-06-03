import { describe, expect, it } from 'vitest'
import {
  alignForHebrew,
  escapeHtml,
  formToSnapshot,
  getOutlookFontAlt,
  getSignatureFontHeadContent,
  hasHebrew,
  normalizeHexColor,
  normalizeUrl,
  outlookFontFamilyStyle,
  parseColorInput,
  parseNumberInput,
  sanitizeFontFamily,
  sanitizeSignatureInlineHtml,
  wrapHtmlDocument
} from './signatureUtils'
import { createTestForm } from '../test/fixtures'

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#039;'
    )
  })
})

describe('hasHebrew', () => {
  it('detects Hebrew letters', () => {
    expect(hasHebrew('ישראל')).toBe(true)
    expect(hasHebrew('Jane Doe')).toBe(false)
    expect(hasHebrew('Mixed ישראל text')).toBe(true)
  })
})

describe('sanitizeFontFamily', () => {
  it('strips dangerous characters and falls back when empty', () => {
    expect(sanitizeFontFamily("'; alert(1);")).toBe("' alert(1)")
    expect(sanitizeFontFamily('   ')).toBe("'Rubik', Arial, Helvetica, sans-serif")
    expect(sanitizeFontFamily("'Rubik', Arial")).toBe("'Rubik', Arial")
  })
})

describe('getOutlookFontAlt', () => {
  it('picks first web-safe face in stack', () => {
    expect(getOutlookFontAlt("'Rubik', Arial, Helvetica, sans-serif")).toBe('Arial')
    expect(getOutlookFontAlt("'Cairo', Tahoma, sans-serif")).toBe('Tahoma')
  })

  it('falls back to last part or Arial', () => {
    expect(getOutlookFontAlt("'CustomFace'")).toBe('CustomFace')
    expect(getOutlookFontAlt('')).toBe('Arial')
  })
})

describe('outlookFontFamilyStyle', () => {
  it('includes mso-font-alt with escaped values', () => {
    expect(outlookFontFamilyStyle("'Rubik', Arial, Helvetica, sans-serif")).toBe(
      "font-family:&#039;Rubik&#039;, Arial, Helvetica, sans-serif;mso-font-alt:Arial;"
    )
  })
})

describe('normalizeHexColor', () => {
  it('normalizes 3- and 6-digit hex', () => {
    expect(normalizeHexColor('abc')).toBe('#aabbcc')
    expect(normalizeHexColor('#88236F')).toBe('#88236f')
    expect(normalizeHexColor('not-a-color')).toBeNull()
  })
})

describe('parseColorInput', () => {
  it('returns fallback for invalid input', () => {
    expect(parseColorInput('not-a-color', '#ffffff')).toBe('#ffffff')
    expect(parseColorInput('#112233', '#ffffff')).toBe('#112233')
    expect(parseColorInput('abc', '#ffffff')).toBe('#aabbcc')
  })
})

describe('parseNumberInput', () => {
  it('clamps and rounds values', () => {
    expect(parseNumberInput('999', 10, 0, 100)).toBe(100)
    expect(parseNumberInput('-5', 10, 0, 100)).toBe(0)
    expect(parseNumberInput('1.234', 1, 0, 2, 2)).toBe(1.23)
    expect(parseNumberInput('nope', 42, 0, 100)).toBe(42)
  })
})

describe('normalizeUrl', () => {
  it('adds https for bare domains', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com')
  })

  it('preserves mailto, tel, data URLs, and existing schemes', () => {
    expect(normalizeUrl('mailto:a@b.com')).toBe('mailto:a@b.com')
    expect(normalizeUrl('tel:+123')).toBe('tel:+123')
    expect(normalizeUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
    expect(normalizeUrl('https://x.com')).toBe('https://x.com')
  })

  it('returns empty for blank input', () => {
    expect(normalizeUrl('   ')).toBe('')
  })
})

describe('sanitizeSignatureInlineHtml', () => {
  it('escapes plain text', () => {
    expect(sanitizeSignatureInlineHtml('Jane & Co')).toBe('Jane &amp; Co')
  })

  it('allows br tags and span color', () => {
    expect(sanitizeSignatureInlineHtml('Line1<br>Line2')).toBe('Line1<br />Line2')
    expect(sanitizeSignatureInlineHtml('<span style="color:#ff0000;">Red</span>')).toBe(
      '<span style="color:#ff0000;">Red</span>'
    )
  })

  it('strips disallowed tags and closes open spans', () => {
    expect(sanitizeSignatureInlineHtml('<script>x</script>ok')).toBe('xok')
    expect(sanitizeSignatureInlineHtml('<span style="color:#f00;">a')).toBe(
      '<span style="color:#ff0000;">a</span>'
    )
  })

  it('converts newlines to br', () => {
    expect(sanitizeSignatureInlineHtml('a\nb')).toBe('a<br />b')
  })
})

describe('wrapHtmlDocument', () => {
  it('wraps body with lang and optional font head', () => {
    const doc = wrapHtmlDocument('<p>sig</p>', 'en', "'Rubik', Arial")
    expect(doc).toContain('<html lang="en">')
    expect(doc).toContain('<p>sig</p>')
    expect(doc).toContain('fonts.googleapis.com')
    expect(doc).toContain('Rubik')
  })
})

describe('getSignatureFontHeadContent', () => {
  it('includes bundled @font-face when base path provided', () => {
    const head = getSignatureFontHeadContent("'Rubik', Arial", {
      bundledFontAssetsBase: 'fonts',
      bundledFontFileNames: ['rubik-latin-400-normal.woff2']
    })
    expect(head).toContain('@font-face')
    expect(head).toContain('fonts/rubik-latin-400-normal.woff2')
  })
})

describe('alignForHebrew', () => {
  it('forces right alignment', () => {
    const aligned = alignForHebrew(
      createTestForm({ textAlign: 'left', nameTitleAlign: 'left', emailAlign: 'left' })
    )
    expect(aligned.textAlign).toBe('right')
    expect(aligned.nameTitleAlign).toBe('right')
    expect(aligned.emailAlign).toBe('right')
  })
})

describe('formToSnapshot', () => {
  it('trims contact fields and uses parsed layout numbers', () => {
    const snapshot = formToSnapshot(
      createTestForm({
        fullName: '  Jane  ',
        email: ' jane@x.com ',
        nameFontSize: '32'
      })
    )
    expect(snapshot.fullName).toBe('Jane')
    expect(snapshot.email).toBe('jane@x.com')
    expect(snapshot.nameFontSize).toBe(32)
  })
})
